import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { EscrowTransaction, MarketplaceItem, SellerSubscriptionState, WalletState } from '@/types/item';
import { INITIAL_SUBSCRIPTION_STATE, INITIAL_WALLET_STATE, MOCK_ITEMS } from '@/data/mock-items';

interface CashOutResult {
  success: boolean;
  referenceCode: string;
  error?: string;
}

interface SubscriptionResult {
  success: boolean;
  referenceCode?: string;
  error?: string;
}

interface GrowthActionResult {
  success: boolean;
  message?: string;
  needsSubscription?: boolean;
}

interface ItemsContextType {
  items: MarketplaceItem[];
  addItem: (item: MarketplaceItem) => void;
  getItemById: (id: string) => MarketplaceItem | undefined;
  resetItems: () => void;
  // Seller Growth Tools
  bumpItem: (id: string) => GrowthActionResult;
  toggleUrgent: (id: string) => GrowthActionResult;
  setItemStatus: (id: string, status: 'active' | 'reserved' | 'sold') => void;
  deleteItem: (id: string) => void;
  // Escrow Wallet & Cash-Out
  wallet: WalletState;
  cashOut: (amount: number, channel: 'gcash' | 'maya', accountNumber: string) => Promise<CashOutResult>;
  releaseEscrow: (transactionId: string) => void;
  // Seller Subscription
  subscription: SellerSubscriptionState;
  subscribeSeller: (
    tier: 'weekly_boost' | 'semester_pass',
    paymentMethod: 'wallet' | 'gcash' | 'maya',
    accountNumber?: string
  ) => Promise<SubscriptionResult>;
  cancelSubscription: () => void;
}

const ItemsContext = createContext<ItemsContextType | undefined>(undefined);

