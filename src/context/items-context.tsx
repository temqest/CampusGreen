import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { MarketplaceItem } from '@/types/item';
import { MOCK_ITEMS } from '@/data/mock-items';

interface ItemsContextType {
  items: MarketplaceItem[];
  addItem: (item: MarketplaceItem) => void;
  getItemById: (id: string) => MarketplaceItem | undefined;
  resetItems: () => void;
}

const ItemsContext = createContext<ItemsContextType | undefined>(undefined);

export function ItemsProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<MarketplaceItem[]>(MOCK_ITEMS);

  const addItem = useCallback((newItem: MarketplaceItem) => {
    setItems((prev) => [newItem, ...prev]);
  }, []);

  const getItemById = useCallback(
    (id: string) => items.find((item) => item.id === id),
    [items]
  );

  const resetItems = useCallback(() => {
    setItems(MOCK_ITEMS);
  }, []);

  const value = useMemo(
    () => ({ items, addItem, getItemById, resetItems }),
    [items, addItem, getItemById, resetItems]
  );

  return <ItemsContext.Provider value={value}>{children}</ItemsContext.Provider>;
}

export function useItems(): ItemsContextType {
  const context = useContext(ItemsContext);
  if (!context) {
    throw new Error('useItems must be used within an ItemsProvider');
  }
  return context;
}
