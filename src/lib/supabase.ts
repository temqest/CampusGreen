import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  process.env.EXPO_SUPABASE_PROJECT_URL ||
  'https://hncwrjcilvfqaczwlglk.supabase.co';

const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.EXPO_SUPABASE_ANON_KEY ||
  'sb_publishable_rn5YLWLNxtbjOP3AwzSf0Q__17FM_FA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export const STORAGE_BUCKET = 'product-items';

/**
 * Uploads an image URI (local file URI or web blob) to the Supabase Storage bucket 'product-items'
 * and returns the public CDN URL.
 */
export async function uploadImageToSupabase(
  uri: string,
  folder: string = 'listings'
): Promise<string> {
  // If it's already an external HTTPS URL (e.g. Unsplash sample), keep it
  if (uri.startsWith('http://') || (uri.startsWith('https://') && !uri.startsWith('blob:'))) {
    return uri;
  }

  try {
    const response = await fetch(uri);
    const blob = await response.blob();

    // Determine clean file extension
    const urlParts = uri.split('.');
    const rawExt = urlParts[urlParts.length - 1]?.split(/[#?]/)[0]?.toLowerCase() || 'jpg';
    const extension = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(rawExt) ? rawExt : 'jpg';
    const mimeType = extension === 'jpg' || extension === 'jpeg' ? 'image/jpeg' : `image/${extension}`;

    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${extension}`;

    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(fileName, blob, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) {
      console.warn('Supabase storage upload error:', error.message);
      return uri; // Return uri as fallback so UI remains functional
    }

    const { data: publicUrlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(data.path);

    return publicUrlData.publicUrl;
  } catch (err) {
    console.warn('Failed to upload image to Supabase:', err);
    return uri;
  }
}

