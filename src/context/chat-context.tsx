import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MarketplaceItem } from '@/types/item';
import {
  fetchChatConversationsFromSupabase,
  fetchChatMessagesFromSupabase,
  saveChatConversationToSupabase,
  saveChatMessageToSupabase,
} from '@/lib/database';
import { supabase } from '@/lib/supabase';
import { formatConversationTime, formatMessageTime } from '@/utils/format-time';

const getUserChatKey = (userId: string) => `@uniswap_chat_conversations_${userId}`;
const LEGACY_CHAT_KEYS = ['@uniswap_chat_conversations', '@campusgreen_chat_conversations'];
const USER_PROFILE_KEY = '@uniswap_user_profile';
const LEGACY_PROFILE_KEY = '@campusgreen_user_profile';

async function getStoredUserProfile(): Promise<string | null> {
  const current = await AsyncStorage.getItem(USER_PROFILE_KEY);
  if (current) return current;
  return AsyncStorage.getItem(LEGACY_PROFILE_KEY);
}

async function getStoredConversationsForUser(userId: string): Promise<ChatConversation[]> {
  if (!userId || userId === 'user_active_student') return [];
  try {
    const raw = await AsyncStorage.getItem(getUserChatKey(userId));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

function persistConversationsForUser(userId: string, list: ChatConversation[]) {
  if (!userId || userId === 'user_active_student') return;
  AsyncStorage.setItem(getUserChatKey(userId), JSON.stringify(list)).catch(() => {});
}

export interface Message {
  id: string;
  sender: 'me' | 'seller' | 'buyer' | 'system';
  text?: string;
  imageUri?: string;
  timestamp: string;
  createdAt?: string;
}

export interface ChatConversation {
  id: string;
  itemId: string;
  userId?: string;
  buyerId?: string;
  buyerName?: string;
  buyerAvatarUri?: string;
  buyerYear?: string;
  sellerId?: string;
  sellerName: string;
  sellerYear: string;
  itemTitle: string;
  price: number | null;
  tradeType: 'buy' | 'swap' | 'free';
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  safeMeetupSpot: string;
  sellerAvatarUri?: string;
  // Lifecycle & Transaction
  agreementStatus: 'pending' | 'accepted' | 'completed' | 'cancelled';
  orderId?: string;
  escrowStatus?: 'none' | 'in_escrow' | 'cod_pending' | 'released';
  referenceCode?: string;
  buyerConfirmedAt?: string;
  sellerConfirmedAt?: string;
  buyerRating?: number;
  buyerRatingTags?: string[];
  buyerRatingComment?: string;
  sellerRating?: number;
  sellerRatingTags?: string[];
  sellerRatingComment?: string;
}

interface ChatContextType {
  conversations: ChatConversation[];
  isLoading: boolean;
  getMessages: (itemId: string, itemMeta?: Partial<MarketplaceItem>, conversationId?: string) => Message[];
  sendMessage: (
    itemId: string,
    content: string | { text?: string; imageUri?: string },
    itemMeta?: Partial<MarketplaceItem>,
    conversationId?: string
  ) => void;
  addSystemMessage: (itemId: string, text: string, conversationId?: string) => void;
  ensureConversation: (item: MarketplaceItem, extra?: Partial<ChatConversation>) => ChatConversation;
  updateAgreementStatus: (
    itemId: string,
    status: 'pending' | 'accepted' | 'completed' | 'cancelled',
    extra?: Partial<ChatConversation>
  ) => Promise<void>;
  submitPeerRating: (
    itemId: string,
    isBuyer: boolean,
    rating: number,
    tags?: string[],
    comment?: string
  ) => Promise<void>;
  isTypingByItemId: Record<string, boolean>;
  markAsRead: (itemId: string) => void;
  refreshConversations: () => Promise<void>;
  clearChatData: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  // Clean Slate: Starts empty for new accounts, populated from Supabase & cached locally
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const conversationsRef = React.useRef<ChatConversation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [messagesByItemId, setMessagesByItemId] = useState<Record<string, Message[]>>({});
  const [isTypingByItemId, setIsTypingByItemId] = useState<Record<string, boolean>>({});
  const [currentUser, setCurrentUser] = useState<{ id: string; fullName: string } | null>(null);

  React.useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  const clearChatData = useCallback(async () => {
    setConversations([]);
    conversationsRef.current = [];
    setMessagesByItemId({});
    setIsTypingByItemId({});
    setCurrentUser(null);
    try {
      const keysToRemove = [...LEGACY_CHAT_KEYS];
      const stored = await getStoredUserProfile();
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.id) {
            keysToRemove.push(getUserChatKey(parsed.id));
          }
        } catch {}
      }
      await AsyncStorage.multiRemove(keysToRemove);
    } catch (err) {
      console.warn('Error clearing local chat data:', err);
    }
  }, []);

  const refreshConversations = useCallback(async () => {
    setIsLoading(true);
    try {
      let sellerName = '';
      let activeUserId = '';
      try {
        const stored = await getStoredUserProfile();
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.fullName) sellerName = parsed.fullName.trim();
          if (parsed.id) activeUserId = parsed.id;
          setCurrentUser({
            id: activeUserId,
            fullName: sellerName,
          });
        }
      } catch {}

      if (!activeUserId) {
        setConversations([]);
        conversationsRef.current = [];
        return;
      }

      const liveConvs = await fetchChatConversationsFromSupabase(activeUserId, sellerName);
      const filtered = (liveConvs || []).filter(
        (c) =>
          c.buyerId === activeUserId ||
          c.userId === activeUserId ||
          c.sellerId === activeUserId ||
          (sellerName &&
            sellerName.toLowerCase() !== 'campus student' &&
            c.sellerName?.trim().toLowerCase() === sellerName.toLowerCase())
      );

      setConversations(filtered);
      conversationsRef.current = filtered;
      persistConversationsForUser(activeUserId, filtered);
    } catch (err) {
      console.warn('Error refreshing conversations:', err);
      try {
        const stored = await getStoredUserProfile();
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.id) {
            const cached = await getStoredConversationsForUser(parsed.id);
            setConversations(cached);
            conversationsRef.current = cached;
          }
        }
      } catch {}
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    getStoredUserProfile()
      .then(async (stored) => {
        if (!stored || !isMounted) {
          setIsLoading(false);
          return;
        }
        let sellerName = '';
        let activeUserId = '';
        try {
          const parsed = JSON.parse(stored);
          if (parsed.fullName) sellerName = parsed.fullName.trim();
          if (parsed.id) activeUserId = parsed.id;
          if (isMounted) {
            setCurrentUser({
              id: activeUserId,
              fullName: sellerName,
            });
          }
        } catch {}

        if (!activeUserId) {
          if (isMounted) setIsLoading(false);
          return;
        }

        // Fast-path user-scoped cache
        const cached = await getStoredConversationsForUser(activeUserId);
        if (isMounted && cached.length > 0) {
          setConversations(cached);
          conversationsRef.current = cached;
          setIsLoading(false);
        }

        const convs = await fetchChatConversationsFromSupabase(activeUserId, sellerName);
        if (isMounted) {
          const filtered = (convs || []).filter(
            (c) =>
              c.buyerId === activeUserId ||
              c.userId === activeUserId ||
              c.sellerId === activeUserId ||
              (sellerName &&
                sellerName.toLowerCase() !== 'campus student' &&
                c.sellerName?.trim().toLowerCase() === sellerName.toLowerCase())
          );
          setConversations(filtered);
          conversationsRef.current = filtered;
          persistConversationsForUser(activeUserId, filtered);
        }
      })
      .catch((err) => {
        console.warn('Error loading chat conversations:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_OUT') {
        await clearChatData();
      } else if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        await refreshConversations();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [clearChatData, refreshConversations]);

  const getMessages = useCallback(
    (itemId: string, itemMeta?: Partial<MarketplaceItem>, conversationId?: string): Message[] => {
      const cacheKey = conversationId || itemId;
      if (messagesByItemId[cacheKey]) {
        return messagesByItemId[cacheKey];
      }

      // Check Supabase in background
      fetchChatMessagesFromSupabase(itemId, conversationId).then((dbMsgs) => {
        if (dbMsgs && dbMsgs.length > 0) {
          setMessagesByItemId((prev) => ({
            ...prev,
            [cacheKey]: dbMsgs,
          }));
        }
      });

      const title = itemMeta?.title || 'this item';
      const spot = itemMeta?.safeMeetupSpot || 'the designated campus zone';

      const initialGreeting: Message = {
        id: `init-${cacheKey}`,
        sender: 'seller',
        text:
          itemMeta?.tradeType === 'swap'
            ? `Hi! Thanks for your interest in swapping for my ${title}. What gear or item are you proposing to trade?`
            : itemMeta?.tradeType === 'free'
            ? `Hi! Glad someone can make use of the ${title}! It's completely free for campus pickup at ${spot}.`
            : `Hi! Thanks for checking out the ${title}. It's still available for meetup at ${spot}. Feel free to ask any questions!`,
        timestamp: formatMessageTime(new Date()),
      };

      return [initialGreeting];
    },
    [messagesByItemId]
  );

  const markAsRead = useCallback((itemId: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.itemId === itemId ? { ...c, unreadCount: 0 } : c))
    );
  }, []);

  const addSystemMessage = useCallback((itemId: string, text: string, conversationId?: string) => {
    const formattedNow = formatMessageTime(new Date());
    const cacheKey = conversationId || itemId;
    const sysMsg: Message = {
      id: `sys-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      sender: 'system',
      text,
      timestamp: formattedNow,
    };

    setMessagesByItemId((prev) => {
      const current = prev[cacheKey] || [];
      return {
        ...prev,
        [cacheKey]: [...current, sysMsg],
      };
    });

    saveChatMessageToSupabase({
      id: sysMsg.id,
      itemId,
      conversationId,
      sender: 'system',
      text,
      timestamp: formattedNow,
    }).catch((err) => console.warn('Supabase save system message error:', err));
  }, []);

  const ensureConversation = useCallback(
    (item: MarketplaceItem, extra?: Partial<ChatConversation>): ChatConversation => {
      const activeUserId = currentUser?.id || 'user_active_student';
      const targetConvId = extra?.id || `conv-${item.id}-${activeUserId}`;

      const existing = conversationsRef.current.find(
        (c) =>
          c.id === targetConvId ||
          (c.itemId === item.id && (c.buyerId === activeUserId || c.userId === activeUserId))
      );
      if (existing) {
        if (extra && Object.keys(extra).length > 0) {
          const merged: ChatConversation = { ...existing, ...extra };
          setConversations((prev) => [merged, ...prev.filter((c) => c.id !== existing.id)]);
          const nextList = [merged, ...conversationsRef.current.filter((c) => c.id !== existing.id)];
          conversationsRef.current = nextList;
          if (currentUser?.id) persistConversationsForUser(currentUser.id, nextList);
          saveChatConversationToSupabase(merged, activeUserId).catch((err) =>
            console.warn('Supabase save merged conversation error:', err)
          );
          return merged;
        }
        return existing;
      }

      const initialGreeting =
        item.tradeType === 'swap'
          ? `Hi! Thanks for your interest in swapping for my ${item.title}. What gear or item are you proposing to trade?`
          : item.tradeType === 'free'
          ? `Hi! Glad someone can make use of the ${item.title}! It's completely free for campus pickup at ${item.safeMeetupSpot}.`
          : `Hi! Thanks for checking out the ${item.title}. It's still available for meetup at ${item.safeMeetupSpot}. Feel free to ask any questions!`;

      const newConv: ChatConversation = {
        id: targetConvId,
        itemId: item.id,
        userId: activeUserId,
        buyerId: activeUserId,
        buyerName: currentUser?.fullName || 'Campus Student',
        sellerId: item.sellerId,
        sellerName: item.sellerName || 'Campus Student',
        sellerYear: item.sellerYear || 'Verified Student',
        itemTitle: item.title,
        price: item.price ?? null,
        tradeType: item.tradeType || 'buy',
        lastMessage: initialGreeting,
        timestamp: formatConversationTime(new Date()),
        unreadCount: 0,
        safeMeetupSpot: item.safeMeetupSpot || 'Main Library Ground Floor',
        sellerAvatarUri: item.sellerAvatarUri,
        agreementStatus: item.status === 'reserved' || item.isReserved ? 'accepted' : 'pending',
        escrowStatus: 'none',
        ...extra,
      };

      setConversations((prev) => [newConv, ...prev.filter((c) => c.id !== targetConvId)]);
      const nextList = [newConv, ...conversationsRef.current.filter((c) => c.id !== targetConvId)];
      conversationsRef.current = nextList;
      if (currentUser?.id) persistConversationsForUser(currentUser.id, nextList);

      saveChatConversationToSupabase(newConv, activeUserId).catch((err) =>
        console.warn('Supabase save auto-generated conversation error:', err)
      );

      return newConv;
    },
    [currentUser]
  );

  const updateAgreementStatus = useCallback(
    async (
      itemId: string,
      status: 'pending' | 'accepted' | 'completed' | 'cancelled',
      extra?: Partial<ChatConversation>
    ) => {
      const existing = conversationsRef.current.find(
        (c) => (extra?.id && c.id === extra.id) || c.itemId === itemId
      );
      if (!existing) return;
      const updated: ChatConversation = {
        ...existing,
        agreementStatus: status,
        ...extra,
      };

      setConversations((prev) => [updated, ...prev.filter((c) => c.id !== existing.id)]);
      const nextList = [updated, ...conversationsRef.current.filter((c) => c.id !== existing.id)];
      conversationsRef.current = nextList;
      if (currentUser?.id) persistConversationsForUser(currentUser.id, nextList);

      await saveChatConversationToSupabase(
        updated,
        updated.userId || currentUser?.id || 'user_active_student'
      ).catch((err) => console.warn('Supabase save agreement status error:', err));
    },
    [currentUser]
  );

  const submitPeerRating = useCallback(
    async (
      itemId: string,
      isBuyer: boolean,
      rating: number,
      tags?: string[],
      comment?: string
    ) => {
      const existing = conversationsRef.current.find((c) => c.itemId === itemId);
      if (!existing) return;
      const ratingUpdates: Partial<ChatConversation> = isBuyer
        ? {
            buyerRating: rating,
            buyerRatingTags: tags,
            buyerRatingComment: comment,
          }
        : {
            sellerRating: rating,
            sellerRatingTags: tags,
            sellerRatingComment: comment,
          };
      const updated: ChatConversation = {
        ...existing,
        ...ratingUpdates,
      };

      setConversations((prev) => [updated, ...prev.filter((c) => c.id !== existing.id)]);
      const nextList = [updated, ...conversationsRef.current.filter((c) => c.id !== existing.id)];
      conversationsRef.current = nextList;
      if (currentUser?.id) persistConversationsForUser(currentUser.id, nextList);

      await saveChatConversationToSupabase(
        updated,
        updated.userId || currentUser?.id || 'user_active_student'
      ).catch((err) => console.warn('Supabase save peer rating error:', err));
    },
    [currentUser]
  );

  const sendMessage = useCallback(
    (
      itemId: string,
      content: string | { text?: string; imageUri?: string },
      itemMeta?: Partial<MarketplaceItem>,
      conversationId?: string
    ) => {
      let trimmed = '';
      let imageUri: string | undefined;

      if (typeof content === 'string') {
        trimmed = content.trim();
      } else {
        trimmed = (content.text || '').trim();
        imageUri = content.imageUri;
      }

      if (!trimmed && !imageUri) return;

      const previewText = imageUri
        ? trimmed
          ? `📷 ${trimmed}`
          : '📷 Sent a photo'
        : trimmed;

      const msgTimestamp = formatMessageTime(new Date());
      const convTimestamp = formatConversationTime(new Date());

      // Determine sender role: is active user the seller or buyer?
      const isSeller = Boolean(
        currentUser &&
        ((currentUser.id && itemMeta?.sellerId && itemMeta.sellerId === currentUser.id) ||
         (currentUser.fullName && itemMeta?.sellerName && itemMeta.sellerName.trim().toLowerCase() === currentUser.fullName.toLowerCase()))
      );
      const senderRole: 'seller' | 'buyer' = isSeller ? 'seller' : 'buyer';

      const userMsg: Message = {
        id: `msg-${senderRole}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        sender: senderRole,
        text: trimmed || undefined,
        imageUri: imageUri || undefined,
        timestamp: msgTimestamp,
        createdAt: new Date().toISOString(),
      };

      const activeUserId = currentUser?.id || 'user_active_student';
      const existingConv = conversationsRef.current.find(
        (c) =>
          (conversationId && c.id === conversationId) ||
          (c.itemId === itemId &&
            (c.buyerId === activeUserId || c.userId === activeUserId || c.sellerId === activeUserId))
      );
      const resolvedConvId = conversationId || existingConv?.id || `conv-${itemId}-${activeUserId}`;
      const cacheKey = resolvedConvId;

      // 1. Update messages immediately in local state
      setMessagesByItemId((prev) => {
        const existing = prev[cacheKey] || prev[itemId] || getMessages(itemId, itemMeta, resolvedConvId);
        return {
          ...prev,
          [cacheKey]: [...existing, userMsg],
          [itemId]: [...existing, userMsg],
        };
      });

      // 2. Persist message to Supabase
      saveChatMessageToSupabase({
        id: userMsg.id,
        itemId,
        conversationId: resolvedConvId,
        sender: senderRole,
        text: userMsg.text,
        imageUri: userMsg.imageUri,
        timestamp: msgTimestamp,
      }).catch((err) => console.warn('Supabase save user message error:', err));

      // 3. Update / bump conversation in the inbox list
      let finalConvToPersist: ChatConversation | null = null;

      setConversations((prev) => {
        const found = prev.find((c) => c.id === resolvedConvId) || prev.find((c) => c.itemId === itemId);
        const mergedConv: ChatConversation = {
          id: resolvedConvId,
          itemId,
          userId: isSeller
            ? ((itemMeta as any)?.buyerId || found?.userId || found?.buyerId || 'user_active_student')
            : (activeUserId || found?.userId || 'user_active_student'),
          buyerId: isSeller
            ? ((itemMeta as any)?.buyerId || found?.buyerId || found?.userId || 'user_active_student')
            : (activeUserId || found?.buyerId || 'user_active_student'),
          buyerName: isSeller
            ? ((itemMeta as any)?.buyerName || found?.buyerName)
            : (currentUser?.fullName || found?.buyerName),
          buyerAvatarUri: (itemMeta as any)?.buyerAvatarUri || found?.buyerAvatarUri,
          buyerYear: (itemMeta as any)?.buyerYear || found?.buyerYear,
          sellerId: itemMeta?.sellerId || found?.sellerId,
          sellerName: itemMeta?.sellerName || found?.sellerName || 'Campus Student',
          sellerYear: itemMeta?.sellerYear || found?.sellerYear || 'Verified Student',
          itemTitle: itemMeta?.title || found?.itemTitle || 'Marketplace Item',
          price: itemMeta?.price ?? found?.price ?? null,
          tradeType: itemMeta?.tradeType || found?.tradeType || 'buy',
          lastMessage: previewText,
          timestamp: convTimestamp,
          unreadCount: 0,
          safeMeetupSpot: itemMeta?.safeMeetupSpot || found?.safeMeetupSpot || 'Main Library Ground Floor',
          sellerAvatarUri: itemMeta?.sellerAvatarUri || found?.sellerAvatarUri,
          agreementStatus: found?.agreementStatus || 'pending',
          orderId: found?.orderId,
          escrowStatus: found?.escrowStatus || 'none',
          referenceCode: found?.referenceCode,
          buyerConfirmedAt: found?.buyerConfirmedAt,
          sellerConfirmedAt: found?.sellerConfirmedAt,
          buyerRating: found?.buyerRating,
          buyerRatingTags: found?.buyerRatingTags,
          buyerRatingComment: found?.buyerRatingComment,
          sellerRating: found?.sellerRating,
          sellerRatingTags: found?.sellerRatingTags,
          sellerRatingComment: found?.sellerRatingComment,
        };
        finalConvToPersist = mergedConv;
        const rest = prev.filter((c) => c.id !== resolvedConvId && c.itemId !== itemId);
        const updatedList = [mergedConv, ...rest];
        conversationsRef.current = updatedList;
        if (currentUser?.id) persistConversationsForUser(currentUser.id, updatedList);
        return updatedList;
      });

      // Persist conversation to Supabase with the active user's ID
      if (finalConvToPersist) {
        saveChatConversationToSupabase(finalConvToPersist, activeUserId).catch((err) =>
          console.warn('Supabase save conversation error:', err)
        );
      }

      // 4. Handle Mock Catalogue Auto-reply if applicable
      getStoredUserProfile()
        .then((storedProfile) => {
          let currentUserId = '';
          let currentUserName = '';
          if (storedProfile) {
            try {
              const parsed = JSON.parse(storedProfile);
              if (parsed.id) currentUserId = parsed.id;
              if (parsed.fullName) currentUserName = parsed.fullName.trim().toLowerCase();
            } catch {}
          }

          const isUserOwned = Boolean(
            (currentUserId && itemMeta?.sellerId && itemMeta.sellerId === currentUserId) ||
            (currentUserName && itemMeta?.sellerName && itemMeta.sellerName.trim().toLowerCase() === currentUserName)
          );

          if (isUserOwned) return;

          const isRealOtherUserListing =
            itemId.startsWith('item_') ||
            (!!itemMeta?.sellerId && itemMeta.sellerId.startsWith('user_'));

          if (isRealOtherUserListing) return;

          // Show typing indicator and simulate response ONLY for mock demo catalogue items
          setIsTypingByItemId((prev) => ({ ...prev, [itemId]: true, [resolvedConvId]: true }));

          setTimeout(() => {
            setIsTypingByItemId((prev) => ({ ...prev, [itemId]: false, [resolvedConvId]: false }));

            const lower = trimmed.toLowerCase();
            const spot = itemMeta?.safeMeetupSpot || 'the safe meetup zone';
            let reply = '';

            if (imageUri) {
              reply = `Thanks for sending the photo! Looks in great condition. Can we meet at ${spot}?`;
            } else if (
              lower.includes('price') ||
              lower.includes('discount') ||
              lower.includes('tawad') ||
              lower.includes('negotiable')
            ) {
              reply = `I can give you a student discount of ₱50 off if we can meet today at ${spot}!`;
            } else if (
              lower.includes('when') ||
              lower.includes('where') ||
              lower.includes('time') ||
              lower.includes('today') ||
              lower.includes('tomorrow') ||
              lower.includes('meet')
            ) {
              reply = `Sounds good! I have a class break around 3:00 PM. Can we meet at ${spot}?`;
            } else if (
              lower.includes('available') ||
              lower.includes('avail') ||
              lower.includes('still')
            ) {
              reply = `Yes, it's still available! Would you like to inspect it at ${spot}?`;
            } else if (
              lower.includes('thank') ||
              lower.includes('salamat') ||
              lower.includes('thanks')
            ) {
              reply = `You're welcome! See you at ${spot}.`;
            } else if (itemMeta?.tradeType === 'swap') {
              reply = `That sounds like a fair trade! Let's inspect both items together at ${spot}.`;
            } else if (itemMeta?.tradeType === 'free') {
              reply = `Awesome! I've reserved it for you. See you at ${spot}!`;
            } else {
              reply = `Got it! Thanks for letting me know. Let's meet at ${spot}!`;
            }

            const peerMsgTimestamp = formatMessageTime(new Date());
            const peerConvTimestamp = formatConversationTime(new Date());

            const peerMsg: Message = {
              id: `msg-peer-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              sender: 'seller',
              text: reply,
              timestamp: peerMsgTimestamp,
              createdAt: new Date().toISOString(),
            };

            setMessagesByItemId((prev) => {
              const current = prev[cacheKey] || prev[itemId] || [];
              return {
                ...prev,
                [cacheKey]: [...current, peerMsg],
                [itemId]: [...current, peerMsg],
              };
            });

            saveChatMessageToSupabase({
              id: peerMsg.id,
              itemId,
              conversationId: resolvedConvId,
              sender: 'seller',
              text: reply,
              timestamp: peerMsgTimestamp,
            }).catch((err) => console.warn('Supabase save peer message error:', err));

            setConversations((prev) => {
              const base = prev.find((c) => c.id === resolvedConvId) || prev.find((c) => c.itemId === itemId);
              if (!base) return prev;
              const replyConv: ChatConversation = {
                ...base,
                lastMessage: reply,
                timestamp: peerConvTimestamp,
              };
              saveChatConversationToSupabase(replyConv, activeUserId).catch((err) =>
                console.warn('Supabase save reply conversation error:', err)
              );
              const rest = prev.filter((c) => c.id !== resolvedConvId && c.itemId !== itemId);
              const updatedList = [replyConv, ...rest];
              conversationsRef.current = updatedList;
              if (currentUser?.id) persistConversationsForUser(currentUser.id, updatedList);
              return updatedList;
            });
          }, 900);
        })
        .catch(() => {});
    },
    [getMessages, currentUser]
  );

  return (
    <ChatContext.Provider
      value={{
        conversations,
        isLoading,
        getMessages,
        sendMessage,
        addSystemMessage,
        ensureConversation,
        updateAgreementStatus,
        submitPeerRating,
        isTypingByItemId,
        markAsRead,
        refreshConversations,
        clearChatData,
      }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
