#!/usr/bin/env node

/**
 * UniSwap - Supabase Schema Data Cleaner
 * 
 * Safely cleans out test data ONLY from the application tables belonging to UniSwap.
 * Never affects auth.users, internal storage tables, or other project schemas.
 * 
 * Target Application Tables:
 *  1. public.chat_messages
 *  2. public.chat_conversations
 *  3. public.basket_items
 *  4. public.orders
 *  5. public.transactions
 *  6. public.items
 *  7. public.profiles
 * 
 * Usage:
 *   node ./scripts/clean-supabase.js
 *   node ./scripts/clean-supabase.js --keep-profiles
 *   node ./scripts/clean-supabase.js --keep-items
 *   node ./scripts/clean-supabase.js --clean-storage
 *   node ./scripts/clean-supabase.js --seed
 *   node ./scripts/clean-supabase.js --dry-run
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Safely load .env without requiring external dependencies
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

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  process.env.EXPO_SUPABASE_PROJECT_URL;

const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.EXPO_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env!');
  console.error('   Expected EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Parse CLI flags
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
🌿 UniSwap Supabase Schema Data Cleaner

Usage:
  node ./scripts/clean-supabase.js [options]
  npm run db:clean

Options:
  --keep-profiles   Preserve student user profiles (profiles table)
  --keep-items      Preserve marketplace items (items table)
  --clean-storage   Also delete uploaded image assets in "product-items" bucket
  --seed            Automatically run seed-database.js immediately after cleanup
  --dry-run         Inspect row counts without deleting any data
  --help, -h        Show this help message

Target Tables (Application Schema Only):
  1. chat_messages
  2. chat_conversations
  3. basket_items
  4. orders
  5. transactions
  6. items
  7. profiles
`);
  process.exit(0);
}
const keepProfiles = args.includes('--keep-profiles');
const keepItems = args.includes('--keep-items');
const cleanStorage = args.includes('--clean-storage');
const autoSeed = args.includes('--seed');
const dryRun = args.includes('--dry-run');

// Ordered list of tables respecting foreign key constraints
const ALL_APP_TABLES = [
  { name: 'chat_messages', label: 'Chat Messages', condition: true },
  { name: 'chat_conversations', label: 'Chat Conversations & Lifecycle', condition: true },
  { name: 'basket_items', label: 'User Basket Items', condition: true },
  { name: 'orders', label: 'Escrow & Marketplace Orders', condition: true },
  { name: 'transactions', label: 'Wallet & Ledger Transactions', condition: true },
  { name: 'items', label: 'Marketplace Inventory Items', condition: !keepItems },
  { name: 'profiles', label: 'Student User Profiles', condition: !keepProfiles },
];

async function getRowCount(tableName) {
  try {
    const { count, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    if (error) {
      return { count: null, error: error.message };
    }
    return { count: count ?? 0, error: null };
  } catch (err) {
    return { count: null, error: err.message };
  }
}

async function cleanTable(tableName) {
  try {
    // Delete all records by matching non-equal dummy id
    const { count, error } = await supabase
      .from(tableName)
      .delete({ count: 'exact' })
      .neq('id', '___non_existent_record___');

    if (error) {
      return { count: 0, error: error.message };
    }
    return { count: count ?? 0, error: null };
  } catch (err) {
    return { count: 0, error: err.message };
  }
}

async function cleanStorageBucket(bucketName) {
  console.log(`\n🧹 Cleaning Supabase Storage bucket: "${bucketName}"...`);
  try {
    const { data: files, error } = await supabase.storage.from(bucketName).list('', {
      limit: 100,
      sortBy: { column: 'name', order: 'asc' },
    });

    if (error) {
      console.warn(`  ⚠️ Could not access storage bucket "${bucketName}":`, error.message);
      return;
    }

    if (!files || files.length === 0) {
      console.log(`  ✓ Bucket "${bucketName}" is already empty.`);
      return;
    }

    const filePaths = [];
    for (const f of files) {
      if (f.id === null) {
        // Folder: list inside
        const { data: subFiles } = await supabase.storage.from(bucketName).list(f.name, { limit: 100 });
        if (subFiles) {
          subFiles.forEach((sf) => filePaths.push(`${f.name}/${sf.name}`));
        }
      } else {
        filePaths.push(f.name);
      }
    }

    if (filePaths.length === 0) {
      console.log(`  ✓ Bucket "${bucketName}" has no files to remove.`);
      return;
    }

    if (dryRun) {
      console.log(`  [DRY-RUN] Would delete ${filePaths.length} storage files.`);
      return;
    }

    const { error: delError } = await supabase.storage.from(bucketName).remove(filePaths);
    if (delError) {
      console.warn(`  ⚠️ Error removing files from storage:`, delError.message);
    } else {
      console.log(`  ✓ Successfully deleted ${filePaths.length} files from "${bucketName}".`);
    }
  } catch (err) {
    console.warn(`  ⚠️ Storage cleaning failed:`, err.message);
  }
}

async function runCleaner() {
  console.log('====================================================');
  console.log('🌿 UniSwap: Supabase Schema Data Cleaner');
  console.log('====================================================');
  console.log(`Target Supabase URL: ${supabaseUrl}`);
  console.log(`Execution Mode:      ${dryRun ? '🔍 DRY RUN (No records deleted)' : '⚡ LIVE CLEAN'}`);
  if (keepProfiles) console.log('Option:              Preserving `profiles` table');
  if (keepItems)    console.log('Option:              Preserving `items` table');
  if (cleanStorage) console.log('Option:              Including `product-items` storage bucket');
  if (autoSeed)     console.log('Option:              Will auto-seed items after cleaning');
  console.log('----------------------------------------------------');

  const targets = ALL_APP_TABLES.filter((t) => t.condition);
  const skipped = ALL_APP_TABLES.filter((t) => !t.condition);

  // 1. Inspect current table counts
  console.log('\n📊 Current Row Counts in UniSwap Schema:');
  const initialCounts = {};
  for (const table of ALL_APP_TABLES) {
    const { count, error } = await getRowCount(table.name);
    initialCounts[table.name] = count;
    const isTarget = table.condition;
    const status = error
      ? `(⚠️ error: ${error})`
      : `${count} rows`;
    const tag = isTarget ? '👉 TARGET' : '⏭️  SKIP  ';
    console.log(`  ${tag}  ${table.name.padEnd(22)}: ${status}`);
  }

  if (dryRun) {
    console.log('\n🔍 Dry run completed. No data was modified.');
    return;
  }

  // 2. Perform table cleanout in cascade order
  console.log('\n🗑️  Cleaning Target Application Tables...');
  let totalDeleted = 0;

  for (const table of targets) {
    process.stdout.write(`  Wiping ${table.name}... `);
    const { count, error } = await cleanTable(table.name);
    if (error) {
      console.log(`❌ Failed: ${error}`);
    } else {
      console.log(`✓ Cleared ${count} rows`);
      totalDeleted += count;
    }
  }

  // 3. Clean storage bucket if requested
  if (cleanStorage) {
    await cleanStorageBucket('product-items');
  }

  // 4. Print skipped tables summary
  if (skipped.length > 0) {
    console.log('\n🔒 Preserved Tables (Unchanged):');
    for (const t of skipped) {
      console.log(`  ✓ ${t.name} (${initialCounts[t.name] ?? 0} rows intact)`);
    }
  }

  console.log('\n====================================================');
  console.log(`🎉 Cleanup Complete! Deleted a total of ${totalDeleted} records.`);
  console.log('   All other project tables and auth schemas remain untouched.');
  console.log('====================================================');

  // 5. Auto seed if flag enabled
  if (autoSeed) {
    console.log('\n🌱 Launching database seeder to repopulate fresh items...');
    try {
      require('./seed-database.js');
    } catch (seedErr) {
      console.error('❌ Failed to run seeder:', seedErr.message);
    }
  }
}

runCleaner().catch((err) => {
  console.error('\n❌ Unexpected error running cleaner:', err);
  process.exit(1);
});
