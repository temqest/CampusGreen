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
  sender: 'me' | 'seller' | 'system';
  text: string;
  timestamp: string;
}

type AgreementStatus = 'pending' | 'accepted' | 'completed';

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

  const isSwap = item.tradeType === 'swap';
  const isFree = item.tradeType === 'free';
  const isBuy = item.tradeType === 'buy';

  // Interactive Agreement State for Swap / Freebie
  const [agreementStatus, setAgreementStatus] =
    useState<AgreementStatus>('pending');

  const [inputMessage, setInputMessage] = useState('');

  // Initial tailored message thread based on trade type
  const [messages, setMessages] = useState<Message[]>(() => {
    if (isSwap) {
      return [
        {
          id: 'm1',
          sender: 'seller',
          text: `Hi! Thanks for offering to swap your Desk Study Lamp for my ${itemDisplayName}.`,
          timestamp: '2:15 PM',
        },
        {
          id: 'm2',
          sender: 'me',
          text: `Hi ${sellerDisplayName}! Yes, the lamp is in great condition. Can we meet at ${item.safeMeetupSpot}?`,
          timestamp: '2:18 PM',
        },
        {
          id: 'm3',
          sender: 'seller',
          text: `Sounds great to me! I proposed the swap agreement above. Please confirm when ready!`,
          timestamp: '2:20 PM',
        },
      ];
    }

    if (isFree) {
      return [
        {
          id: 'm1',
          sender: 'seller',
          text: `Hi! Glad someone can make use of the ${itemDisplayName}! It's completely free.`,
          timestamp: '1:10 PM',
        },
        {
          id: 'm2',
          sender: 'me',
          text: `Thank you so much ${sellerDisplayName}! Can I pick it up at ${item.safeMeetupSpot}?`,
          timestamp: '1:14 PM',
        },
        {
          id: 'm3',
          sender: 'seller',
          text: `Yes! Tap the 'Confirm Freebie Acceptance' button so I can reserve it under your name.`,
          timestamp: '1:16 PM',
        },
      ];
    }

    // Default for Buy
    return [
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
    ];
  });

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

  // Interactive handler for Swap & Freebie confirmation
  const handleAcceptAgreement = () => {
    if (agreementStatus !== 'pending') return;

    setAgreementStatus('accepted');

    const confirmationText = isSwap
      ? `🤝 Swap Trade Agreement Confirmed! Both students agreed to trade "${itemDisplayName}" for "Desk Study Lamp". Campus Handover Pass #SWAP-8492 generated.`
      : `🎁 Freebie Handover Confirmed! "${itemDisplayName}" is reserved for pickup at ${item.safeMeetupSpot}. Campus Pickup Pass #FREE-3201 generated.`;

    setMessages((prev) => [
      ...prev,
      {
        id: `sys-${prev.length + 1}`,
        sender: 'system',
        text: confirmationText,
        timestamp: 'Just now',
      },
    ]);
  };

  const handleCompleteAgreement = () => {
    setAgreementStatus('completed');

    const completionText = isSwap
      ? `✅ Swap Trade Complete! Both items safely inspected and exchanged at ${item.safeMeetupSpot}. ~${item.estimatedCo2SavedKg} kg CO₂ diverted!`
      : `✅ Freebie Handover Complete! Item received at ${item.safeMeetupSpot}. Thank you for paying it forward!`;

    setMessages((prev) => [
      ...prev,
      {
        id: `sys-${prev.length + 1}`,
        sender: 'system',
        text: completionText,
        timestamp: 'Just now',
      },
    ]);
  };

  const quickPrompts = isSwap
    ? [
        'Can we meet today at the guard post?',
        'I have the desk lamp ready',
        'What time works best for you?',
      ]
    : isFree
    ? [
        'Thank you for paying it forward!',
        'Can I pick it up tomorrow 2PM?',
        'I will be at the gazebo on time',
      ]
    : [
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
          <Ionicons
            name={
              isSwap
                ? 'repeat'
                : isFree
                ? 'gift-outline'
                : 'pricetag-outline'
            }
            size={18}
            color={theme.primary}
          />
        </View>

        <View style={styles.itemBarInfo}>
          <Text
            numberOfLines={1}
            style={[styles.itemBarTitle, { color: theme.text }]}>
            {itemDisplayName}
          </Text>
          <Text
            numberOfLines={1}
            style={[styles.itemBarSpot, { color: theme.textSecondary }]}>
            {isSwap
              ? 'Swap Trade · ' + item.safeMeetupSpot
              : isFree
              ? 'Pay-It-Forward Freebie · ' + item.safeMeetupSpot
              : `₱${item.price?.toLocaleString()} · ${item.safeMeetupSpot}`}
          </Text>
        </View>

        {/* Quick action in bar depending on deal type */}
        {isBuy && item.price && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Pay ₱${item.price}`}
            style={({ pressed }) => [
              styles.actionPillButton,
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
            <Text style={styles.actionPillButtonText}>Pay Escrow</Text>
          </Pressable>
        )}

        {isSwap && agreementStatus === 'pending' && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Accept swap trade"
            style={({ pressed }) => [
              styles.actionPillButton,
              {
                backgroundColor: theme.primary,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
            onPress={handleAcceptAgreement}>
            <Text style={styles.actionPillButtonText}>Accept Swap</Text>
          </Pressable>
        )}

        {isFree && agreementStatus === 'pending' && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Confirm freebie acceptance"
            style={({ pressed }) => [
              styles.actionPillButton,
              {
                backgroundColor: theme.primary,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
            onPress={handleAcceptAgreement}>
            <Text style={styles.actionPillButtonText}>Confirm Freebie</Text>
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
        ListHeaderComponent={
          /* Interactive Trade / Freebie Agreement Card */
          (isSwap || isFree) ? (
            <View
              style={[
                styles.agreementCard,
                {
                  backgroundColor: theme.surface,
                  borderColor:
                    agreementStatus === 'accepted'
                      ? theme.primary
                      : theme.border,
                },
              ]}>
              <View style={styles.agreementHeaderRow}>
                <View
                  style={[
                    styles.agreementIconBadge,
                    { backgroundColor: theme.surfaceSubtle },
                  ]}>
                  <Ionicons
                    name={isSwap ? 'repeat' : 'gift-outline'}
                    size={20}
                    color={theme.primary}
                  />
                </View>

                <View style={styles.agreementTitleGroup}>
                  <Text style={[styles.agreementTitle, { color: theme.text }]}>
                    {isSwap
                      ? 'Campus Swap Trade Agreement'
                      : 'Pay-It-Forward Freebie Handover'}
                  </Text>
                  <Text
                    style={[
                      styles.agreementSubtitle,
                      { color: theme.textSecondary },
                    ]}>
                    Safe campus meetup agreement
                  </Text>
                </View>

                {/* Dynamic State Badge */}
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        agreementStatus === 'completed'
                          ? theme.badgeGreenBg
                          : agreementStatus === 'accepted'
                          ? theme.badgeGreenBg
                          : theme.surfaceSubtle,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.statusBadgeText,
                      {
                        color:
                          agreementStatus === 'pending'
                            ? theme.textSecondary
                            : theme.primary,
                      },
                    ]}>
                    {agreementStatus === 'completed'
                      ? 'Handover Complete'
                      : agreementStatus === 'accepted'
                      ? 'Trade Confirmed'
                      : 'Pending Acceptance'}
                  </Text>
                </View>
              </View>

              {/* Agreement Details Matrix */}
              <View
                style={[
                  styles.agreementDetailsBox,
                  {
                    backgroundColor: theme.surfaceSubtle,
                    borderColor: theme.borderSubtle,
                  },
                ]}>
                <View style={styles.detailRow}>
                  <Text
                    style={[styles.detailLabel, { color: theme.textSecondary }]}>
                    {isSwap ? 'Offering:' : 'Item:'}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={[styles.detailValue, { color: theme.text }]}>
                    {itemDisplayName}
                  </Text>
                </View>

                {isSwap && (
                  <View style={styles.detailRow}>
                    <Text
                      style={[
                        styles.detailLabel,
                        { color: theme.textSecondary },
                      ]}>
                      In Exchange:
                    </Text>
                    <Text style={[styles.detailValue, { color: theme.text }]}>
                      Desk Study Lamp
                    </Text>
                  </View>
                )}

                <View style={styles.detailRow}>
                  <Text
                    style={[styles.detailLabel, { color: theme.textSecondary }]}>
                    Meetup Zone:
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={[styles.detailValue, { color: theme.text }]}>
                    {item.safeMeetupSpot}
                  </Text>
                </View>

                {agreementStatus !== 'pending' && (
                  <View style={styles.detailRow}>
                    <Text
                      style={[
                        styles.detailLabel,
                        { color: theme.textSecondary },
                      ]}>
                      Handover Pass:
                    </Text>
                    <Text
                      style={[
                        styles.passCodeText,
                        { color: theme.primary },
                      ]}>
                      {isSwap ? 'PASS #SWAP-8492' : 'PASS #FREE-3201'}
                    </Text>
                  </View>
                )}
              </View>

              {/* Action Buttons for Agreement */}
              {agreementStatus === 'pending' && (
                <View style={styles.cardActionGroup}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={
                      isSwap
                        ? 'Confirm swap trade agreement'
                        : 'Confirm freebie reservation'
                    }
                    style={({ pressed }) => [
                      styles.confirmPrimaryButton,
                      {
                        backgroundColor: theme.primary,
                        opacity: pressed ? 0.88 : 1,
                      },
                    ]}
                    onPress={handleAcceptAgreement}>
                    <Ionicons
                      name={isSwap ? 'repeat' : 'checkmark-circle-outline'}
                      size={18}
                      color="#FFFFFF"
                    />
                    <Text style={styles.confirmPrimaryButtonText}>
                      {isSwap
                        ? 'Accept Swap Trade'
                        : 'Confirm Freebie Acceptance'}
                    </Text>
                  </Pressable>

                  <Text
                    style={[
                      styles.agreementHelperText,
                      { color: theme.textMuted },
                    ]}>
                    Tapping confirm reserves the item and generates a campus
                    handover pass for your meetup.
                  </Text>
                </View>
              )}

              {agreementStatus === 'accepted' && (
                <View style={styles.cardActionGroup}>
                  <View style={styles.confirmedNoticeRow}>
                    <Ionicons
                      name="shield-checkmark"
                      size={18}
                      color={theme.primary}
                    />
                    <Text
                      style={[
                        styles.confirmedNoticeText,
                        { color: theme.textSecondary },
                      ]}>
                      Meet {sellerDisplayName} at {item.safeMeetupSpot}. Once
                      exchanged, tap below to finalize.
                    </Text>
                  </View>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Mark item handover as complete"
                    style={({ pressed }) => [
                      styles.completeButton,
                      {
                        backgroundColor: theme.surfaceSubtle,
                        borderColor: theme.border,
                        opacity: pressed ? 0.8 : 1,
                      },
                    ]}
                    onPress={handleCompleteAgreement}>
                    <Ionicons
                      name="checkmark-done"
                      size={18}
                      color={theme.primary}
                    />
                    <Text
                      style={[
                        styles.completeButtonText,
                        { color: theme.primary },
                      ]}>
                      Mark Handover Complete
                    </Text>
                  </Pressable>
                </View>
              )}

              {agreementStatus === 'completed' && (
                <View style={styles.completedNoticeBox}>
                  <Ionicons
                    name="checkmark-circle"
                    size={22}
                    color={theme.primary}
                  />
                  <Text
                    style={[styles.completedNoticeText, { color: theme.text }]}>
                    Handover completed on campus! Thanks for choosing sustainable
                    gear reuse.
                  </Text>
                </View>
              )}
            </View>
          ) : undefined
        }
        renderItem={({ item: msg }) => {
          if (msg.sender === 'system') {
            return (
              <View
                style={[
                  styles.systemMessageBubble,
                  {
                    backgroundColor: theme.surfaceSubtle,
                    borderColor: theme.borderSubtle,
                  },
                ]}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={16}
                  color={theme.primary}
                />
                <Text
                  style={[styles.systemMessageText, { color: theme.text }]}>
                  {msg.text}
                </Text>
                <Text
                  style={[
                    styles.systemMessageTime,
                    { color: theme.textMuted },
                  ]}>
                  {msg.timestamp}
                </Text>
              </View>
            );
          }

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
            <Text
              style={[styles.promptChipText, { color: theme.textSecondary }]}>
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
  actionPillButton: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 7,
    borderRadius: Radius.md,
  },
  actionPillButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  agreementCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.four,
    gap: Spacing.three,
    marginBottom: Spacing.three,
  },
  agreementHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + 2,
  },
  agreementIconBadge: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agreementTitleGroup: {
    flex: 1,
    gap: 1,
  },
  agreementTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  agreementSubtitle: {
    fontSize: 11,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  agreementDetailsBox: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.three,
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 12,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '600',
    maxWidth: '68%',
    textAlign: 'right',
  },
  passCodeText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardActionGroup: {
    gap: 6,
    paddingTop: 2,
  },
  confirmPrimaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
    borderRadius: Radius.md,
  },
  confirmPrimaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  agreementHelperText: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 15,
  },
  confirmedNoticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.one,
  },
  confirmedNoticeText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two + 2,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginTop: 4,
  },
  completeButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  completedNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + 2,
    paddingVertical: Spacing.two,
  },
  completedNoticeText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  messageFeed: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  systemMessageBubble: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginVertical: Spacing.two,
  },
  systemMessageText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
  },
  systemMessageTime: {
    fontSize: 10,
    alignSelf: 'flex-end',
    marginLeft: 4,
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
