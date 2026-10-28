import React, { useCallback, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { MOCK_ITEMS } from '@/data/mock-items';
import { Message, useChat } from '@/context/chat-context';

type AgreementStatus = 'pending' | 'accepted' | 'completed';

const RATING_DESCRIPTIONS: Record<number, string> = {
  1: '1/5 · Needs Improvement',
  2: '2/5 · Fair Handover',
  3: '3/5 · Good & Smooth',
  4: '4/5 · Great Experience!',
  5: '5/5 · Outstanding Seller!',
};

const RATING_TAG_OPTIONS = [
  'Punctual Meetup',
  'Item as Described',
  'Friendly Peer',
  'Smooth Handover',
  'Fast Response',
];

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
  const flatListRef = useRef<FlatList<Message>>(null);
  const initialScrollDoneRef = useRef(false);

  const { getMessages, sendMessage, addSystemMessage, isTypingByItemId } =
    useChat();

  const item = MOCK_ITEMS.find((i) => i.id === id) || MOCK_ITEMS[0];
  const sellerDisplayName = paramSellerName || item.sellerName;
  const itemDisplayName = paramItemTitle || item.title;

  const isSwap = item.tradeType === 'swap';
  const isFree = item.tradeType === 'free';
  const isBuy = item.tradeType === 'buy';

  const messages = getMessages(id, item);
  const isTyping = isTypingByItemId[id] || false;

  // Interactive Agreement State
  const [agreementStatus, setAgreementStatus] =
    useState<AgreementStatus>('pending');

  const [inputMessage, setInputMessage] = useState('');
  const [pendingImageUri, setPendingImageUri] = useState<string | null>(null);
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  // Buyer Rating System State (1 to 5 Stars)
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [selectedStars, setSelectedStars] = useState(0); // Zero Pre-Selection Invariant
  const [sellerRatingScore, setSellerRatingScore] = useState<number | null>(null);
  const [hasRatedSeller, setHasRatedSeller] = useState(false);
  const [selectedRatingTags, setSelectedRatingTags] = useState<string[]>([]);
  const [ratingComment, setRatingComment] = useState('');

  const scrollToBottom = useCallback((animated = true) => {
    flatListRef.current?.scrollToEnd({ animated });
  }, []);

  // Jump to the very latest message whenever chat is opened or re-focused
  useFocusEffect(
    useCallback(() => {
      initialScrollDoneRef.current = false;
      const t1 = setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 30);
      const t2 = setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 120);
      const t3 = setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
        initialScrollDoneRef.current = true;
      }, 280);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }, [])
  );

  const handleContentSizeChange = () => {
    if (!initialScrollDoneRef.current) {
      flatListRef.current?.scrollToEnd({ animated: false });
    } else {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  };

  const handlePickFromLibrary = async () => {
    setPhotoModalVisible(false);
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Photo Library Access Required',
          'CampusGreen needs permission to access your photo library so you can send photos in chat.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        setPendingImageUri(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Error', 'Unable to open photo library. Please try again.');
    }
  };

  const handleTakePhoto = async () => {
    setPhotoModalVisible(false);
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Camera Access Required',
          'CampusGreen needs camera permission so you can take and send photos in chat.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        setPendingImageUri(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Error', 'Unable to launch camera. Please try again.');
    }
  };

  const handleSendMessage = () => {
    const text = inputMessage.trim();
    if (!text && !pendingImageUri) return;

    sendMessage(
      id,
      {
        text: text || undefined,
        imageUri: pendingImageUri || undefined,
      },
      item
    );
    setInputMessage('');
    setPendingImageUri(null);
    setTimeout(() => {
      scrollToBottom(true);
    }, 50);
  };

  // Interactive handler for Handover & Meetup confirmation
  const handleAcceptAgreement = () => {
    if (agreementStatus !== 'pending') return;

    setAgreementStatus('accepted');

    const confirmationText = isSwap
      ? `🤝 Swap Trade Agreement Confirmed! Both students agreed to trade "${itemDisplayName}" for "Desk Study Lamp". Campus Handover Pass #SWAP-8492 generated.`
      : isFree
      ? `🎁 Freebie Handover Confirmed! "${itemDisplayName}" is reserved for pickup at ${item.safeMeetupSpot}. Campus Pickup Pass #FREE-3201 generated.`
      : `🤝 Meetup Arranged! "${itemDisplayName}" reserved for pickup at ${item.safeMeetupSpot}. Campus Handover Pass #BUY-5120 generated.`;

    addSystemMessage(id, confirmationText);
    setTimeout(() => {
      scrollToBottom(true);
    }, 50);
  };

  const handleCompleteAgreement = () => {
    setAgreementStatus('completed');

    const completionText = isSwap
      ? `✅ Swap Trade Complete! Both items safely inspected and exchanged at ${item.safeMeetupSpot}. ~${item.estimatedCo2SavedKg} kg CO₂ diverted!`
      : isFree
      ? `✅ Freebie Handover Complete! Item received at ${item.safeMeetupSpot}. Thank you for paying it forward!`
      : `✅ Item Retrieval Confirmed! "${itemDisplayName}" inspected and retrieved at ${item.safeMeetupSpot}. Handover successful!`;

    addSystemMessage(id, completionText);
    setTimeout(() => {
      scrollToBottom(true);
    }, 50);

    // Prompt buyer rating pop-up (1 to 5 stars) after confirmation of item retrieval
    setTimeout(() => {
      setRatingModalVisible(true);
    }, 380);
  };

  const handleSubmitRating = () => {
    if (selectedStars === 0) return;

    setHasRatedSeller(true);
    setSellerRatingScore(selectedStars);
    setRatingModalVisible(false);

    const starIcons = '★'.repeat(selectedStars) + '☆'.repeat(5 - selectedStars);
    const label =
      RATING_DESCRIPTIONS[selectedStars] || `${selectedStars}/5 Stars`;
    const tagsNote =
      selectedRatingTags.length > 0
        ? ` (${selectedRatingTags.join(', ')})`
        : '';
    const commentNote = ratingComment.trim()
      ? ` · "${ratingComment.trim()}"`
      : '';

    const reviewSummary = `⭐ You rated ${sellerDisplayName} ${starIcons} (${label})${tagsNote}${commentNote}. Verified buyer review recorded!`;

    addSystemMessage(id, reviewSummary);
    setTimeout(() => {
      scrollToBottom(true);
    }, 60);
  };

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

        {item.sellerAvatarUri ? (
          <Image
            source={{ uri: item.sellerAvatarUri }}
            style={styles.headerAvatar}
            contentFit="cover"
          />
        ) : (
          <View
            style={[
              styles.headerAvatar,
              {
                backgroundColor: theme.primaryLight,
                alignItems: 'center',
                justifyContent: 'center',
              },
            ]}>
            <Text
              style={{
                fontSize: 13,
                fontWeight: '700',
                color: theme.primary,
              }}>
              {sellerDisplayName.charAt(0)}
            </Text>
          </View>
        )}

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

        {agreementStatus === 'accepted' && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Confirm item retrieval"
            style={({ pressed }) => [
              styles.actionPillButton,
              {
                backgroundColor: theme.primary,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
            onPress={handleCompleteAgreement}>
            <Text style={styles.actionPillButtonText}>Confirm Retrieval</Text>
          </Pressable>
        )}

        {agreementStatus === 'completed' && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Rate seller 1 to 5 stars"
            style={({ pressed }) => [
              styles.actionPillButton,
              {
                backgroundColor: hasRatedSeller ? theme.surfaceSubtle : '#FEF3C7',
                borderWidth: 1,
                borderColor: '#F59E0B',
                opacity: pressed ? 0.85 : 1,
              },
            ]}
            onPress={() => setRatingModalVisible(true)}>
            <Text
              style={[
                styles.actionPillButtonText,
                { color: hasRatedSeller ? theme.text : '#92400E' },
              ]}>
              {hasRatedSeller ? `★ ${sellerRatingScore}/5` : 'Rate Seller'}
            </Text>
          </Pressable>
        )}
      </View>

      {/* Messages Feed */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.messageFeed,
          { paddingBottom: Spacing.four },
        ]}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={handleContentSizeChange}
        onLayout={() => {
          flatListRef.current?.scrollToEnd({ animated: false });
        }}
        ListFooterComponent={
          isTyping ? (
            <View style={[styles.messageRow, styles.messageRowSeller]}>
              <View
                style={[
                  styles.bubble,
                  styles.bubbleSeller,
                  styles.typingBubble,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  },
                ]}>
                <Ionicons
                  name="ellipsis-horizontal"
                  size={16}
                  color={theme.primary}
                />
                <Text
                  style={[
                    styles.typingText,
                    { color: theme.textSecondary },
                  ]}>
                  {sellerDisplayName} is typing...
                </Text>
              </View>
            </View>
          ) : undefined
        }
        ListHeaderComponent={
          /* Interactive Handover & Retrieval Agreement Card */
          (isSwap || isFree || isBuy) ? (
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
                    name={
                      isSwap
                        ? 'repeat'
                        : isFree
                        ? 'gift-outline'
                        : 'shield-checkmark-outline'
                    }
                    size={20}
                    color={theme.primary}
                  />
                </View>

                <View style={styles.agreementTitleGroup}>
                  <Text style={[styles.agreementTitle, { color: theme.text }]}>
                    {isSwap
                      ? 'Campus Swap Trade Agreement'
                      : isFree
                      ? 'Pay-It-Forward Freebie Handover'
                      : 'Campus Handover & Retrieval Agreement'}
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
                      ? 'Item Retrieved'
                      : agreementStatus === 'accepted'
                      ? 'Trade Confirmed'
                      : isBuy
                      ? 'Meetup Arranged'
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

                {isBuy && item.price && (
                  <View style={styles.detailRow}>
                    <Text
                      style={[
                        styles.detailLabel,
                        { color: theme.textSecondary },
                      ]}>
                      Price / Protection:
                    </Text>
                    <Text style={[styles.detailValue, { color: theme.text }]}>
                      ₱{item.price.toLocaleString()} · Escrow Protected
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
                      {isSwap
                        ? 'PASS #SWAP-8492'
                        : isFree
                        ? 'PASS #FREE-3201'
                        : 'PASS #BUY-5120'}
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
                        : isFree
                        ? 'Confirm freebie reservation'
                        : 'Confirm meetup arrangement'
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
                        : isFree
                        ? 'Confirm Freebie Acceptance'
                        : 'Confirm Meetup Plan'}
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
                      retrieved and inspected, tap below to confirm.
                    </Text>
                  </View>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Confirm item retrieval and handover"
                    style={({ pressed }) => [
                      styles.completeButton,
                      {
                        backgroundColor: theme.primary,
                        borderColor: theme.primary,
                        opacity: pressed ? 0.88 : 1,
                      },
                    ]}
                    onPress={handleCompleteAgreement}>
                    <Ionicons
                      name="checkmark-done-circle"
                      size={19}
                      color="#FFFFFF"
                    />
                    <Text
                      style={[
                        styles.completeButtonText,
                        { color: '#FFFFFF' },
                      ]}>
                      Confirm Item Retrieval
                    </Text>
                  </Pressable>
                </View>
              )}

              {agreementStatus === 'completed' && (
                <View style={styles.completedSection}>
                  <View style={styles.completedNoticeBox}>
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={theme.primary}
                    />
                    <Text
                      style={[styles.completedNoticeText, { color: theme.text }]}>
                      Handover completed on campus! Item retrieved and verified.
                    </Text>
                  </View>

                  {/* Rating summary or call to rate */}
                  {hasRatedSeller && sellerRatingScore ? (
                    <View
                      style={[
                        styles.ratedSummaryBox,
                        {
                          backgroundColor: theme.surfaceSubtle,
                          borderColor: theme.borderSubtle,
                        },
                      ]}>
                      <View style={styles.ratedSummaryHeader}>
                        <View style={styles.ratedStarsMini}>
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Ionicons
                              key={s}
                              name={
                                s <= sellerRatingScore
                                  ? 'star'
                                  : 'star-outline'
                              }
                              size={14}
                              color={
                                s <= sellerRatingScore
                                  ? '#F59E0B'
                                  : theme.textMuted
                              }
                            />
                          ))}
                        </View>
                        <Text
                          style={[
                            styles.ratedScoreBadgeText,
                            { color: '#F59E0B' },
                          ]}>
                          {sellerRatingScore}/5 Stars
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.ratedFeedbackText,
                          { color: theme.textSecondary },
                        ]}>
                        You rated {sellerDisplayName} · Verified Peer Review
                      </Text>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Update rating for seller"
                        onPress={() => setRatingModalVisible(true)}
                        hitSlop={6}
                        style={styles.editRatingBtn}>
                        <Text
                          style={[
                            styles.editRatingBtnText,
                            { color: theme.primary },
                          ]}>
                          Edit Rating
                        </Text>
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Rate seller 1 to 5 stars"
                      style={({ pressed }) => [
                        styles.rateSellerPromptBtn,
                        {
                          backgroundColor: '#FEF3C7',
                          borderColor: '#F59E0B',
                          opacity: pressed ? 0.85 : 1,
                        },
                      ]}
                      onPress={() => setRatingModalVisible(true)}>
                      <Ionicons name="star" size={16} color="#D97706" />
                      <Text style={styles.rateSellerPromptText}>
                        Rate {sellerDisplayName} (1–5 Stars)
                      </Text>
                    </Pressable>
                  )}
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
                {msg.imageUri && (
                  <Pressable
                    onPress={() => setFullscreenImage(msg.imageUri || null)}
                    accessibilityRole="button"
                    accessibilityLabel="View full photo"
                    style={styles.bubbleImageWrapper}>
                    <Image
                      source={{ uri: msg.imageUri }}
                      style={styles.bubbleImage}
                      contentFit="cover"
                      transition={200}
                    />
                  </Pressable>
                )}
                {!!msg.text && (
                  <Text
                    style={[
                      styles.bubbleText,
                      {
                        color: isMe ? '#FFFFFF' : theme.text,
                        marginTop: msg.imageUri ? 6 : 0,
                      },
                    ]}>
                    {msg.text}
                  </Text>
                )}
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

      {/* Input Dock */}
      <View
        style={[
          styles.inputDockContainer,
          {
            backgroundColor: theme.surface,
            borderTopColor: theme.border,
            paddingBottom: Math.max(insets.bottom, 12),
          },
        ]}>
        {/* Pending Image Attachment Banner */}
        {pendingImageUri && (
          <View
            style={[
              styles.pendingImageRow,
              {
                backgroundColor: theme.surfaceSubtle,
                borderColor: theme.border,
              },
            ]}>
            <View style={styles.pendingImageWrapper}>
              <Image
                source={{ uri: pendingImageUri }}
                style={styles.pendingImageThumbnail}
                contentFit="cover"
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Remove attached photo"
                hitSlop={8}
                onPress={() => setPendingImageUri(null)}
                style={styles.pendingImageRemoveBtn}>
                <Ionicons name="close-circle" size={20} color="#DC2626" />
              </Pressable>
            </View>
            <View style={styles.pendingImageInfo}>
              <Text
                style={[styles.pendingImageTitle, { color: theme.text }]}>
                Photo Attached
              </Text>
              <Text
                style={[
                  styles.pendingImageSubtitle,
                  { color: theme.textSecondary },
                ]}>
                Type a caption or tap send
              </Text>
            </View>
          </View>
        )}

        <View style={styles.inputDock}>
          {/* Camera / Photo Button */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Attach a photo"
            style={({ pressed }) => [
              styles.attachButton,
              {
                backgroundColor: theme.surfaceSubtle,
                borderColor: theme.border,
                opacity: pressed ? 0.75 : 1,
              },
            ]}
            onPress={() => setPhotoModalVisible(true)}>
            <Ionicons name="camera-outline" size={20} color={theme.primary} />
          </Pressable>

          <TextInput
            accessibilityLabel="Message text input"
            placeholder={
              pendingImageUri
                ? 'Add an optional photo caption...'
                : `Message ${sellerDisplayName}...`
            }
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
            disabled={!inputMessage.trim() && !pendingImageUri}
            style={({ pressed }) => [
              styles.sendButton,
              {
                backgroundColor:
                  inputMessage.trim() || pendingImageUri
                    ? theme.primary
                    : theme.surfaceSubtle,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
            onPress={handleSendMessage}>
            <Ionicons
              name="send"
              size={17}
              color={
                inputMessage.trim() || pendingImageUri
                  ? '#FFFFFF'
                  : theme.textMuted
              }
            />
          </Pressable>
        </View>
      </View>

      {/* Photo Picker Options Modal */}
      <Modal
        visible={photoModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPhotoModalVisible(false)}>
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setPhotoModalVisible(false)}>
          <Pressable
            style={[
              styles.modalSheet,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
            onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Share Photo
              </Text>
              <Text
                style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
                Send item condition photos or proof of meetup
              </Text>
            </View>

            <View style={styles.actionButtonsCol}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Take a photo with camera"
                style={({ pressed }) => [
                  styles.sheetActionBtn,
                  {
                    backgroundColor: theme.surfaceSubtle,
                    borderColor: theme.border,
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}
                onPress={handleTakePhoto}>
                <Ionicons name="camera" size={20} color={theme.primary} />
                <Text
                  style={[styles.sheetActionBtnText, { color: theme.text }]}>
                  Take Photo (Camera)
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Choose from photo library"
                style={({ pressed }) => [
                  styles.sheetActionBtn,
                  {
                    backgroundColor: theme.surfaceSubtle,
                    borderColor: theme.border,
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}
                onPress={handlePickFromLibrary}>
                <Ionicons name="images" size={20} color={theme.primary} />
                <Text
                  style={[styles.sheetActionBtnText, { color: theme.text }]}>
                  Choose from Gallery
                </Text>
              </Pressable>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cancel photo picker"
              style={({ pressed }) => [
                styles.cancelButton,
                {
                  backgroundColor: theme.surfaceSubtle,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
              onPress={() => setPhotoModalVisible(false)}>
              <Text style={[styles.cancelButtonText, { color: theme.text }]}>
                Cancel
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Fullscreen Photo Modal */}
      <Modal
        visible={!!fullscreenImage}
        transparent
        animationType="fade"
        onRequestClose={() => setFullscreenImage(null)}>
        <View style={styles.fullscreenOverlay}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close full screen photo"
            style={styles.fullscreenCloseBtn}
            onPress={() => setFullscreenImage(null)}>
            <Ionicons name="close-circle" size={32} color="#FFFFFF" />
          </Pressable>
          {fullscreenImage && (
            <Image
              source={{ uri: fullscreenImage }}
              style={styles.fullscreenImage}
              contentFit="contain"
            />
          )}
        </View>
      </Modal>

      {/* Buyer Rating System Modal (1 to 5 Stars) */}
      <Modal
        visible={ratingModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRatingModalVisible(false)}>
        <Pressable
          style={styles.ratingOverlay}
          onPress={() => setRatingModalVisible(false)}>
          <Pressable
            style={[
              styles.ratingCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
            onPress={(e) => e.stopPropagation()}>
            <View style={styles.ratingHeader}>
              <View
                style={[
                  styles.ratingStarBadge,
                  { backgroundColor: '#FEF3C7' },
                ]}>
                <Ionicons name="star" size={24} color="#F59E0B" />
              </View>
              <Text style={[styles.ratingTitle, { color: theme.text }]}>
                Rate Your Seller
              </Text>
              <Text
                style={[
                  styles.ratingSubtitle,
                  { color: theme.textSecondary },
                ]}>
                How was your item retrieval with {sellerDisplayName}?
              </Text>
              <View
                style={[
                  styles.ratingItemPill,
                  { backgroundColor: theme.surfaceSubtle },
                ]}>
                <Ionicons
                  name="pricetag-outline"
                  size={12}
                  color={theme.primary}
                />
                <Text
                  numberOfLines={1}
                  style={[styles.ratingItemPillText, { color: theme.text }]}>
                  {itemDisplayName}
                </Text>
              </View>
            </View>

            {/* Interactive 1/5 Star Rating Selector */}
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((starIndex) => {
                const isFilled = starIndex <= selectedStars;
                return (
                  <Pressable
                    key={starIndex}
                    accessibilityRole="button"
                    accessibilityLabel={`Rate ${starIndex} out of 5 stars`}
                    hitSlop={8}
                    style={styles.starTouchTarget}
                    onPress={() => setSelectedStars(starIndex)}>
                    <Ionicons
                      name={isFilled ? 'star' : 'star-outline'}
                      size={34}
                      color={isFilled ? '#F59E0B' : theme.textMuted}
                    />
                  </Pressable>
                );
              })}
            </View>

            {/* Dynamic Rating Label */}
            <Text
              style={[
                styles.ratingScoreLabel,
                {
                  color: selectedStars > 0 ? '#F59E0B' : theme.textMuted,
                },
              ]}>
              {selectedStars > 0
                ? RATING_DESCRIPTIONS[selectedStars]
                : 'Tap a star to rate (1 to 5 stars)'}
            </Text>

            {/* Optional Peer Feedback Tags */}
            <View style={styles.tagsContainer}>
              <Text
                style={[
                  styles.tagsSectionLabel,
                  { color: theme.textSecondary },
                ]}>
                What went well? (Optional)
              </Text>
              <View style={styles.tagsRow}>
                {RATING_TAG_OPTIONS.map((tag) => {
                  const isSelected = selectedRatingTags.includes(tag);
                  return (
                    <Pressable
                      key={tag}
                      accessibilityRole="button"
                      accessibilityLabel={`Feedback tag: ${tag}`}
                      style={[
                        styles.tagChip,
                        {
                          backgroundColor: isSelected
                            ? theme.primary
                            : theme.surfaceSubtle,
                          borderColor: isSelected
                            ? theme.primary
                            : theme.border,
                        },
                      ]}
                      onPress={() => {
                        setSelectedRatingTags((prev) =>
                          prev.includes(tag)
                            ? prev.filter((t) => t !== tag)
                            : [...prev, tag]
                        );
                      }}>
                      <Text
                        style={[
                          styles.tagChipText,
                          {
                            color: isSelected ? '#FFFFFF' : theme.text,
                            fontWeight: isSelected ? '700' : '500',
                          },
                        ]}>
                        {tag}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Optional Comment Input */}
            <TextInput
              accessibilityLabel="Optional seller review note"
              placeholder={`Leave an optional note for ${sellerDisplayName}...`}
              placeholderTextColor={theme.textMuted}
              value={ratingComment}
              onChangeText={setRatingComment}
              maxLength={160}
              style={[
                styles.ratingCommentInput,
                {
                  backgroundColor: theme.surfaceSubtle,
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
              multiline
            />

            {/* Rating Actions */}
            <View style={styles.ratingActionsRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Submit rating for seller"
                disabled={selectedStars === 0}
                style={({ pressed }) => [
                  styles.submitRatingBtn,
                  {
                    backgroundColor: theme.primary,
                    opacity: selectedStars === 0 ? 0.45 : pressed ? 0.88 : 1,
                  },
                ]}
                onPress={handleSubmitRating}>
                <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                <Text style={styles.submitRatingBtnText}>
                  {selectedStars === 0
                    ? 'Select Stars to Submit'
                    : `Submit ${selectedStars}/5 Rating`}
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Maybe later"
                hitSlop={8}
                style={styles.skipRatingBtn}
                onPress={() => setRatingModalVisible(false)}>
                <Text
                  style={[
                    styles.skipRatingBtnText,
                    { color: theme.textSecondary },
                  ]}>
                  Maybe Later
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    overflow: 'hidden',
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
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: Spacing.two,
  },
  typingText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  bubbleImageWrapper: {
    borderRadius: Radius.md,
    overflow: 'hidden',
    marginBottom: 4,
  },
  bubbleImage: {
    width: 220,
    height: 150,
    borderRadius: Radius.md,
  },
  inputDockContainer: {
    borderTopWidth: 1,
  },
  inputDock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
  },
  attachButton: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingImageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginHorizontal: Spacing.four,
    marginTop: Spacing.two,
    padding: Spacing.two,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  pendingImageWrapper: {
    position: 'relative',
  },
  pendingImageThumbnail: {
    width: 48,
    height: 48,
    borderRadius: Radius.sm,
  },
  pendingImageRemoveBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  },
  pendingImageInfo: {
    flex: 1,
    gap: 2,
  },
  pendingImageTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  pendingImageSubtitle: {
    fontSize: 11,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  modalHeader: {
    gap: 2,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalSubtitle: {
    fontSize: 12,
  },
  actionButtonsCol: {
    gap: Spacing.two,
  },
  sheetActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  sheetActionBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: Spacing.three,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginTop: Spacing.one,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  fullscreenOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenCloseBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },
  fullscreenImage: {
    width: '100%',
    height: '80%',
  },
  // Rating Modal Styles
  ratingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  ratingCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.four,
    alignItems: 'center',
    gap: Spacing.three,
  },
  ratingHeader: {
    alignItems: 'center',
    gap: 4,
    width: '100%',
  },
  ratingStarBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  ratingTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  ratingSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 2,
    lineHeight: 18,
  },
  ratingItemPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.three,
    paddingVertical: 4,
    borderRadius: Radius.full,
    marginTop: 6,
    maxWidth: 260,
  },
  ratingItemPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.one,
  },
  starTouchTarget: {
    padding: 4,
  },
  ratingScoreLabel: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  tagsContainer: {
    width: '100%',
    gap: 6,
  },
  tagsSectionLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagChip: {
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  tagChipText: {
    fontSize: 11,
  },
  ratingCommentInput: {
    width: '100%',
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    height: 60,
    fontSize: 13,
    textAlignVertical: 'top',
  },
  ratingActionsRow: {
    width: '100%',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  submitRatingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
    borderRadius: Radius.md,
  },
  submitRatingBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  skipRatingBtn: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  skipRatingBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  completedSection: {
    gap: Spacing.two,
  },
  ratedSummaryBox: {
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: 4,
    marginTop: 2,
  },
  ratedSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ratedStarsMini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratedScoreBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  ratedFeedbackText: {
    fontSize: 12,
    lineHeight: 16,
  },
  editRatingBtn: {
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  editRatingBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  rateSellerPromptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two + 3,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginTop: 4,
  },
  rateSellerPromptText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
  },
});
