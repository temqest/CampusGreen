import React, {
  createContext,
  useCallback,
  useContext,
  useState,
} from 'react';
import { MOCK_ITEMS } from '@/data/mock-items';
import { MarketplaceItem } from '@/types/item';

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

const INITIAL_CONVERSATIONS: ChatConversation[] = [
  {
    id: 'conv-swap',
    itemId: '4',
    sellerName: 'Paolo Reyes',
    sellerYear: '3rd Year Arch',
    itemTitle: 'Drafting Board (24x36) with Rotring T-Square',
    price: null,
    tradeType: 'swap',
    lastMessage: 'I’d love to swap for the desk study lamp! Tap accept to confirm trade.',
    timestamp: '10m ago',
    unreadCount: 1,
    safeMeetupSpot: 'EA Building Security Guard Post',
    sellerAvatarUri: 'https://images.unsplash.com/photo-1680525021501-ddea41969892?w=400&q=80',
  },
  {
    id: 'conv-free',
    itemId: '3',
    sellerName: 'Bea Dimaculangan',
    sellerYear: '2nd Year BSTM',
    itemTitle: 'Pay-It-Forward: Philippine Heritage & Cultural Tourism Reviewers',
    price: null,
    tradeType: 'free',
    lastMessage: 'The heritage review notes are all set for you! Tap accept to confirm reservation.',
    timestamp: '25m ago',
    unreadCount: 1,
    safeMeetupSpot: 'Alingal Hall Tourism Lobby',
    sellerAvatarUri: 'https://images.unsplash.com/photo-1765650113773-0752556dcea0?w=400&q=80',
  },
  {
    id: 'conv-buy-1',
    itemId: '1',
    sellerName: 'Maria Santos',
    sellerYear: '3rd Year BSTM',
    itemTitle: 'AdNU BS Tourism Corporate Blazer & Scarf Set (Size M)',
    price: 450,
    tradeType: 'buy',
    lastMessage: 'Sure! Let’s meet at Alingal Hall Tourism Lobby tomorrow around 2:30 PM.',
    timestamp: '1h ago',
    unreadCount: 0,
    safeMeetupSpot: 'Alingal Hall Tourism Lobby',
    sellerAvatarUri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80',
  },
  {
    id: 'conv-buy-2',
    itemId: '2',
    sellerName: 'Kenzo Alcantara',
    sellerYear: '4th Year BSTM',
    itemTitle: 'Tour Guiding Portable Voice Amplifier & Wireless Mic Kit',
    price: 750,
    tradeType: 'buy',
    lastMessage: 'Rechargeable amplifier & mic are fully working. Can bring it to Alingal Hall anytime today.',
    timestamp: '3h ago',
    unreadCount: 0,
    safeMeetupSpot: 'Alingal Hall Tourism Lobby',
    sellerAvatarUri: 'https://images.unsplash.com/photo-1492462543947-040389c4a66c?w=400&q=80',
  },
];

const INITIAL_MESSAGES: Record<string, Message[]> = {
  '4': [
    {
      id: 'm1',
      sender: 'seller',
      text: 'Hi! Thanks for offering to swap your Desk Study Lamp for my Drafting Board (24x36) with Rotring T-Square.',
      timestamp: '2:15 PM',
    },
    {
      id: 'm2',
      sender: 'me',
      text: 'Hi Paolo! Yes, the lamp is in great condition. Can we meet at EA Building Security Guard Post?',
      timestamp: '2:18 PM',
    },
    {
      id: 'm3',
      sender: 'seller',
      text: 'I’d love to swap for the desk study lamp! Tap accept to confirm trade.',
      timestamp: '10m ago',
    },
  ],
  '3': [
    {
      id: 'm1',
      sender: 'seller',
      text: 'Hi! Glad someone can make use of the Philippine Heritage & Cultural Tourism Reviewers! It is completely free.',
      timestamp: '1:10 PM',
    },
    {
      id: 'm2',
      sender: 'me',
      text: 'Thank you Bea! Can I pick it up at Alingal Hall Tourism Lobby?',
      timestamp: '1:14 PM',
    },
    {
      id: 'm3',
      sender: 'seller',
      text: 'The heritage review notes are all set for you! Tap accept to confirm reservation.',
      timestamp: '25m ago',
    },
  ],
  '1': [
    {
      id: 'm1',
      sender: 'seller',
      text: 'Hi! Thanks for checking out the BS Tourism Corporate Blazer & Scarf Set (Size M). It is freshly dry-cleaned and ready for practicum.',
      timestamp: '1:30 PM',
    },
    {
      id: 'm2',
      sender: 'me',
      text: 'Hi Maria! Can we meet at Alingal Hall Tourism Lobby?',
      timestamp: '1:45 PM',
    },
    {
      id: 'm3',
      sender: 'seller',
      text: 'Sure! Let’s meet at Alingal Hall Tourism Lobby tomorrow around 2:30 PM.',
      timestamp: '1h ago',
    },
  ],
  '2': [
    {
      id: 'm1',
      sender: 'seller',
      text: 'Hey there! Let me know if you need any details about the Tour Guiding Portable Voice Amplifier & Wireless Mic Kit.',
      timestamp: '11:00 AM',
    },
    {
      id: 'm2',
      sender: 'me',
      text: 'Hi Kenzo, is the headset microphone and AUX cord included?',
      timestamp: '11:15 AM',
    },
    {
      id: 'm3',
      sender: 'seller',
      text: 'Rechargeable amplifier & mic are fully working. Can bring it to Alingal Hall anytime today.',
      timestamp: '3h ago',
    },
  ],
};

