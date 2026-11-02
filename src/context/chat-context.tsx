import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { MarketplaceItem } from '@/types/item';
import {
  fetchChatConversationsFromSupabase,
  fetchChatMessagesFromSupabase,
  saveChatConversationToSupabase,
  saveChatMessageToSupabase,
} from '@/lib/database';

export interface Message {
  id: string;
  sender: 'me' | 'seller' | 'system';
  text?: string;
  imageUri?: string;
  timestamp: string;
}

export interface ChatConversation {
  id: string;
  itemId: string;
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
}

interface ChatContextType {
  conversations: ChatConversation[];
  getMessages: (itemId: string, itemMeta?: Partial<MarketplaceItem>) => Message[];
  sendMessage: (
    itemId: string,
    content: string | { text?: string; imageUri?: string },
    itemMeta?: Partial<MarketplaceItem>
  ) => void;
  addSystemMessage: (itemId: string, text: string) => void;
  ensureConversation: (item: MarketplaceItem) => ChatConversation;
  isTypingByItemId: Record<string, boolean>;
  markAsRead: (itemId: string) => void;
  refreshConversations: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  // Clean Slate: Starts empty for new accounts, populated from Supabase
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [messagesByItemId, setMessagesByItemId] = useState<Record<string, Message[]>>({});
  const [isTypingByItemId, setIsTypingByItemId] = useState<Record<string, boolean>>({});

  const refreshConversations = useCallback(async () => {
    try {
      const liveConvs = await fetchChatConversationsFromSupabase('user_active_student');
      setConversations(liveConvs);
    } catch (err) {
      console.warn('Error refreshing conversations:', err);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    fetchChatConversationsFromSupabase('user_active_student')
      .then((convs) => {
        if (isMounted) setConversations(convs);
      })
      .catch((err) => {
        console.warn('Error loading chat conversations:', err);
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
        timestamp: 'Just now',
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
    const sysMsg: Message = {
      id: `sys-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      sender: 'system',
      text,
      timestamp: 'Just now',
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
      timestamp: 'Just now',
    }).catch((err) => console.warn('Supabase save system message error:', err));
  }, []);

  const ensureConversation = useCallback((item: MarketplaceItem): ChatConversation => {
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
      sellerName: item.sellerName || 'Campus Student',
      sellerYear: item.sellerYear || 'Verified Student',
      itemTitle: item.title,
      price: item.price ?? null,
      tradeType: item.tradeType || 'buy',
      lastMessage: initialGreeting,
      timestamp: 'Just now',
      unreadCount: 0,
      safeMeetupSpot: item.safeMeetupSpot || 'Main Library Ground Floor',
      sellerAvatarUri: item.sellerAvatarUri,
    };

    setConversations((prev) => {
      const existing = prev.find((c) => c.itemId === item.id);
      if (existing) return prev;
      return [newConv, ...prev];
    });

    saveChatConversationToSupabase(newConv).catch((err) =>
      console.warn('Supabase save auto-generated conversation error:', err)
    );

    return newConv;
  }, []);

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

      const userMsg: Message = {
        id: `msg-me-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        sender: 'me',
        text: trimmed || undefined,
        imageUri: imageUri || undefined,
        timestamp: 'Just now',
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
        sender: 'me',
        text: userMsg.text,
        imageUri: userMsg.imageUri,
        timestamp: 'Just now',
      }).catch((err) => console.warn('Supabase save user message error:', err));

      // 3. Update / bump conversation in the inbox list
      const conversationId = `conv-${itemId}`;
      const updatedConv: ChatConversation = {
        id: conversationId,
        itemId,
        sellerName: itemMeta?.sellerName || 'Campus Student',
        sellerYear: itemMeta?.sellerYear || 'Verified Student',
        itemTitle: itemMeta?.title || 'Marketplace Item',
        price: itemMeta?.price ?? null,
        tradeType: itemMeta?.tradeType || 'buy',
        lastMessage: previewText,
        timestamp: 'Just now',
        unreadCount: 0,
        safeMeetupSpot: itemMeta?.safeMeetupSpot || 'Main Library Ground Floor',
        sellerAvatarUri: itemMeta?.sellerAvatarUri,
      };

      setConversations((prev) => {
        const rest = prev.filter((c) => c.itemId !== itemId);
        return [updatedConv, ...rest];
      });

      // Persist conversation to Supabase
      saveChatConversationToSupabase(updatedConv).catch((err) =>
        console.warn('Supabase save conversation error:', err)
      );

      // 4. Show typing indicator and simulate realistic peer response
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

        const peerMsg: Message = {
          id: `msg-peer-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          sender: 'seller',
          text: reply,
          timestamp: 'Just now',
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
          timestamp: 'Just now',
        }).catch((err) => console.warn('Supabase save peer message error:', err));

        // Update conversation with peer's reply
        const replyConv: ChatConversation = {
          ...updatedConv,
          lastMessage: reply,
          timestamp: 'Just now',
        };

        setConversations((prev) => {
          const rest = prev.filter((c) => c.itemId !== itemId);
          return [replyConv, ...rest];
        });

        saveChatConversationToSupabase(replyConv).catch((err) =>
          console.warn('Supabase save reply conversation error:', err)
        );
      }, 900);
    },
    [getMessages]
  );

  return (
    <ChatContext.Provider
      value={{
        conversations,
        getMessages,
        sendMessage,
        addSystemMessage,
        ensureConversation,
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
