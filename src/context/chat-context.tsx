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
import { formatConversationTime, formatMessageTime } from '@/utils/format-time';

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
  getMessages: (itemId: string, itemMeta?: Partial<MarketplaceItem>) => Message[];
  sendMessage: (
    itemId: string,
    content: string | { text?: string; imageUri?: string },
    itemMeta?: Partial<MarketplaceItem>
  ) => void;
  addSystemMessage: (itemId: string, text: string) => void;
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

  const refreshConversations = useCallback(async () => {
    setIsLoading(true);
    try {
      let sellerName = '';
      let activeUserId = 'user_active_student';
      try {
        const stored = await AsyncStorage.getItem('@campusgreen_user_profile');
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

      const liveConvs = await fetchChatConversationsFromSupabase(activeUserId, sellerName);
      if (liveConvs && liveConvs.length > 0) {
        setConversations(liveConvs);
        conversationsRef.current = liveConvs;
        AsyncStorage.setItem('@campusgreen_chat_conversations', JSON.stringify(liveConvs)).catch(() => {});
      } else {
        const cached = await AsyncStorage.getItem('@campusgreen_chat_conversations');
        if (cached) {
          try {
            const parsedCached = JSON.parse(cached);
            if (Array.isArray(parsedCached) && parsedCached.length > 0) {
              setConversations(parsedCached);
              conversationsRef.current = parsedCached;
            }
          } catch {}
        }
      }
    } catch (err) {
      console.warn('Error refreshing conversations:', err);
      const cached = await AsyncStorage.getItem('@campusgreen_chat_conversations');
      if (cached) {
        try {
          const parsedCached = JSON.parse(cached);
          if (Array.isArray(parsedCached) && parsedCached.length > 0) {
            setConversations(parsedCached);
            conversationsRef.current = parsedCached;
          }
        } catch {}
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    // Fast-path: load cached conversations from AsyncStorage first
    AsyncStorage.getItem('@campusgreen_chat_conversations')
      .then((cached) => {
        if (isMounted && cached) {
          try {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setConversations(parsed);
              conversationsRef.current = parsed;
              setIsLoading(false);
            }
          } catch {}
        }
      })
      .catch(() => {});

    AsyncStorage.getItem('@campusgreen_user_profile')
      .then((stored) => {
        let sellerName = '';
        let activeUserId = 'user_active_student';
        if (stored) {
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
        }
        return fetchChatConversationsFromSupabase(activeUserId, sellerName);
      })
      .then((convs) => {
        if (isMounted && convs && convs.length > 0) {
          setConversations(convs);
          conversationsRef.current = convs;
          AsyncStorage.setItem('@campusgreen_chat_conversations', JSON.stringify(convs)).catch(() => {});
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

  const getMessages = useCallback(
    (itemId: string, itemMeta?: Partial<MarketplaceItem>): Message[] => {
      if (messagesByItemId[itemId]) {
        return messagesByItemId[itemId];
      }

      // Check Supabase in background
      fetchChatMessagesFromSupabase(itemId).then((dbMsgs) => {
        if (dbMsgs && dbMsgs.length > 0) {
          setMessagesByItemId((prev) => ({
            ...prev,
            [itemId]: dbMsgs,
          }));
        }
      });

      const title = itemMeta?.title || 'this item';
      const spot = itemMeta?.safeMeetupSpot || 'the designated campus zone';

      const initialGreeting: Message = {
        id: `init-${itemId}`,
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

  const addSystemMessage = useCallback((itemId: string, text: string) => {
    const formattedNow = formatMessageTime(new Date());
    const sysMsg: Message = {
      id: `sys-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      sender: 'system',
      text,
      timestamp: formattedNow,
    };

    setMessagesByItemId((prev) => {
      const current = prev[itemId] || [];
      return {
        ...prev,
        [itemId]: [...current, sysMsg],
      };
    });

    saveChatMessageToSupabase({
      id: sysMsg.id,
      itemId,
      sender: 'system',
      text,
      timestamp: formattedNow,
    }).catch((err) => console.warn('Supabase save system message error:', err));
  }, []);

  const ensureConversation = useCallback(
    (item: MarketplaceItem, extra?: Partial<ChatConversation>): ChatConversation => {
      const existing = conversationsRef.current.find((c) => c.itemId === item.id);
      if (existing) {
        if (extra && Object.keys(extra).length > 0) {
          const merged: ChatConversation = { ...existing, ...extra };
          setConversations((prev) => [merged, ...prev.filter((c) => c.itemId !== item.id)]);
          const nextList = [merged, ...conversationsRef.current.filter((c) => c.itemId !== item.id)];
          conversationsRef.current = nextList;
          AsyncStorage.setItem('@campusgreen_chat_conversations', JSON.stringify(nextList)).catch(() => {});
          saveChatConversationToSupabase(merged, merged.userId || 'user_active_student').catch((err) =>
            console.warn('Supabase save merged conversation error:', err)
          );
          return merged;
        }
        return existing;
      }

      const conversationId = `conv-${item.id}`;
      const initialGreeting =
        item.tradeType === 'swap'
          ? `Hi! Thanks for your interest in swapping for my ${item.title}. What gear or item are you proposing to trade?`
          : item.tradeType === 'free'
          ? `Hi! Glad someone can make use of the ${item.title}! It's completely free for campus pickup at ${item.safeMeetupSpot}.`
          : `Hi! Thanks for checking out the ${item.title}. It's still available for meetup at ${item.safeMeetupSpot}. Feel free to ask any questions!`;

      const newConv: ChatConversation = {
        id: conversationId,
        itemId: item.id,
        userId: currentUser?.id || 'user_active_student',
        buyerId: currentUser?.id || 'user_active_student',
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

      setConversations((prev) => [newConv, ...prev.filter((c) => c.itemId !== item.id)]);
      const nextList = [newConv, ...conversationsRef.current.filter((c) => c.itemId !== item.id)];
      conversationsRef.current = nextList;
      AsyncStorage.setItem('@campusgreen_chat_conversations', JSON.stringify(nextList)).catch(() => {});

      saveChatConversationToSupabase(newConv, newConv.userId || 'user_active_student').catch((err) =>
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
      const existing = conversationsRef.current.find((c) => c.itemId === itemId);
      if (!existing) return;
      const updated: ChatConversation = {
        ...existing,
        agreementStatus: status,
        ...extra,
      };

      setConversations((prev) => [updated, ...prev.filter((c) => c.itemId !== itemId)]);
      const nextList = [updated, ...conversationsRef.current.filter((c) => c.itemId !== itemId)];
      conversationsRef.current = nextList;
      AsyncStorage.setItem('@campusgreen_chat_conversations', JSON.stringify(nextList)).catch(() => {});

      await saveChatConversationToSupabase(
        updated,
        updated.userId || 'user_active_student'
      ).catch((err) => console.warn('Supabase save agreement status error:', err));
    },
    []
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

      setConversations((prev) => [updated, ...prev.filter((c) => c.itemId !== itemId)]);
      const nextList = [updated, ...conversationsRef.current.filter((c) => c.itemId !== itemId)];
      conversationsRef.current = nextList;
      AsyncStorage.setItem('@campusgreen_chat_conversations', JSON.stringify(nextList)).catch(() => {});

      await saveChatConversationToSupabase(
        updated,
        updated.userId || 'user_active_student'
      ).catch((err) => console.warn('Supabase save peer rating error:', err));
    },
    []
  );

  const sendMessage = useCallback(
    (
      itemId: string,
      content: string | { text?: string; imageUri?: string },
      itemMeta?: Partial<MarketplaceItem>
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

      // 1. Update messages immediately in local state
      setMessagesByItemId((prev) => {
        const existing = prev[itemId] || getMessages(itemId, itemMeta);
        return {
          ...prev,
          [itemId]: [...existing, userMsg],
        };
      });

      // 2. Persist message to Supabase
      saveChatMessageToSupabase({
        id: userMsg.id,
        itemId,
        sender: senderRole,
        text: userMsg.text,
        imageUri: userMsg.imageUri,
        timestamp: msgTimestamp,
      }).catch((err) => console.warn('Supabase save user message error:', err));

      // 3. Update / bump conversation in the inbox list
      const conversationId = `conv-${itemId}`;
      let finalConvToPersist: ChatConversation | null = null;

      setConversations((prev) => {
        const existingConv = prev.find((c) => c.itemId === itemId);
        const mergedConv: ChatConversation = {
          id: conversationId,
          itemId,
          userId: isSeller
            ? ((itemMeta as any)?.buyerId || existingConv?.userId)
            : (currentUser?.id || existingConv?.userId || 'user_active_student'),
          buyerName: isSeller
            ? ((itemMeta as any)?.buyerName || existingConv?.buyerName)
            : (currentUser?.fullName || existingConv?.buyerName),
          buyerAvatarUri: (itemMeta as any)?.buyerAvatarUri || existingConv?.buyerAvatarUri,
          buyerYear: (itemMeta as any)?.buyerYear || existingConv?.buyerYear,
          sellerId: itemMeta?.sellerId || existingConv?.sellerId,
          sellerName: itemMeta?.sellerName || existingConv?.sellerName || 'Campus Student',
          sellerYear: itemMeta?.sellerYear || existingConv?.sellerYear || 'Verified Student',
          itemTitle: itemMeta?.title || existingConv?.itemTitle || 'Marketplace Item',
          price: itemMeta?.price ?? existingConv?.price ?? null,
          tradeType: itemMeta?.tradeType || existingConv?.tradeType || 'buy',
          lastMessage: previewText,
          timestamp: convTimestamp,
          unreadCount: 0,
          safeMeetupSpot: itemMeta?.safeMeetupSpot || existingConv?.safeMeetupSpot || 'Main Library Ground Floor',
          sellerAvatarUri: itemMeta?.sellerAvatarUri || existingConv?.sellerAvatarUri,
          agreementStatus: existingConv?.agreementStatus || 'pending',
          orderId: existingConv?.orderId,
          escrowStatus: existingConv?.escrowStatus || 'none',
          referenceCode: existingConv?.referenceCode,
          buyerConfirmedAt: existingConv?.buyerConfirmedAt,
          sellerConfirmedAt: existingConv?.sellerConfirmedAt,
          buyerRating: existingConv?.buyerRating,
          buyerRatingTags: existingConv?.buyerRatingTags,
          buyerRatingComment: existingConv?.buyerRatingComment,
          sellerRating: existingConv?.sellerRating,
          sellerRatingTags: existingConv?.sellerRatingTags,
          sellerRatingComment: existingConv?.sellerRatingComment,
        };
        finalConvToPersist = mergedConv;
        const rest = prev.filter((c) => c.itemId !== itemId);
        return [mergedConv, ...rest];
      });

      // Persist conversation to Supabase with the active user's ID
      AsyncStorage.getItem('@campusgreen_user_profile')
        .then((stored) => {
          let activeUserId = 'user_active_student';
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              if (parsed.id) activeUserId = parsed.id;
            } catch {}
          }
          if (finalConvToPersist) {
            return saveChatConversationToSupabase(finalConvToPersist, activeUserId);
          }
        })
        .catch((err) =>
          console.warn('Supabase save conversation error:', err)
        );

      // 4. Determine if the seller is an actual human user
      // If the item belongs to an actual user (created via sell tab or has sellerId or matches active profile),
      // DO NOT auto-reply. Auto-reply is strictly reserved for the automated demo/mock student catalogue.
      AsyncStorage.getItem('@campusgreen_user_profile')
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

          if (isUserOwned) {
            // Own listing - no auto-reply
            return;
          }

          // If the item was created by another real student (e.g. ID starts with item_ or sellerId starts with user_),
          // do NOT auto reply as well! Let the real user respond.
          const isRealOtherUserListing =
            itemId.startsWith('item_') ||
            (!!itemMeta?.sellerId && itemMeta.sellerId.startsWith('user_'));

          if (isRealOtherUserListing) {
            return;
          }

          // Show typing indicator and simulate realistic peer response ONLY for mock catalogue items
          setIsTypingByItemId((prev) => ({ ...prev, [itemId]: true }));

          setTimeout(() => {
            setIsTypingByItemId((prev) => ({ ...prev, [itemId]: false }));

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
              const current = prev[itemId] || [];
              return {
                ...prev,
                [itemId]: [...current, peerMsg],
              };
            });

            saveChatMessageToSupabase({
              id: peerMsg.id,
              itemId,
              sender: 'seller',
              text: reply,
              timestamp: peerMsgTimestamp,
            }).catch((err) => console.warn('Supabase save peer message error:', err));

            // Update conversation with peer's reply
            setConversations((prev) => {
              const base = prev.find((c) => c.itemId === itemId);
              if (!base) return prev;
              const replyConv: ChatConversation = {
                ...base,
                lastMessage: reply,
                timestamp: peerConvTimestamp,
              };
              saveChatConversationToSupabase(replyConv).catch((err) =>
                console.warn('Supabase save reply conversation error:', err)
              );
              const rest = prev.filter((c) => c.itemId !== itemId);
              return [replyConv, ...rest];
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