interface ChatContextType {
  conversations: ChatConversation[];
  getMessages: (itemId: string, itemMeta?: Partial<MarketplaceItem>) => Message[];
  sendMessage: (
    itemId: string,
    content: string | { text?: string; imageUri?: string },
    itemMeta?: Partial<MarketplaceItem>
  ) => void;
  addSystemMessage: (itemId: string, text: string) => void;
  isTypingByItemId: Record<string, boolean>;
  markAsRead: (itemId: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [conversations, setConversations] =
    useState<ChatConversation[]>(INITIAL_CONVERSATIONS);
  const [messagesByItemId, setMessagesByItemId] =
    useState<Record<string, Message[]>>(INITIAL_MESSAGES);
  const [isTypingByItemId, setIsTypingByItemId] = useState<
    Record<string, boolean>
  >({});

  const getMessages = useCallback(
    (itemId: string, itemMeta?: Partial<MarketplaceItem>): Message[] => {
      if (messagesByItemId[itemId]) {
        return messagesByItemId[itemId];
      }

      const item =
        itemMeta || MOCK_ITEMS.find((i) => i.id === itemId) || MOCK_ITEMS[0];
      const title = item.title || 'this item';
      const spot = item.safeMeetupSpot || 'the designated campus zone';

      const initialGreeting: Message = {
        id: `init-${itemId}`,
        sender: 'seller',
        text:
          item.tradeType === 'swap'
            ? `Hi! Thanks for your interest in swapping for my ${title}. What gear or item are you proposing to trade?`
            : item.tradeType === 'free'
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

      const item =
        itemMeta || MOCK_ITEMS.find((i) => i.id === itemId) || MOCK_ITEMS[0];

      // Update messages immediately for the active chat
      setMessagesByItemId((prev) => {
        const existing = prev[itemId] || getMessages(itemId, item);
        return {
          ...prev,
          [itemId]: [...existing, userMsg],
        };
      });

      // Update / bump conversation in the inbox list
      setConversations((prev) => {
        const existingIndex = prev.findIndex((c) => c.itemId === itemId);
        if (existingIndex >= 0) {
          const target = prev[existingIndex];
          const updated: ChatConversation = {
            ...target,
            lastMessage: previewText,
            timestamp: 'Just now',
            unreadCount: 0,
          };
          const rest = prev.filter((_, idx) => idx !== existingIndex);
          return [updated, ...rest];
        }

        // New conversation
        const newConversation: ChatConversation = {
          id: `conv-${itemId}`,
          itemId,
          sellerName: item.sellerName || 'Campus Student',
          sellerYear: item.sellerYear || 'Verified Student',
          itemTitle: item.title || 'Marketplace Item',
          price: item.price ?? null,
          tradeType: item.tradeType || 'buy',
          lastMessage: previewText,
          timestamp: 'Just now',
          unreadCount: 0,
          safeMeetupSpot: item.safeMeetupSpot || 'Campus Meetup Zone',
          sellerAvatarUri: item.sellerAvatarUri,
        };

        return [newConversation, ...prev];
      });

      // Show typing indicator for peer
      setIsTypingByItemId((prev) => ({ ...prev, [itemId]: true }));

      // Simulate a realistic student peer response after 900ms
      setTimeout(() => {
        setIsTypingByItemId((prev) => ({ ...prev, [itemId]: false }));

        const lower = trimmed.toLowerCase();
        const spot = item.safeMeetupSpot || 'the safe meetup zone';
        let reply = '';

        if (imageUri) {
          reply = `Thanks for sending the photo! The item looks in great condition. Can we meet at ${spot}?`;
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
        } else if (item.tradeType === 'swap') {
          reply = `That sounds like a fair trade! Let's inspect both items together at ${spot}.`;
        } else if (item.tradeType === 'free') {
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

        // Update conversation lastMessage with the peer's reply
        setConversations((prev) => {
          const existingIndex = prev.findIndex((c) => c.itemId === itemId);
          if (existingIndex >= 0) {
            const target = prev[existingIndex];
            const updated: ChatConversation = {
              ...target,
              lastMessage: reply,
              timestamp: 'Just now',
            };
            const rest = prev.filter((_, idx) => idx !== existingIndex);
            return [updated, ...rest];
          }
          return prev;
        });
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
        isTypingByItemId,
        markAsRead,
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
