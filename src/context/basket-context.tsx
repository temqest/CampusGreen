import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { MarketplaceItem } from '@/types/item';
import {
  addToBasketInSupabase,
  clearBasketInSupabase,
  fetchBasketFromSupabase,
  removeFromBasketInSupabase,
} from '@/lib/database';

export interface BasketItem {
  item: MarketplaceItem;
  quantity: number;
}

interface BasketContextType {
  basketItems: BasketItem[];
  isLoading: boolean;
  addToBasket: (item: MarketplaceItem, quantity?: number) => Promise<void>;
  removeFromBasket: (itemId: string) => Promise<void>;
  clearBasket: () => Promise<void>;
  isInBasket: (itemId: string) => boolean;
  subtotal: number;
  totalCo2Saved: number;
  itemCount: number;
  refreshBasket: () => Promise<void>;
}

const BasketContext = createContext<BasketContextType | undefined>(undefined);

export function BasketProvider({ children }: { children: React.ReactNode }) {
  const [basketItems, setBasketItems] = useState<BasketItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load basket items from Supabase on mount
  const refreshBasket = useCallback(async () => {
    try {
      const items = await fetchBasketFromSupabase();
      setBasketItems(items);
    } catch (err) {
      console.warn('Error loading basket from Supabase:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    fetchBasketFromSupabase()
      .then((items) => {
        if (isMounted) setBasketItems(items);
      })
      .catch((err) => {
        console.warn('Error initial loading basket:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const addToBasket = useCallback(async (item: MarketplaceItem, quantity: number = 1) => {
    setBasketItems((prev) => {
      const existingIdx = prev.findIndex((b) => b.item.id === item.id);
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: updated[existingIdx].quantity + quantity,
        };
        return updated;
      }
      return [...prev, { item, quantity }];
    });

    try {
      await addToBasketInSupabase(item.id, quantity);
    } catch (err) {
      console.warn('Failed to persist add to basket:', err);
    }
  }, []);

  const removeFromBasket = useCallback(async (itemId: string) => {
    setBasketItems((prev) => prev.filter((b) => b.item.id !== itemId));

    try {
      await removeFromBasketInSupabase(itemId);
    } catch (err) {
      console.warn('Failed to persist remove from basket:', err);
    }
  }, []);

  const clearBasket = useCallback(async () => {
    setBasketItems([]);
    try {
      await clearBasketInSupabase();
    } catch (err) {
      console.warn('Failed to persist clear basket:', err);
    }
  }, []);

  const isInBasket = useCallback(
    (itemId: string) => basketItems.some((b) => b.item.id === itemId),
    [basketItems]
  );

  const subtotal = useMemo(
    () => basketItems.reduce((sum, b) => sum + (b.item.price ?? 0) * b.quantity, 0),
    [basketItems]
  );

  const totalCo2Saved = useMemo(
    () => basketItems.reduce((sum, b) => sum + (b.item.estimatedCo2SavedKg ?? 0) * b.quantity, 0),
    [basketItems]
  );

  const itemCount = useMemo(
    () => basketItems.reduce((sum, b) => sum + b.quantity, 0),
    [basketItems]
  );

  const value = useMemo(
    () => ({
      basketItems,
      isLoading,
      addToBasket,
      removeFromBasket,
      clearBasket,
      isInBasket,
      subtotal,
      totalCo2Saved,
      itemCount,
      refreshBasket,
    }),
    [
      basketItems,
      isLoading,
      addToBasket,
      removeFromBasket,
      clearBasket,
      isInBasket,
      subtotal,
      totalCo2Saved,
      itemCount,
      refreshBasket,
    ]
  );

  return <BasketContext.Provider value={value}>{children}</BasketContext.Provider>;
}

export function useBasket(): BasketContextType {
  const context = useContext(BasketContext);
  if (!context) {
    throw new Error('useBasket must be used within a BasketProvider');
  }
  return context;
}

