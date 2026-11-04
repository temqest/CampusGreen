import { supabase } from './supabase';
import { Condition, ItemCategory, MarketplaceItem, TradeType } from '@/types/item';

export interface UserProfile {
  id: string;
  email?: string;
  fullName: string;
  degreeProgram: string;
  yearLevel: string;
  campus: string;
  avatarUrl?: string;
  preferredMeetupSpot: string;
}

/**
 * Returns a deterministic, clean user ID string from an email or username
 * e.g. "student@adnu.edu.ph" -> "user_student_adnu_edu_ph"
 */
export function getStudentUserId(email?: string | null, fallbackName?: string | null): string {
  if (email && email.trim()) {
    const sanitized = email.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
    return `user_${sanitized}`;
  }
  if (fallbackName && fallbackName.trim() && fallbackName.trim().toLowerCase() !== 'new student') {
    const sanitized = fallbackName.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
    return `user_${sanitized}`;
  }
  return 'user_active_student';
}

/**
 * Formats a student name to prevent layout and spacing conflicts:
 * e.g., "Maria Clara Santos" -> "Maria S."
 *       "Jerome Tan" -> "Jerome T."
 *       "Kenzo" -> "Kenzo"
 *       "" -> "Student"
 */
export function formatShortName(fullName?: string | null): string {
  if (!fullName) return 'Student';
  const trimmed = fullName.trim();
  if (!trimmed || trimmed.toLowerCase() === 'new student') return 'Student';

  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    return parts[0].length > 13 ? `${parts[0].slice(0, 12)}…` : parts[0];
  }

  const firstName = parts[0];
  const lastName = parts[parts.length - 1];
  return `${firstName} ${lastName.charAt(0).toUpperCase()}.`;
}

export function mapDbToItem(row: any): MarketplaceItem {
  return {
    id: String(row.id),
    title: row.title || '',
    price: row.price !== null && row.price !== undefined ? Number(row.price) : null,
    tradeType: (row.trade_type || row.tradeType || 'buy') as TradeType,
    category: (row.category || 'Textbooks & Reviewers') as ItemCategory,
    condition: (row.condition || 'Good') as Condition,
    courseTag: row.course_tag || row.courseTag || undefined,
    yearLevel: row.year_level || row.yearLevel || undefined,
    campus: row.campus || 'Ateneo de Naga University',
    safeMeetupSpot: row.safe_meetup_spot || row.safeMeetupSpot || 'Main Library Ground Floor',
    sellerId: row.seller_id || row.sellerId || undefined,
    sellerName: row.seller_name || row.sellerName || 'Campus Student',
    sellerRating: Number(row.seller_rating ?? row.sellerRating ?? 5.0),
    sellerYear: row.seller_year || row.sellerYear || 'Verified Student',
    isVerifiedStudent: row.is_verified_student ?? row.isVerifiedStudent ?? true,
    sellerAvatarUri: row.seller_avatar_uri || row.sellerAvatarUri || undefined,
    isReserved: Boolean(row.is_reserved ?? row.isReserved ?? false),
    isUrgent: Boolean(row.is_urgent ?? row.isUrgent ?? false),
    bumpCount: Number(row.bump_count ?? row.bumpCount ?? 0),
    lastBumpedAt: row.last_bumped_at || row.lastBumpedAt || undefined,
    viewsCount: Number(row.views_count ?? row.viewsCount ?? 0),
    inquiriesCount: Number(row.inquiries_count ?? row.inquiriesCount ?? 0),
    status: (row.status || 'active') as 'active' | 'reserved' | 'sold',
    createdAt: row.created_at || row.createdAt || 'Just now',
    imageUrl: row.image_url || row.imageUrl || undefined,
    photos: Array.isArray(row.photos) ? row.photos : [],
    description: row.description || '',
    estimatedCo2SavedKg: Number(row.estimated_co2_saved_kg ?? row.estimatedCo2SavedKg ?? 3.5),
  };
}

