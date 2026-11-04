-- ==============================================================================
-- Migration: Add Persistent Agreement, Escrow, and Rating Lifecycle to chat_conversations
-- 
-- Run this in the Supabase Dashboard SQL Editor to instantly add the new columns
-- to your existing chat_conversations table without dropping or losing any data.
-- ==============================================================================

ALTER TABLE public.chat_conversations
  ADD COLUMN IF NOT EXISTS buyer_id text DEFAULT 'user_active_student',
  ADD COLUMN IF NOT EXISTS buyer_name text DEFAULT 'Campus Student',
  ADD COLUMN IF NOT EXISTS buyer_avatar_uri text,
  ADD COLUMN IF NOT EXISTS buyer_year text DEFAULT 'Verified Student',
  ADD COLUMN IF NOT EXISTS seller_id text,
  ADD COLUMN IF NOT EXISTS agreement_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS order_id text,
  ADD COLUMN IF NOT EXISTS escrow_status text DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS reference_code text,
  ADD COLUMN IF NOT EXISTS buyer_confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS seller_confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS buyer_rating integer,
  ADD COLUMN IF NOT EXISTS buyer_rating_tags text[],
  ADD COLUMN IF NOT EXISTS buyer_rating_comment text,
  ADD COLUMN IF NOT EXISTS seller_rating integer,
  ADD COLUMN IF NOT EXISTS seller_rating_tags text[],
  ADD COLUMN IF NOT EXISTS seller_rating_comment text;

