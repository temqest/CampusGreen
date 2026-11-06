import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useItems } from '@/context/items-context';
import { Message, useChat } from '@/context/chat-context';
import { MarketplaceItem } from '@/types/item';
import { uploadImageToSupabase } from '@/lib/supabase';
import { releaseEscrowToSeller } from '@/lib/database';

type AgreementStatus = 'pending' | 'accepted' | 'completed' | 'cancelled';

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
  const {
    id,
    conversationId: paramConversationId,
    sellerName: paramSellerName,
    buyerName: paramBuyerName,
    buyerAvatarUri: paramBuyerAvatarUri,
    sellerAvatarUri: paramSellerAvatarUri,
    itemTitle: paramItemTitle,
    offeredItem: paramOfferedItem,
    isSeller: paramIsSeller,
    agreementStatus: paramAgreementStatus,
    escrowStatus: paramEscrowStatus,
    referenceCode: paramReferenceCode,
    orderId: paramOrderId,
    buyerRating: paramBuyerRating,
    sellerRating: paramSellerRating,
  } = useLocalSearchParams<{
    id: string;
    conversationId?: string;
    sellerName?: string;
    buyerName?: string;
    buyerAvatarUri?: string;
    sellerAvatarUri?: string;
    itemTitle?: string;
    offeredItem?: string;
    isSeller?: string;
    agreementStatus?: string;
    escrowStatus?: string;
    referenceCode?: string;
    orderId?: string;
    buyerRating?: string;
    sellerRating?: string;
  }>();
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList<Message>>(null);
  const initialScrollDoneRef = useRef(false);

  const {
    conversations,
    getMessages,
    sendMessage,
    addSystemMessage,
    updateAgreementStatus,
    submitPeerRating,
    isTypingByItemId,
  } = useChat();
  const { items, getItemById, setItemStatus } = useItems();

  const foundItem = getItemById(id) || items.find((i) => i.id === id);
  const item = useMemo(
    () =>
      foundItem ||
      ({
        id,
        sellerName: paramSellerName || 'Campus Student',
        title: paramItemTitle || 'Marketplace Item',
        tradeType: 'buy',
        safeMeetupSpot: 'Main Library Ground Floor',
        price: null,
      } as unknown as MarketplaceItem),
    [foundItem, id, paramSellerName, paramItemTitle]
  );
  const itemDisplayName = paramItemTitle || item.title;

  const isSwap = item.tradeType === 'swap';
  const isFree = item.tradeType === 'free';
  const isBuy = item.tradeType === 'buy';

  // Active user profile state to determine viewer role (Buyer vs Seller)
  const [currentUser, setCurrentUser] = useState<{ id: string; fullName: string } | null>(null);

  const loadProfile = useCallback(() => {
    AsyncStorage.getItem('@uniswap_user_profile').then(async (str) => {
      if (!str) {
        str = await AsyncStorage.getItem('@campusgreen_user_profile');
      }
      if (str) {
        try {
          const parsed = JSON.parse(str);
          setCurrentUser({
            id: parsed.id || '',
            fullName: parsed.fullName ? parsed.fullName.trim() : '',
          });
        } catch {}
      }
    });
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const activeUserId = currentUser?.id || 'user_active_student';

  const matchedConv = useMemo(
    () =>
      (paramConversationId && conversations.find((c) => c.id === paramConversationId)) ||
      conversations.find(
        (c) =>
          c.itemId === id &&
          (c.buyerId === activeUserId || c.userId === activeUserId || c.sellerId === activeUserId)
      ) ||
      conversations.find((c) => c.itemId === id),
    [conversations, id, paramConversationId, activeUserId]
  );

  const {
    isViewerSeller,
    counterpartDisplayName,
    counterpartRoleLabel,
    counterpartSubtitle,
    counterpartAvatarUri,
    counterpartInitials,
  } = useMemo(() => {
    const currentId = currentUser?.id || '';
    const currentName = currentUser?.fullName?.trim().toLowerCase() || '';

    const resolvedSellerName = paramSellerName || item?.sellerName || matchedConv?.sellerName || 'Campus Student';
    const resolvedBuyerName = paramBuyerName || matchedConv?.buyerName || (currentId && currentName ? currentUser?.fullName : 'Campus Student');

    let isSeller = false;
    if (paramIsSeller === 'true') {
      isSeller = true;
    } else if (paramIsSeller === 'false') {
      isSeller = false;
    } else {
      const isSellerByName = Boolean(currentName && resolvedSellerName.trim().toLowerCase() === currentName);
      const isSellerById = Boolean(currentId && item?.sellerId && item.sellerId === currentId);
      const isBuyerByName = Boolean(currentName && resolvedBuyerName && resolvedBuyerName.trim().toLowerCase() === currentName);
      const isBuyerById = Boolean(currentId && matchedConv?.userId && matchedConv.userId === currentId);

      if (isSellerByName || isSellerById) {
        isSeller = true;
      } else if (isBuyerByName || isBuyerById) {
        isSeller = false;
      } else {
        isSeller = false;
      }
    }

    const displayName = isSeller ? (resolvedBuyerName || 'Campus Student') : resolvedSellerName;
    const roleLabel: 'Buyer' | 'Seller' = isSeller ? 'Buyer' : 'Seller';
    const avatarUri = isSeller
      ? (paramBuyerAvatarUri || matchedConv?.buyerAvatarUri)
      : (paramSellerAvatarUri || item?.sellerAvatarUri || matchedConv?.sellerAvatarUri);
    const subtitle = isSeller
      ? `${matchedConv?.buyerYear || 'Verified Student'} · Inquiring Buyer`
      : `${item?.sellerYear || matchedConv?.sellerYear || 'Verified Student'} · Verified Seller`;

    const initials = displayName
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || (isSeller ? 'B' : 'S');

    return {
      isViewerSeller: isSeller,
      counterpartDisplayName: displayName,
      counterpartRoleLabel: roleLabel,
      counterpartSubtitle: subtitle,
      counterpartAvatarUri: avatarUri,
      counterpartInitials: initials,
    };
  }, [
    paramIsSeller,
    currentUser,
    paramSellerName,
    paramBuyerName,
    paramBuyerAvatarUri,
    paramSellerAvatarUri,
    item,
    matchedConv,
  ]);

  const currentConvId = paramConversationId || matchedConv?.id || `conv-${id}-${activeUserId}`;
  const messages = getMessages(id, item, currentConvId);
  const isTyping = (currentConvId && isTypingByItemId[currentConvId]) || isTypingByItemId[id] || false;

  // Interactive Agreement State (Permanently synchronized from persistent conversation)
  const agreementStatus: AgreementStatus = useMemo(() => {
    if (matchedConv?.agreementStatus) {
      if (matchedConv.agreementStatus === 'completed') return 'completed';
      if (matchedConv.agreementStatus === 'accepted') return 'accepted';
      if (matchedConv.agreementStatus === 'cancelled') return 'cancelled';
      return 'pending';
    }
    if (paramAgreementStatus === 'completed' || paramAgreementStatus === 'accepted') {
      return paramAgreementStatus as AgreementStatus;
    }
    if (item?.status === 'sold') return 'completed';
    if (item?.status === 'reserved' || item?.isReserved) return 'accepted';
    return 'pending';
  }, [matchedConv?.agreementStatus, paramAgreementStatus, item?.status, item?.isReserved]);

  const activeReferenceCode = matchedConv?.referenceCode || paramReferenceCode;
  const activeEscrowStatus = matchedConv?.escrowStatus || paramEscrowStatus;
  const activeOrderId = matchedConv?.orderId || paramOrderId;

  const [exchangeItemName, setExchangeItemName] = useState<string>(
    paramOfferedItem || 'Desk Study Lamp'
  );
  const [isEditingTradeItem, setIsEditingTradeItem] = useState(false);
  const [editTradeItemInput, setEditTradeItemInput] = useState('');

  const [inputMessage, setInputMessage] = useState('');
  const [pendingImageUri, setPendingImageUri] = useState<string | null>(null);
  const [pendingImageBase64, setPendingImageBase64] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  // Peer Rating System State (Permanently synchronized from persistent conversation)
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [selectedStars, setSelectedStars] = useState(0); // Zero Pre-Selection Invariant
  const [selectedRatingTags, setSelectedRatingTags] = useState<string[]>([]);
  const [ratingComment, setRatingComment] = useState('');

  const peerRatingScore = useMemo(() => {
    if (isViewerSeller) {
      return matchedConv?.sellerRating ?? (paramSellerRating ? Number(paramSellerRating) : null);
    } else {
      return matchedConv?.buyerRating ?? (paramBuyerRating ? Number(paramBuyerRating) : null);
    }
  }, [isViewerSeller, matchedConv?.sellerRating, matchedConv?.buyerRating, paramSellerRating, paramBuyerRating]);

  const hasRatedPeer = useMemo(() => {
    return Boolean(peerRatingScore && peerRatingScore > 0);
  }, [peerRatingScore]);

  const openRatingModal = useCallback(() => {
    if (hasRatedPeer && peerRatingScore) {
      setSelectedStars(peerRatingScore);
      const existingTags = isViewerSeller
        ? matchedConv?.sellerRatingTags
        : matchedConv?.buyerRatingTags;
      setSelectedRatingTags(existingTags || []);
      const existingComment = isViewerSeller
        ? matchedConv?.sellerRatingComment
        : matchedConv?.buyerRatingComment;
      setRatingComment(existingComment || '');
    } else {
      setSelectedStars(0);
      setSelectedRatingTags([]);
      setRatingComment('');
    }
    setRatingModalVisible(true);
  }, [hasRatedPeer, peerRatingScore, isViewerSeller, matchedConv]);

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
          'UniSwap needs permission to access your photo library so you can send photos in chat.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.85,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        setPendingImageUri(result.assets[0].uri);
        setPendingImageBase64(result.assets[0].base64 || null);
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
          'UniSwap needs camera permission so you can take and send photos in chat.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.85,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        setPendingImageUri(result.assets[0].uri);
        setPendingImageBase64(result.assets[0].base64 || null);
      }
    } catch {
      Alert.alert('Error', 'Unable to launch camera. Please try again.');
    }
  };

  const handleSendMessage = async () => {
    const text = inputMessage.trim();
    if (!text && !pendingImageUri) return;

    let finalImageUri: string | undefined;

    if (pendingImageUri) {
      setIsUploadingPhoto(true);
      try {
        finalImageUri = await uploadImageToSupabase(
          pendingImageUri,
          'chat',
          pendingImageBase64
        );
      } catch (err) {
        console.warn('Failed to upload chat image to Supabase:', err);
        finalImageUri = pendingImageUri; // fallback
      } finally {
        setIsUploadingPhoto(false);
      }
    }

    sendMessage(
      id,
      {
        text: text || undefined,
        imageUri: finalImageUri,
      },
      item,
      currentConvId
    );
    setInputMessage('');
    setPendingImageUri(null);
    setPendingImageBase64(null);
    setTimeout(() => {
      scrollToBottom(true);
    }, 50);
  };

  // Interactive handler for Handover & Meetup confirmation
  const handleAcceptAgreement = async () => {
    if (agreementStatus !== 'pending') return;

    const passCode =
      activeReferenceCode ||
      (isSwap
        ? `SWAP-${Math.floor(1000 + Math.random() * 9000)}`
        : isFree
        ? `FREE-${Math.floor(1000 + Math.random() * 9000)}`
        : `BUY-${Math.floor(1000 + Math.random() * 9000)}`);

    const confirmationText = isSwap
      ? `🤝 Swap Trade Agreement Confirmed! Both students agreed to trade "${itemDisplayName}" for "${exchangeItemName}". Campus Handover Pass #${passCode} generated.`
      : isFree
      ? `🎁 Freebie Handover Confirmed! "${itemDisplayName}" is reserved for pickup at ${item.safeMeetupSpot}. Campus Pickup Pass #${passCode} generated.`
      : `🤝 Meetup Arranged! "${itemDisplayName}" reserved for pickup at ${item.safeMeetupSpot}. Campus Handover Pass #${passCode} generated.`;

    addSystemMessage(id, confirmationText);
    await updateAgreementStatus(id, 'accepted', { referenceCode: passCode });
    // Update listing state to reserved in local & remote marketplace store
    setItemStatus(id, 'reserved');

    setTimeout(() => {
      scrollToBottom(true);
    }, 50);
  };

  const handleCompleteAgreement = async () => {
    if (agreementStatus === 'completed') return;

    const completionText = isViewerSeller
      ? (isSwap
          ? `✅ Swap Trade Handover Confirmed! Both items safely exchanged with ${counterpartDisplayName} at ${item.safeMeetupSpot}. ~${item.estimatedCo2SavedKg} kg CO₂ diverted!`
          : isFree
          ? `✅ Freebie Handover Confirmed! Item handed over to ${counterpartDisplayName} at ${item.safeMeetupSpot}. Thank you for paying it forward!`
          : `✅ Item Handover Confirmed! "${itemDisplayName}" handed over to ${counterpartDisplayName} at ${item.safeMeetupSpot}. Handover successful!`)
      : (isSwap
          ? `✅ Swap Trade Retrieval Confirmed! Both items safely inspected and exchanged with ${counterpartDisplayName} at ${item.safeMeetupSpot}. ~${item.estimatedCo2SavedKg} kg CO₂ diverted!`
          : isFree
          ? `✅ Freebie Retrieval Confirmed! Item received from ${counterpartDisplayName} at ${item.safeMeetupSpot}. Thank you for paying it forward!`
          : `✅ Item Retrieval Confirmed! "${itemDisplayName}" inspected and retrieved from ${counterpartDisplayName} at ${item.safeMeetupSpot}. Handover successful!`);

    addSystemMessage(id, completionText);

    const nowIso = new Date().toISOString();
    await updateAgreementStatus(
      id,
      'completed',
      isViewerSeller ? { sellerConfirmedAt: nowIso } : { buyerConfirmedAt: nowIso }
    );

    // Release escrow if active escrow order exists
    if (activeOrderId && (activeEscrowStatus === 'in_escrow' || activeEscrowStatus === 'held_in_escrow') && item?.price) {
      const sellerId = item.sellerId || matchedConv?.sellerId || 'user_active_student';
      releaseEscrowToSeller(activeOrderId, sellerId, item.price, itemDisplayName).catch(() => {});
    }

    // Update listing state to sold/claimed/swapped in marketplace and profile stores
    setItemStatus(id, 'sold');

    setTimeout(() => {
      scrollToBottom(true);
    }, 50);

    // Prompt peer rating pop-up only if the active student has not yet rated
    if (!hasRatedPeer) {
      setTimeout(() => {
        openRatingModal();
      }, 380);
    }
  };

  const handleSubmitRating = async () => {
    if (selectedStars === 0) return;

    const wasAlreadyRated = hasRatedPeer;
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

    const reviewSummary = wasAlreadyRated
      ? `⭐ You updated your rating for ${counterpartRoleLabel.toLowerCase()} ${counterpartDisplayName} to ${starIcons} (${label})${tagsNote}${commentNote}. Verified review updated!`
      : `⭐ You rated ${counterpartRoleLabel.toLowerCase()} ${counterpartDisplayName} ${starIcons} (${label})${tagsNote}${commentNote}. Verified peer review recorded!`;

    addSystemMessage(id, reviewSummary);
    await submitPeerRating(
      id,
      !isViewerSeller,
      selectedStars,
      selectedRatingTags,
      ratingComment.trim() || undefined
    );

    setTimeout(() => {
      scrollToBottom(true);
    }, 60);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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

        {counterpartAvatarUri ? (
          <Image
            source={{ uri: counterpartAvatarUri }}
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
              {counterpartInitials}
            </Text>
          </View>
        )}

        <View style={styles.headerTitleGroup}>
          <View style={styles.sellerRow}>
            <Text
              numberOfLines={1}
              style={[styles.sellerName, { color: theme.text }]}>
              {counterpartDisplayName}
            </Text>
            <Ionicons name="checkmark-circle" size={14} color={theme.primary} />
            <View
              style={{
                backgroundColor: isViewerSeller ? theme.surfaceSubtle : theme.primaryLight,
                paddingHorizontal: 6,
                paddingVertical: 1,
                borderRadius: Radius.full,
                borderWidth: 1,
                borderColor: isViewerSeller ? theme.border : theme.primary,
                marginLeft: 4,
              }}>
              <Text
                style={{
                  fontSize: 10,
                  color: isViewerSeller ? theme.textSecondary : theme.primary,
                  fontWeight: '700',
                }}>
                {counterpartRoleLabel}
              </Text>
            </View>
          </View>
          <Text
            numberOfLines={1}
            style={[styles.sellerSubtitle, { color: theme.textSecondary }]}>
            {counterpartSubtitle}
          </Text>
        </View>
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

        {/* Quick action in bar depending on deal type & viewer role */}
        {!isViewerSeller && isBuy && item.price && (
          agreementStatus === 'pending' && matchedConv?.escrowStatus !== 'in_escrow' ? (
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
          ) : (
            <View
              style={[
                styles.actionPillButton,
                {
                  backgroundColor: theme.surfaceSubtle,
                  borderWidth: 1,
                  borderColor: theme.border,
                },
              ]}>
              <Text style={[styles.actionPillButtonText, { color: theme.primary, fontWeight: '700' }]}>
                {activeEscrowStatus === 'cod_pending' ? 'COD Pending' : 'Escrow Secured'}
              </Text>
            </View>
          )
        )}

        {isViewerSeller && isBuy && (
          <View
            style={[
              styles.actionPillButton,
              {
                backgroundColor: theme.surfaceSubtle,
                borderWidth: 1,
                borderColor: theme.border,
              },
            ]}>
            <Text style={[styles.actionPillButtonText, { color: theme.textSecondary }]}>Your Item</Text>
          </View>
        )}

        {isSwap && agreementStatus === 'pending' && (
          isViewerSeller ? (
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
          ) : (
            <View
              style={[
                styles.actionPillButton,
                {
                  backgroundColor: theme.surfaceSubtle,
                  borderWidth: 1,
                  borderColor: theme.border,
                },
              ]}>
              <Text style={[styles.actionPillButtonText, { color: theme.textSecondary }]}>
                Swap Proposed
              </Text>
            </View>
          )
        )}

        {isFree && agreementStatus === 'pending' && (
          isViewerSeller ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Confirm freebie reservation"
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
          ) : (
            <View
              style={[
                styles.actionPillButton,
                {
                  backgroundColor: theme.surfaceSubtle,
                  borderWidth: 1,
                  borderColor: theme.border,
                },
              ]}>
              <Text style={[styles.actionPillButtonText, { color: theme.textSecondary }]}>
                Freebie Requested
              </Text>
            </View>
          )
        )}

        {agreementStatus === 'accepted' && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isViewerSeller ? 'Confirm item handover' : 'Confirm item retrieval'}
            style={({ pressed }) => [
              styles.actionPillButton,
              {
                backgroundColor: theme.primary,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
            onPress={handleCompleteAgreement}>
            <Text style={styles.actionPillButtonText}>
              {isViewerSeller ? 'Confirm Handover' : 'Confirm Retrieval'}
            </Text>
          </Pressable>
        )}

        {agreementStatus === 'completed' && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Rate ${counterpartRoleLabel.toLowerCase()} 1 to 5 stars`}
            style={({ pressed }) => [
              styles.actionPillButton,
              {
                backgroundColor: hasRatedPeer ? theme.surfaceSubtle : '#FEF3C7',
                borderWidth: 1,
                borderColor: '#F59E0B',
                opacity: pressed ? 0.85 : 1,
              },
            ]}
            onPress={openRatingModal}>
            <Text
              style={[
                styles.actionPillButtonText,
                { color: hasRatedPeer ? theme.text : '#92400E' },
              ]}>
              {hasRatedPeer ? `★ ${peerRatingScore}/5` : `Rate ${counterpartRoleLabel}`}
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
          <>
            {isTyping && (
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
                    {counterpartDisplayName} is typing...
                  </Text>
                </View>
              </View>
            )}
            <View style={{ height: 36 }} />
          </>
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
                      ? (isViewerSeller ? 'Handover Completed' : 'Item Retrieved')
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
                    <View style={styles.exchangeItemRow}>
                      <Text style={[styles.detailValue, { color: theme.text }]}>
                        {exchangeItemName}
                      </Text>
                      {agreementStatus === 'pending' && !isViewerSeller && (
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel="Change offered trade item"
                          hitSlop={8}
                          onPress={() => {
                            setEditTradeItemInput(exchangeItemName);
                            setIsEditingTradeItem(true);
                          }}
                          style={styles.changeTradeBtn}>
                          <Ionicons name="pencil" size={13} color={theme.primary} />
                          <Text style={[styles.changeTradeBtnText, { color: theme.primary }]}>
                            Edit
                          </Text>
                        </Pressable>
                      )}
                    </View>
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
                      {activeReferenceCode
                        ? `PASS #${activeReferenceCode}`
                        : isSwap
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
                  {isViewerSeller ? (
                    <>
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
                        Accepting reserves your item and issues a campus
                        handover pass for your meetup with {counterpartDisplayName}.
                      </Text>
                    </>
                  ) : (
                    <View style={styles.confirmedNoticeRow}>
                      <Ionicons
                        name="time-outline"
                        size={18}
                        color={theme.primary}
                      />
                      <Text
                        style={[
                          styles.confirmedNoticeText,
                          { color: theme.textSecondary },
                        ]}>
                        {isSwap
                          ? `Swap proposal sent to ${counterpartDisplayName}. Waiting for the seller to review and accept.`
                          : isFree
                          ? `Freebie request sent to ${counterpartDisplayName}. Waiting for seller confirmation.`
                          : `Meetup arrangement sent to ${counterpartDisplayName}. Waiting for confirmation.`}
                      </Text>
                    </View>
                  )}
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
                      {isViewerSeller
                        ? `Meet ${counterpartDisplayName} at ${item.safeMeetupSpot}. Hand over the item, then tap below to confirm handover.`
                        : `Meet ${counterpartDisplayName} at ${item.safeMeetupSpot}. Once retrieved and inspected, tap below to confirm retrieval.`}
                    </Text>
                  </View>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={
                      isViewerSeller
                        ? `Confirm item handover to ${counterpartDisplayName}`
                        : `Confirm item retrieval from ${counterpartDisplayName}`
                    }
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
                      {isViewerSeller ? 'Confirm Item Handover' : 'Confirm Item Retrieval'}
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
                      {isViewerSeller
                        ? `Handover completed on campus! Item handed over to ${counterpartDisplayName}.`
                        : `Retrieval completed on campus! Item retrieved from ${counterpartDisplayName}.`}
                    </Text>
                  </View>

                  {/* Rating summary or call to rate */}
                  {hasRatedPeer && peerRatingScore ? (
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
                                s <= peerRatingScore
                                  ? 'star'
                                  : 'star-outline'
                              }
                              size={14}
                              color={
                                s <= peerRatingScore
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
                          {peerRatingScore}/5 Stars
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.ratedFeedbackText,
                          { color: theme.textSecondary },
                        ]}>
                        You rated {counterpartRoleLabel.toLowerCase()} {counterpartDisplayName} · Verified Peer Review
                      </Text>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Update rating for ${counterpartDisplayName}`}
                        onPress={openRatingModal}
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
                      accessibilityLabel={`Rate ${counterpartDisplayName} 1 to 5 stars`}
                      style={({ pressed }) => [
                        styles.rateSellerPromptBtn,
                        {
                          backgroundColor: '#FEF3C7',
                          borderColor: '#F59E0B',
                          opacity: pressed ? 0.85 : 1,
                        },
                      ]}
                      onPress={openRatingModal}>
                      <Ionicons name="star" size={16} color="#D97706" />
                      <Text style={styles.rateSellerPromptText}>
                        Rate {counterpartRoleLabel} ({counterpartDisplayName}) · 1–5 Stars
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

          const isMe = isViewerSeller
            ? msg.sender === 'seller'
            : (msg.sender === 'me' || msg.sender === 'buyer');
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
                : `Message ${counterpartDisplayName}...`
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
            disabled={(!inputMessage.trim() && !pendingImageUri) || isUploadingPhoto}
            style={({ pressed }) => [
              styles.sendButton,
              {
                backgroundColor:
                  (inputMessage.trim() || pendingImageUri) && !isUploadingPhoto
                    ? theme.primary
                    : theme.surfaceSubtle,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
            onPress={handleSendMessage}>
            {isUploadingPhoto ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons
                name="send"
                size={17}
                color={
                  inputMessage.trim() || pendingImageUri
                    ? '#FFFFFF'
                    : theme.textMuted
                }
              />
            )}
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
                {hasRatedPeer ? 'Update Your Rating' : `Rate Your ${counterpartRoleLabel}`}
              </Text>
              <Text
                style={[
                  styles.ratingSubtitle,
                  { color: theme.textSecondary },
                ]}>
                {isViewerSeller
                  ? `How was your handover experience with ${counterpartDisplayName}?`
                  : `How was your item retrieval with ${counterpartDisplayName}?`}
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
              accessibilityLabel={`Optional ${counterpartRoleLabel.toLowerCase()} review note`}
              placeholder={`Leave an optional note for ${counterpartDisplayName}...`}
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
                accessibilityLabel={`Submit rating for ${counterpartDisplayName}`}
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
                    : hasRatedPeer
                    ? `Update Rating (${selectedStars}/5)`
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

      {/* Edit Trade Offer Modal */}
      <Modal
        visible={isEditingTradeItem}
        transparent
        animationType="fade"
        onRequestClose={() => setIsEditingTradeItem(false)}>
        <Pressable
          style={styles.ratingOverlay}
          onPress={() => setIsEditingTradeItem(false)}>
          <Pressable
            style={[
              styles.editTradeCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
            onPress={(e) => e.stopPropagation()}>
            <View style={styles.editTradeHeader}>
              <View
                style={[
                  styles.editTradeIconBox,
                  { backgroundColor: theme.surfaceSubtle },
                ]}>
                <Ionicons name="repeat" size={20} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.editTradeTitle, { color: theme.text }]}>
                  Your Trade Offer
                </Text>
                <Text style={[styles.editTradeSubtitle, { color: theme.textSecondary }]}>
                  Specify the gear you are offering to swap
                </Text>
              </View>
            </View>

            <TextInput
              accessibilityLabel="Edit trade item input"
              placeholder="e.g. Casio fx-991EX Calculator, Desk Study Lamp"
              placeholderTextColor={theme.textMuted}
              value={editTradeItemInput}
              onChangeText={setEditTradeItemInput}
              style={[
                styles.editTradeTextInput,
                {
                  backgroundColor: theme.surfaceSubtle,
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
              autoFocus
            />

            <View style={styles.editTradeActionsRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cancel editing trade item"
                style={[styles.editTradeCancelBtn, { borderColor: theme.border }]}
                onPress={() => setIsEditingTradeItem(false)}>
                <Text style={[styles.editTradeCancelText, { color: theme.text }]}>
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Save updated trade offer"
                disabled={!editTradeItemInput.trim()}
                style={[
                  styles.editTradeSaveBtn,
                  {
                    backgroundColor: editTradeItemInput.trim() ? theme.primary : theme.surfaceSubtle,
                  },
                ]}
                onPress={() => {
                  const updated = editTradeItemInput.trim();
                  if (updated) {
                    setExchangeItemName(updated);
                    setIsEditingTradeItem(false);
                    addSystemMessage(
                      id,
                      `🔄 Updated trade offer: Student proposed to trade "${updated}" for "${itemDisplayName}".`
                    );
                  }
                }}>
                <Text
                  style={[
                    styles.editTradeSaveText,
                    { color: editTradeItemInput.trim() ? '#FFFFFF' : theme.textMuted },
                  ]}>
                  Update Offer
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
  exchangeItemRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
  },
  changeTradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  changeTradeBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  editTradeCard: {
    width: '90%',
    maxWidth: 400,
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  editTradeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  editTradeIconBox: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editTradeTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  editTradeSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  editTradeTextInput: {
    height: 46,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    fontSize: 14,
  },
  editTradeActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  editTradeCancelBtn: {
    height: 40,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editTradeCancelText: {
    fontSize: 13,
    fontWeight: '600',
  },
  editTradeSaveBtn: {
    height: 40,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editTradeSaveText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
