-- ==============================================================================
-- UniSwap: Clean Application Schema Data Script
-- 
-- This script ONLY targets the 7 tables belonging exclusively to UniSwap.
-- It will NEVER drop or touch auth.users, storage.buckets, or other app schemas.
-- ==============================================================================

-- Option 1: Clean out all UniSwap test data (complete fresh start)
TRUNCATE TABLE
  public.chat_messages,
  public.chat_conversations,
  public.basket_items,
  public.orders,
  public.transactions,
  public.items,
  public.profiles
CASCADE;

-- ------------------------------------------------------------------------------
-- Option 2: Clean everything EXCEPT student user profiles
-- (Uncomment to use instead of Option 1)
-- ------------------------------------------------------------------------------
-- TRUNCATE TABLE
--   public.chat_messages,
--   public.chat_conversations,
--   public.basket_items,
--   public.orders,
--   public.transactions,
--   public.items
-- CASCADE;

-- ------------------------------------------------------------------------------
-- Option 3: Clean ONLY test transactions, chats, and orders
-- (Keeps items and user profiles intact)
-- ------------------------------------------------------------------------------
-- TRUNCATE TABLE
--   public.chat_messages,
--   public.chat_conversations,
--   public.basket_items,
--   public.orders,
--   public.transactions
-- CASCADE;