export function mapItemToDb(item: MarketplaceItem): any {
  return {
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
    seller_id: item.sellerId || null,
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
}

// ======================== ITEMS API ========================

export async function fetchItemsFromSupabase(): Promise<MarketplaceItem[]> {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('Error fetching items from Supabase:', error.message);
    throw error;
  }

  return (data || []).map(mapDbToItem);
}

export async function saveItemToSupabase(item: MarketplaceItem): Promise<MarketplaceItem> {
  const dbPayload = mapItemToDb(item);
  const { data, error } = await supabase
    .from('items')
    .upsert(dbPayload, { onConflict: 'id' })
    .select()
    .single();

  if (error) {
    console.warn('Error saving item to Supabase:', error.message);
    throw error;
  }

  return mapDbToItem(data);
}

export async function updateItemInSupabase(
  id: string,
  updates: Partial<MarketplaceItem>
): Promise<void> {
  const partialDb: any = {};
  if (updates.title !== undefined) partialDb.title = updates.title;
  if (updates.description !== undefined) partialDb.description = updates.description;
  if (updates.price !== undefined) partialDb.price = updates.price;
  if (updates.tradeType !== undefined) partialDb.trade_type = updates.tradeType;
  if (updates.category !== undefined) partialDb.category = updates.category;
  if (updates.condition !== undefined) partialDb.condition = updates.condition;
  if (updates.isReserved !== undefined) partialDb.is_reserved = updates.isReserved;
  if (updates.isUrgent !== undefined) partialDb.is_urgent = updates.isUrgent;
  if (updates.status !== undefined) partialDb.status = updates.status;
  if (updates.bumpCount !== undefined) partialDb.bump_count = updates.bumpCount;
  if (updates.lastBumpedAt !== undefined) partialDb.last_bumped_at = updates.lastBumpedAt;
  if (updates.createdAt !== undefined) partialDb.created_at = updates.createdAt;
  if (updates.imageUrl !== undefined) partialDb.image_url = updates.imageUrl;
  if (updates.photos !== undefined) partialDb.photos = updates.photos;

  const { error } = await supabase.from('items').update(partialDb).eq('id', id);
  if (error) {
    console.warn('Error updating item in Supabase:', error.message);
    throw error;
  }
}

export async function deleteItemFromSupabase(id: string): Promise<void> {
  const { error } = await supabase.from('items').delete().eq('id', id);
  if (error) {
    console.warn('Error deleting item from Supabase:', error.message);
    throw error;
  }
}

// ======================== PROFILES API ========================

export async function fetchProfileFromSupabase(id: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.warn('Error fetching profile from Supabase:', error.message);
    return null;
  }

  if (!data) return null;

  return {
    id: data.id,
    email: data.email || undefined,
    fullName: data.full_name || 'Campus Student',
    degreeProgram: data.degree_program || 'BS Tourism Management',
    yearLevel: data.year_level || '3rd Year',
    campus: data.campus || 'Ateneo de Naga University',
    avatarUrl: data.avatar_url || undefined,
    preferredMeetupSpot: data.preferred_meetup_spot || 'Alingal Hall (Tourism Lobby)',
  };
}

export async function fetchProfileByEmailFromSupabase(email: string): Promise<UserProfile | null> {
  const cleanEmail = email.trim().toLowerCase();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .ilike('email', cleanEmail)
    .maybeSingle();

  if (error) {
    console.warn('Error fetching profile by email from Supabase:', error.message);
    return null;
  }

  if (!data) return null;

  return {
    id: data.id,
    email: data.email || undefined,
    fullName: data.full_name || 'Campus Student',
    degreeProgram: data.degree_program || 'BS Tourism Management',
    yearLevel: data.year_level || '3rd Year',
    campus: data.campus || 'Ateneo de Naga University',
    avatarUrl: data.avatar_url || undefined,
    preferredMeetupSpot: data.preferred_meetup_spot || 'Alingal Hall (Tourism Lobby)',
  };
}

