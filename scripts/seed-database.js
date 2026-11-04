const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

// Load .env variables safely without requiring third-party dotenv
try {
  require('dotenv').config();
} catch {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

const url =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  process.env.EXPO_SUPABASE_PROJECT_URL ||
  'https://hncwrjcilvfqaczwlglk.supabase.co';

const key =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.EXPO_SUPABASE_ANON_KEY ||
  'sb_publishable_rn5YLWLNxtbjOP3AwzSf0Q__17FM_FA';

const supabase = createClient(url, key);

async function seed() {
  console.log(`Connecting to Supabase at ${url}...`);

  // Load mock items
  const mockFile = fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'mock-items.ts'), 'utf8');
  const js = ts.transpile(mockFile, { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS });

  const moduleObj = { exports: {} };
  const fn = new Function('exports', 'require', js);
  fn(moduleObj.exports, (mod) => {
    if (mod === '@/types/item') return {};
    return require(mod);
  });

  const items = moduleObj.exports.MOCK_ITEMS || [];
  console.log(`Found ${items.length} items to seed.`);

  for (const item of items) {
    const payload = {
      id: item.id,
      title: item.title,
      description: item.description || '',
      price: item.price,
      trade_type: item.tradeType,
      category: item.category,
      condition: item.condition,
      course_tag: item.courseTag || null,
      year_level: item.yearLevel || null,
      campus: item.campus,
      safe_meetup_spot: item.safeMeetupSpot,
      seller_name: item.sellerName,
      seller_rating: item.sellerRating,
      seller_year: item.sellerYear,
      is_verified_student: item.isVerifiedStudent,
      seller_avatar_uri: item.sellerAvatarUri || null,
      is_reserved: item.isReserved ?? false,
      is_urgent: item.isUrgent ?? false,
      bump_count: item.bumpCount ?? 0,
      last_bumped_at: item.lastBumpedAt || null,
      views_count: item.viewsCount ?? 0,
      inquiries_count: item.inquiriesCount ?? 0,
      status: item.status || 'active',
      created_at: item.createdAt || 'Just now',
      image_url: item.imageUrl || null,
      photos: item.photos || [],
      estimated_co2_saved_kg: item.estimatedCo2SavedKg,
    };

    const { error } = await supabase.from('items').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.warn(`Failed to seed item ${item.id}:`, error.message);
    } else {
      console.log(`✓ Seeded ${item.title.substring(0, 30)}...`);
    }
  }

  console.log('Seeding process completed!');
}

seed().catch(console.error);

