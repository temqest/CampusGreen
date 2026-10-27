import React, { useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { MOCK_ITEMS } from '@/data/mock-items';

interface Message {
  id: string;
  sender: 'me' | 'seller';
  text: string;
  timestamp: string;
}

export default function ChatScreen() {
  const { id, sellerName: paramSellerName, itemTitle: paramItemTitle } =
    useLocalSearchParams<{
      id: string;
      sellerName?: string;
      itemTitle?: string;
    }>();
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const item = MOCK_ITEMS.find((i) => i.id === id) || MOCK_ITEMS[0];
  const sellerDisplayName = paramSellerName || item.sellerName;
  const itemDisplayName = paramItemTitle || item.title;

  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm1',
      sender: 'seller',
      text: `Hi! Thanks for checking out the ${itemDisplayName}. It's still in great condition.`,
      timestamp: '2:15 PM',
    },
    {
      id: 'm2',
      sender: 'me',
      text: `Hi ${sellerDisplayName}! Can we meet at ${item.safeMeetupSpot}?`,
      timestamp: '2:18 PM',
    },
    {
      id: 'm3',
      sender: 'seller',
      text: `Yes, perfect! I have class nearby. What time works best for you?`,
      timestamp: '2:20 PM',
    },
  ]);

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text) return;

    setMessages((prev) => [
      ...prev,
      {
        id: `msg-${prev.length + 1}-${text.slice(0, 4)}`,
        sender: 'me',
        text,
        timestamp: 'Just now',
      },
    ]);
    setInputMessage('');
  };

  const quickPrompts = [
    'Can we meet today?',
    'Is the price negotiable?',
    'I will pay via GCash Escrow',
  ];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[
        styles.screen,
        {
          backgroundColor: theme.background,
          paddingTop: insets.top,
        },
      ]}>
      {/* Top Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.surface,
            borderBottomColor: theme.border,
          },
        ]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
          style={({ pressed }) => [
            styles.backButton,
            { opacity: pressed ? 0.7 : 1 },
          ]}
          onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </Pressable>

        <View style={styles.headerTitleGroup}>
          <View style={styles.sellerRow}>
            <Text
              numberOfLines={1}
              style={[styles.sellerName, { color: theme.text }]}>
              {sellerDisplayName}
            </Text>
            <Ionicons name="checkmark-circle" size={14} color={theme.primary} />
          </View>
          <Text
            numberOfLines={1}
            style={[styles.sellerSubtitle, { color: theme.textSecondary }]}>
            {item.sellerYear} · Verified Student
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Meetup zones info"
          style={({ pressed }) => [
            styles.meetupZoneButton,
            {
              backgroundColor: theme.surfaceSubtle,
              borderColor: theme.border,
              opacity: pressed ? 0.75 : 1,
            },
          ]}
          onPress={() => router.push('/meetup-zones')}>
          <Ionicons name="location-outline" size={14} color={theme.primary} />
          <Text
            style={[styles.meetupZoneButtonText, { color: theme.primary }]}>
            Zone
          </Text>
        </Pressable>
      </View>

      {/* Pinned Item Summary Bar */}
      <View
        style={[
          styles.itemBar,
          {
            backgroundColor: theme.surface,
            borderBottomColor: theme.borderSubtle,
          },
        ]}>
        <View
          style={[
            styles.itemIconBox,
            { backgroundColor: theme.surfaceSubtle },
          ]}>
          <Ionicons name="pricetag-outline" size={18} color={theme.primary} />
        </View>
        <View style={styles.itemBarInfo}>
          <Text
            numberOfLines={1}
            style={[styles.itemBarTitle, { color: theme.text }]}>
            {itemDisplayName}
          </Text>
          <Text
            style={[styles.itemBarSpot, { color: theme.textSecondary }]}>
            ₱{item.price?.toLocaleString()} · {item.safeMeetupSpot}
          </Text>
        </View>

        {item.tradeType === 'buy' && item.price && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Pay ₱${item.price}`}
            style={({ pressed }) => [
              styles.payEscrowButton,
              {
                backgroundColor: theme.primary,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
            onPress={() =>
              router.push({
                pathname: '/payment/[id]',
                params: { id: item.id },
              })
            }>
            <Text style={styles.payEscrowButtonText}>Pay Escrow</Text>
          </Pressable>
        )}
      </View>

      {/* Messages Feed */}
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.messageFeed,
          { paddingBottom: Spacing.four },
        ]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: msg }) => {
          const isMe = msg.sender === 'me';
          return (
            <View
              style={[
                styles.messageRow,
                isMe ? styles.messageRowMe : styles.messageRowSeller,
              ]}>
              <View
                style={[
                  styles.bubble,
                  isMe
                    ? [styles.bubbleMe, { backgroundColor: theme.primary }]
                    : [
                        styles.bubbleSeller,
                        {
                          backgroundColor: theme.surface,
                          borderColor: theme.border,
                        },
                      ],
                ]}>
                <Text
                  style={[
                    styles.bubbleText,
                    { color: isMe ? '#FFFFFF' : theme.text },
                  ]}>
                  {msg.text}
                </Text>
                <Text
                  style={[
                    styles.messageTimestamp,
                    {
                      color: isMe ? 'rgba(255,255,255,0.75)' : theme.textMuted,
                    },
                  ]}>
                  {msg.timestamp}
                </Text>
              </View>
            </View>
          );
        }}
      />

      {/* Quick Prompts */}
      <View style={styles.quickPromptsRow}>
        {quickPrompts.map((prompt, idx) => (
          <Pressable
            key={idx}
            accessibilityRole="button"
            accessibilityLabel={`Send prompt: ${prompt}`}
            style={({ pressed }) => [
              styles.promptChip,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                opacity: pressed ? 0.75 : 1,
              },
            ]}
            onPress={() => handleSendMessage(prompt)}>
            <Text style={[styles.promptChipText, { color: theme.textSecondary }]}>
              {prompt}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Input Dock */}
      <View
        style={[
          styles.inputDock,
          {
            backgroundColor: theme.surface,
            borderTopColor: theme.border,
            paddingBottom: Math.max(insets.bottom, 12),
          },
        ]}>
        <TextInput
          accessibilityLabel="Message text input"
          placeholder={`Message ${sellerDisplayName}...`}
          placeholderTextColor={theme.textMuted}
          value={inputMessage}
          onChangeText={setInputMessage}
          style={[
            styles.inputField,
            {
              backgroundColor: theme.surfaceSubtle,
              borderColor: theme.border,
              color: theme.text,
            },
          ]}
          multiline
        />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Send message"
          disabled={!inputMessage.trim()}
          style={({ pressed }) => [
            styles.sendButton,
            {
              backgroundColor: inputMessage.trim()
                ? theme.primary
                : theme.surfaceSubtle,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
          onPress={() => handleSendMessage()}>
          <Ionicons
            name="send"
            size={17}
            color={inputMessage.trim() ? '#FFFFFF' : theme.textMuted}
          />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
    gap: Spacing.three,
  },
  backButton: {
    padding: Spacing.one,
  },
  headerTitleGroup: {
    flex: 1,
    gap: 1,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '700',
  },
  sellerSubtitle: {
    fontSize: 12,
  },
  meetupZoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  meetupZoneButtonText: {
    fontSize: 11,
    fontWeight: '600',
  },
  itemBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two + 2,
    borderBottomWidth: 1,
  },
  itemIconBox: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemBarInfo: {
    flex: 1,
    gap: 2,
  },
  itemBarTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  itemBarSpot: {
    fontSize: 11,
  },
  payEscrowButton: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    borderRadius: Radius.md,
  },
  payEscrowButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  messageFeed: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  messageRowMe: {
    justifyContent: 'flex-end',
  },
  messageRowSeller: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two + 2,
    borderRadius: Radius.lg,
  },
  bubbleMe: {
    borderBottomRightRadius: Radius.sm,
  },
  bubbleSeller: {
    borderBottomLeftRadius: Radius.sm,
    borderWidth: 1,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  messageTimestamp: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  quickPromptsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  promptChip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  promptChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  inputDock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    borderTopWidth: 1,
  },
  inputField: {
    flex: 1,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    maxHeight: 90,
    fontSize: 14,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