export async function saveProfileToSupabase(profile: UserProfile): Promise<void> {
  const payload = {
    id: profile.id,
    email: profile.email || null,
    full_name: profile.fullName,
    degree_program: profile.degreeProgram,
    year_level: profile.yearLevel,
    campus: profile.campus,
    avatar_url: profile.avatarUrl || null,
    preferred_meetup_spot: profile.preferredMeetupSpot,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('profiles')
    .upsert(payload, { onConflict: 'id' });

  if (error) {
    console.warn('Error saving profile to Supabase:', error.message);
    throw error;
  }
}

// ======================== CHAT API ========================

export async function fetchChatConversationsFromSupabase(
  userId: string = 'user_active_student',
  sellerName?: string
) {
  let query = supabase.from('chat_conversations').select('*');

  if (sellerName) {
    // If a seller name is provided, return conversations where the user is buyer OR seller
    query = query.or(`user_id.eq.${userId},seller_name.ilike.%${sellerName}%`);
  } else {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query.order('updated_at', { ascending: false });

  if (error) {
    console.warn('Error fetching chat conversations from Supabase:', error.message);
    return [];
  }

  return (data || []).map((row) => ({
    id: row.id,
    itemId: row.item_id,
    sellerName: row.seller_name,
    sellerYear: row.seller_year,
    itemTitle: row.item_title,
    price: row.price !== null ? Number(row.price) : null,
    tradeType: row.trade_type as 'buy' | 'swap' | 'free',
    lastMessage: row.last_message || '',
    timestamp: row.timestamp || 'Just now',
    unreadCount: row.unread_count || 0,
    safeMeetupSpot: row.safe_meetup_spot,
    sellerAvatarUri: row.seller_avatar_uri,
  }));
}

export async function saveChatConversationToSupabase(conv: any, userId: string = 'user_active_student') {
  const payload = {
    id: conv.id,
    item_id: conv.itemId,
    user_id: userId,
    seller_name: conv.sellerName,
    seller_year: conv.sellerYear || 'Verified Student',
    item_title: conv.itemTitle || 'Marketplace Item',
    price: conv.price ?? null,
    trade_type: conv.tradeType || 'buy',
    last_message: conv.lastMessage || '',
    timestamp: conv.timestamp || 'Just now',
    unread_count: conv.unreadCount || 0,
    safe_meetup_spot: conv.safeMeetupSpot || 'Main Library Ground Floor',
    seller_avatar_uri: conv.sellerAvatarUri || null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('chat_conversations').upsert(payload, { onConflict: 'id' });
  if (error) console.warn('Error saving conversation to Supabase:', error.message);
}

export async function fetchChatMessagesFromSupabase(itemId: string) {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('item_id', itemId)
    .order('created_at', { ascending: true });

  if (error) {
    console.warn('Error fetching messages from Supabase:', error.message);
    return [];
  }

  return (data || []).map((row) => ({
    id: row.id,
    sender: row.sender as 'me' | 'seller' | 'system',
    text: row.text || undefined,
    imageUri: row.image_uri || undefined,
    timestamp: row.timestamp || 'Just now',
  }));
}

export async function saveChatMessageToSupabase(msg: {
  id: string;
  itemId: string;
  sender: 'me' | 'seller' | 'system';
  text?: string;
  imageUri?: string;
  timestamp?: string;
}) {
  const payload = {
    id: msg.id,
    item_id: msg.itemId,
    sender: msg.sender,
    text: msg.text || null,
    image_uri: msg.imageUri || null,
    timestamp: msg.timestamp || 'Just now',
  };

  const { error } = await supabase.from('chat_messages').upsert(payload, { onConflict: 'id' });
  if (error) console.warn('Error saving message to Supabase:', error.message);
}

// ======================== BASKET API ========================

export async function fetchBasketFromSupabase(userId: string = 'user_active_student') {
  const { data, error } = await supabase
    .from('basket_items')
    .select('*, items(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('Error fetching basket from Supabase:', error.message);
    return [];
  }

  return (data || [])
    .filter((row) => row.items)
    .map((row) => ({
      id: row.id,
      quantity: row.quantity || 1,
      item: mapDbToItem(row.items),
    }));
}

export async function addToBasketInSupabase(itemId: string, quantity: number = 1, userId: string = 'user_active_student') {
  const id = `b_${userId}_${itemId}`;
  const payload = {
    id,
    user_id: userId,
    item_id: itemId,
    quantity,
  };
  const { error } = await supabase.from('basket_items').upsert(payload, { onConflict: 'id' });
  if (error) console.warn('Error adding to basket in Supabase:', error.message);
}

export async function removeFromBasketInSupabase(itemId: string, userId: string = 'user_active_student') {
  const id = `b_${userId}_${itemId}`;
  const { error } = await supabase.from('basket_items').delete().or(`id.eq.${id},item_id.eq.${itemId}`);
  if (error) console.warn('Error removing from basket in Supabase:', error.message);
}

export async function clearBasketInSupabase(userId: string = 'user_active_student') {
  const { error } = await supabase.from('basket_items').delete().eq('user_id', userId);
  if (error) console.warn('Error clearing basket in Supabase:', error.message);
}

// ======================== ORDERS API (Purchases) ========================

export interface OrderRecord {
  id: string;
  itemId?: string;
  title: string;
  price: number;
  sellerName: string;
  safeMeetupSpot: string;
  escrowStatus: string;
  referenceCode: string;
  channel?: string;
  createdAt?: string;
}

export async function fetchOrdersFromSupabase(userId: string = 'user_active_student'): Promise<OrderRecord[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('Error fetching orders from Supabase:', error.message);
    return [];
  }

  return (data || []).map((row) => ({
    id: row.id,
    itemId: row.item_id,
    title: row.title,
    price: Number(row.price || 0),
    sellerName: row.seller_name,
    safeMeetupSpot: row.safe_meetup_spot,
    escrowStatus: row.escrow_status,
    referenceCode: row.reference_code,
    channel: row.channel,
    createdAt: row.created_at,
  }));
}

export async function saveOrderToSupabase(order: {
  id: string;
  itemId?: string;
  title: string;
  price: number;
  sellerName: string;
  safeMeetupSpot: string;
  escrowStatus: string;
  referenceCode: string;
  channel?: string;
  userId?: string;
}) {
  const payload = {
    id: order.id,
    item_id: order.itemId || null,
    user_id: order.userId || 'user_active_student',
    title: order.title,
    price: order.price,
    seller_name: order.sellerName,
    safe_meetup_spot: order.safeMeetupSpot,
    escrow_status: order.escrowStatus,
    reference_code: order.referenceCode,
    channel: order.channel || 'gcash',
  };

  const { error } = await supabase.from('orders').upsert(payload, { onConflict: 'id' });
  if (error) console.warn('Error saving order to Supabase:', error.message);
}

// ======================== TRANSACTIONS API (Escrow Wallet) ========================

export async function fetchTransactionsFromSupabase(userId: string = 'user_active_student') {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('Error fetching transactions from Supabase:', error.message);
    return [];
  }

  return (data || []).map((row) => ({
    id: row.id,
    type: row.type,
    title: row.title,
    amount: Number(row.amount || 0),
    date: row.date || 'Just now',
    status: row.status,
    referenceCode: row.reference_code,
    channel: row.channel,
    counterpartName: row.counterpart_name,
    notes: row.notes,
  }));
}

export async function saveTransactionToSupabase(tx: any, userId: string = 'user_active_student') {
  const payload = {
    id: tx.id,
    user_id: userId,
    type: tx.type,
    title: tx.title,
    amount: tx.amount,
    date: tx.date || 'Just now',
    status: tx.status || 'completed',
    reference_code: tx.referenceCode,
    channel: tx.channel || null,
    counterpart_name: tx.counterpartName || null,
    notes: tx.notes || null,
  };

  const { error } = await supabase.from('transactions').upsert(payload, { onConflict: 'id' });
  if (error) console.warn('Error saving transaction to Supabase:', error.message);
}