export function ItemsProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<MarketplaceItem[]>(MOCK_ITEMS);
  const [wallet, setWallet] = useState<WalletState>(INITIAL_WALLET_STATE);
  const [subscription, setSubscription] = useState<SellerSubscriptionState>(INITIAL_SUBSCRIPTION_STATE);

  const addItem = useCallback((newItem: MarketplaceItem) => {
    setItems((prev) => [newItem, ...prev]);
  }, []);

  const getItemById = useCallback(
    (id: string) => items.find((item) => item.id === id),
    [items]
  );

  const resetItems = useCallback(() => {
    setItems(MOCK_ITEMS);
    setWallet(INITIAL_WALLET_STATE);
    setSubscription(INITIAL_SUBSCRIPTION_STATE);
  }, []);

  // Growth Tool 1: Bump listing to top of discovery feed
  const bumpItem = useCallback((id: string): GrowthActionResult => {
    if (!subscription.isActive || subscription.remainingBumps <= 0) {
      return {
        success: false,
        needsSubscription: true,
        message: 'No remaining bumps. Upgrade to Campus Boost to bump your listings!',
      };
    }

    setItems((prev) => {
      const targetIndex = prev.findIndex((i) => i.id === id);
      if (targetIndex === -1) return prev;
      const target = prev[targetIndex];
      const updated: MarketplaceItem = {
        ...target,
        createdAt: 'Just now',
        bumpCount: (target.bumpCount ?? 0) + 1,
        lastBumpedAt: 'Just now',
      };
      // Move to front of the marketplace feed
      const rest = prev.filter((i) => i.id !== id);
      return [updated, ...rest];
    });

    setSubscription((prev) => ({
      ...prev,
      remainingBumps: Math.max(0, prev.remainingBumps - 1),
    }));

    return { success: true };
  }, [subscription.isActive, subscription.remainingBumps]);

  // Growth Tool 2: Toggle Urgent Selling Badge
  const toggleUrgent = useCallback((id: string): GrowthActionResult => {
    const target = items.find((i) => i.id === id);
    if (!target) return { success: false, message: 'Item not found.' };

    const willEnable = !target.isUrgent;

    if (willEnable && (!subscription.isActive || subscription.remainingUrgentBadges <= 0)) {
      return {
        success: false,
        needsSubscription: true,
        message: 'No remaining Urgent badges. Upgrade to Campus Boost to add Urgent badges!',
      };
    }

    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, isUrgent: !i.isUrgent } : i))
    );

    if (willEnable) {
      setSubscription((prev) => ({
        ...prev,
        remainingUrgentBadges: Math.max(0, prev.remainingUrgentBadges - 1),
      }));
    }

    return { success: true };
  }, [items, subscription.isActive, subscription.remainingUrgentBadges]);

  // Item lifecycle state
  const setItemStatus = useCallback((id: string, status: 'active' | 'reserved' | 'sold') => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === id
          ? {
              ...i,
              status,
              isReserved: status === 'reserved',
            }
          : i
      )
    );
  }, []);

  const deleteItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  // Escrow Wallet: Cash-Out withdrawal
  const cashOut = useCallback(
    async (amount: number, channel: 'gcash' | 'maya', accountNumber: string): Promise<CashOutResult> => {
      if (amount <= 0) {
        return { success: false, referenceCode: '', error: 'Amount must be greater than ₱0.' };
      }
      if (amount > wallet.availableBalance) {
        return { success: false, referenceCode: '', error: 'Amount exceeds available balance.' };
      }

      const referenceCode = 'CG-PO-' + Math.floor(100000 + Math.random() * 900000);
      const channelLabel = channel === 'gcash' ? 'GCash' : 'Maya';
      const maskedNumber = accountNumber.trim().length >= 4 
        ? accountNumber.trim() 
        : '0917 824 5519';

      const newTx: EscrowTransaction = {
        id: `tx_co_${Date.now()}`,
        type: 'cash_out',
        title: `Cash-Out to ${channelLabel} (${maskedNumber})`,
        amount,
        date: 'Just now',
        status: 'completed',
        referenceCode,
        channel,
        notes: `Instant disbursement to ${channelLabel} account of Maria Santos.`,
      };

      setWallet((prev) => ({
        ...prev,
        availableBalance: prev.availableBalance - amount,
        transactions: [newTx, ...prev.transactions],
      }));

      return { success: true, referenceCode };
    },
    [wallet.availableBalance]
  );

  // Release funds held in escrow
  const releaseEscrow = useCallback((transactionId: string) => {
    setWallet((prev) => {
      const tx = prev.transactions.find((t) => t.id === transactionId);
      if (!tx || tx.type !== 'incoming_escrow' || tx.status !== 'pending') return prev;

      const updatedTxs = prev.transactions.map((t) =>
        t.id === transactionId
          ? { ...t, status: 'completed' as const, notes: 'Escrow released upon completed handover.' }
          : t
      );

      return {
        ...prev,
        inEscrowBalance: Math.max(0, prev.inEscrowBalance - tx.amount),
        availableBalance: prev.availableBalance + tx.amount,
        transactions: updatedTxs,
      };
    });
  }, []);

  // Seller Subscription Purchase
  const subscribeSeller = useCallback(
    async (
      tier: 'weekly_boost' | 'semester_pass',
      paymentMethod: 'wallet' | 'gcash' | 'maya',
      accountNumber?: string
    ): Promise<SubscriptionResult> => {
      const price = tier === 'weekly_boost' ? 29 : 89;
      const tierName = tier === 'weekly_boost' ? 'Weekly Sprint Boost' : 'Semester Seller Pass';
      const totalBumps = tier === 'weekly_boost' ? 5 : 25;
      const totalUrgent = tier === 'weekly_boost' ? 2 : 10;
      const durationDays = tier === 'weekly_boost' ? 7 : 120;
      
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + durationDays);
      const expiryStr = expiry.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

      if (paymentMethod === 'wallet') {
        if (wallet.availableBalance < price) {
          return {
            success: false,
            error: `Insufficient Escrow Wallet balance. You need ₱${price.toFixed(2)} (Available: ₱${wallet.availableBalance.toFixed(2)}).`,
          };
        }
      }

      const referenceCode = 'CG-SUB-' + Math.floor(100000 + Math.random() * 900000);

      // Create transaction record
      const newTx: EscrowTransaction = {
        id: `tx_sub_${Date.now()}`,
        type: 'cash_out',
        title: `Subscription: ${tierName}`,
        amount: price,
        date: 'Just now',
        status: 'completed',
        referenceCode,
        channel: paymentMethod === 'wallet' ? undefined : paymentMethod,
        notes: `Paid via ${
          paymentMethod === 'wallet'
            ? 'Escrow Cleared Balance'
            : paymentMethod === 'gcash'
            ? 'GCash'
            : 'Maya'
        }.`,
      };

      if (paymentMethod === 'wallet') {
        setWallet((prev) => ({
          ...prev,
          availableBalance: prev.availableBalance - price,
          transactions: [newTx, ...prev.transactions],
        }));
      } else {
        setWallet((prev) => ({
          ...prev,
          transactions: [newTx, ...prev.transactions],
        }));
      }

      setSubscription({
        tier,
        tierName,
        price,
        expiresAt: expiryStr,
        remainingBumps: totalBumps,
        totalBumps,
        remainingUrgentBadges: totalUrgent,
        totalUrgentBadges: totalUrgent,
        autoRenew: true,
        isActive: true,
      });

      return { success: true, referenceCode };
    },
    [wallet.availableBalance]
  );

  const cancelSubscription = useCallback(() => {
    setSubscription(INITIAL_SUBSCRIPTION_STATE);
  }, []);

  const value = useMemo(
    () => ({
      items,
      addItem,
      getItemById,
      resetItems,
      bumpItem,
      toggleUrgent,
      setItemStatus,
      deleteItem,
      wallet,
      cashOut,
      releaseEscrow,
      subscription,
      subscribeSeller,
      cancelSubscription,
    }),
    [
      items,
      addItem,
      getItemById,
      resetItems,
      bumpItem,
      toggleUrgent,
      setItemStatus,
      deleteItem,
      wallet,
      cashOut,
      releaseEscrow,
      subscription,
      subscribeSeller,
      cancelSubscription,
    ]
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
