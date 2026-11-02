const fs = require('fs');
const path = require('path');

const mockFile = fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'mock-items.ts'), 'utf8');

// Use typescript compilation or eval in a clean context to get MOCK_ITEMS
const ts = require('typescript');
const js = ts.transpile(mockFile, { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS });

// Run transpile in sandbox
const moduleObj = { exports: {} };
const fn = new Function('exports', 'require', js);
fn(moduleObj.exports, (mod) => {
  if (mod === '@/types/item') return {};
  return require(mod);
});

const items = moduleObj.exports.MOCK_ITEMS || [];
console.log('Extracted items count:', items.length);

function escapeSql(str) {
  if (str === null || str === undefined) return 'NULL';
  return "'" + String(str).replace(/'/g, "''") + "'";
}

let sql = '';
for (const item of items) {
  const photosJson = JSON.stringify(item.photos || []).replace(/'/g, "''");
  sql += `INSERT INTO public.items (
    id, title, description, price, trade_type, category, condition, course_tag, year_level,
    campus, safe_meetup_spot, seller_name, seller_rating, seller_year, is_verified_student,
    seller_avatar_uri, is_reserved, is_urgent, bump_count, last_bumped_at, views_count,
    inquiries_count, status, created_at, image_url, photos, estimated_co2_saved_kg
  ) VALUES (
    ${escapeSql(item.id)},
    ${escapeSql(item.title)},
    ${escapeSql(item.description)},
    ${item.price === null || item.price === undefined ? 'NULL' : item.price},
    ${escapeSql(item.tradeType)},
    ${escapeSql(item.category)},
    ${escapeSql(item.condition)},
    ${escapeSql(item.courseTag || null)},
    ${escapeSql(item.yearLevel || null)},
    ${escapeSql(item.campus)},
    ${escapeSql(item.safeMeetupSpot)},
    ${escapeSql(item.sellerName)},
    ${item.sellerRating || 5.0},
    ${escapeSql(item.sellerYear)},
    ${Boolean(item.isVerifiedStudent)},
    ${escapeSql(item.sellerAvatarUri || null)},
    ${Boolean(item.isReserved)},
    ${Boolean(item.isUrgent)},
    ${item.bumpCount || 0},
    ${escapeSql(item.lastBumpedAt || null)},
    ${item.viewsCount || 0},
    ${item.inquiriesCount || 0},
    ${escapeSql(item.status || 'active')},
    ${escapeSql(item.createdAt)},
    ${escapeSql(item.imageUrl || null)},
    '${photosJson}'::jsonb,
    ${item.estimatedCo2SavedKg || 3.5}
  ) ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    price = EXCLUDED.price,
    image_url = EXCLUDED.image_url,
    description = EXCLUDED.description;\n\n`;
}

fs.writeFileSync(path.join(__dirname, '..', 'supabase', 'seed_items.sql'), sql);
console.log('Successfully wrote supabase/seed_items.sql');

