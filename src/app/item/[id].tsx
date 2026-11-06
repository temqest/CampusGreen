import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useItems } from '@/context/items-context';
import { useBasket } from '@/context/basket-context';
import { useChat } from '@/context/chat-context';
import { ItemPhoto } from '@/types/item';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_HEIGHT = Math.round(Math.min(SCREEN_WIDTH * 1.05, 420));

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { items } = useItems();
  const { addToBasket, removeFromBasket, isInBasket } = useBasket();
  const { ensureConversation } = useChat();

  const item = items.find((i) => i.id === id) || items[0];
  const inBasket = item ? isInBasket(item.id) : false;

  const [currentUserId, setCurrentUserId] = useState('');
  const [currentUserName, setCurrentUserName] = useState('');
  const [currentUserFullName, setCurrentUserFullName] = useState('');
  const [swapModalVisible, setSwapModalVisible] = useState(false);
  const [offeredTradeItem, setOfferedTradeItem] = useState('');

  useEffect(() => {
    AsyncStorage.getItem('@uniswap_user_profile').then(async (str) => {
      if (!str) {
        str = await AsyncStorage.getItem('@campusgreen_user_profile');
      }
      if (str) {
        try {
          const parsed = JSON.parse(str);
          if (parsed.id) setCurrentUserId(parsed.id);
          if (parsed.fullName) {
            setCurrentUserName(parsed.fullName.trim().toLowerCase());
            setCurrentUserFullName(parsed.fullName.trim());
          }
        } catch {}
      }
    });
  }, []);

  const isOwner = Boolean(
    (currentUserId && item?.sellerId && item.sellerId === currentUserId) ||
    (currentUserName && item?.sellerName && item.sellerName.trim().toLowerCase() === currentUserName)
  );
  const photos: ItemPhoto[] =
    item.photos && item.photos.length > 0
      ? item.photos
      : [
          {
            id: 'p1',
            label: 'Main View',
            iconName: 'cube-outline',
            uri: item.imageUrl,
          },
        ];

  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const carouselRef = useRef<FlatList<ItemPhoto>>(null);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out "${item.title}" on UniSwap! Available at ${item.campus}.`,
      });
    } catch {
      // User dismissed share dialog
    }
  };

  const handleCarouselScroll = (
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    if (index >= 0 && index < photos.length) {
      setActivePhotoIndex(index);
    }
  };

  const scrollToPhoto = (index: number) => {
    setActivePhotoIndex(index);
    carouselRef.current?.scrollToIndex({
      index,
      animated: true,
    });
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      {/* Scrollable Product Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 84 },
        ]}>
        {/* Swipeable Multi-Photo Hero Carousel */}
        <View
          style={[
            styles.carouselWrapper,
            {
              backgroundColor: '#FFFFFF',
              borderBottomColor: theme.borderSubtle,
            },
          ]}>
          <FlatList
            ref={carouselRef}
            data={photos}
            keyExtractor={(p) => p.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleCarouselScroll}
            renderItem={({ item: photo, index }) => (
              <View
                style={[
                  styles.heroSlide,
                  {
                    width: SCREEN_WIDTH,
                    height: HERO_HEIGHT,
                    backgroundColor: '#FFFFFF',
                  },
                ]}>
                {photo.uri ? (
                  <View
                    style={[
                      styles.heroImageFrame,
                      {
                        paddingTop: insets.top + 48,
                        paddingBottom: 46,
                      },
                    ]}>
                    <Image
                      source={{ uri: photo.uri }}
                      style={styles.heroImage}
                      contentFit="contain"
                      transition={200}
                    />
                  </View>
                ) : (
                  /* Background Concentric Vector Circles */
                  <View style={styles.concentricOuter}>
                    <View style={styles.concentricInner}>
                      <Ionicons
                        name={photo.iconName || 'cube-outline'}
                        size={64}
                        color={theme.primary}
                        style={styles.categoryIcon}
                      />
                    </View>
                  </View>
                )}

                {/* Photo Angle Tag in slide */}
                <View style={styles.photoAngleLabel}>
                  <Text style={styles.photoAngleText}>
                    {photo.label}
                  </Text>
                </View>
              </View>
            )}
          />

          {/* Top-Left Sleek Urgent Badge on Hero */}
          {item.isUrgent && (
            <View
              style={[
                styles.heroUrgentBadge,
                { top: insets.top + (Platform.OS === 'ios' ? 54 : 58) },
              ]}>
              <Ionicons name="flash" size={11} color="#FFFFFF" />
              <Text style={styles.heroUrgentText}>URGENT</Text>
            </View>
          )}

          {/* Floating Deal / Price Tag at bottom right of the hero */}
          <View style={styles.heroDealTagContainer}>
            {item.tradeType === 'buy' && (
              <View
                style={[
                  styles.heroDealBadge,
                  { backgroundColor: theme.primary },
                ]}>
                <Text style={styles.heroDealPriceText}>₱{item.price}</Text>
              </View>
            )}
            {item.tradeType === 'swap' && (
              <View
                style={[
                  styles.heroDealBadge,
                  { backgroundColor: theme.blue },
                ]}>
                <Text style={styles.heroDealText}>Swap Zone</Text>
              </View>
            )}
            {item.tradeType === 'free' && (
              <View
                style={[
                  styles.heroDealBadge,
                  { backgroundColor: theme.gold },
                ]}>
                <Text style={styles.heroDealText}>Freebie</Text>
              </View>
            )}
          </View>

          {/* Pagination Dots at bottom center */}
          {photos.length > 1 && (
            <View style={styles.paginationRow}>
              {photos.map((_, i) => (
                <View
                  key={`dot-${i}`}
                  style={[
                    styles.paginationDot,
                    i === activePhotoIndex
                      ? [
                          styles.paginationDotActive,
                          { backgroundColor: theme.primary },
                        ]
                      : [
                          styles.paginationDotInactive,
                          { backgroundColor: 'rgba(0, 0, 0, 0.2)' },
                        ],
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        {/* Item Details Body */}
        <View style={styles.body}>
          {/* Academic Context & Campus */}
          <View style={styles.academicRow}>
            {item.courseTag ? (
              <Text style={[styles.courseTag, { color: theme.primary }]}>
                {item.courseTag} {item.yearLevel ? `• ${item.yearLevel}` : ''}
              </Text>
            ) : null}
            <Text style={[styles.campusText, { color: theme.textSecondary }]}>
              {item.campus}
            </Text>
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: theme.text }]}>
            {item.title}
          </Text>

          {/* Price & Urgent Status Row */}
          <View style={styles.priceAndStatusRow}>
            <Text style={[styles.mainPriceText, { color: theme.primary }]}>
              {item.tradeType === 'buy'
                ? `₱${item.price}`
                : item.tradeType === 'swap'
                ? 'Swap Zone'
                : 'Freebie'}
            </Text>
            {item.isUrgent && (
              <View
                style={[
                  styles.bodyUrgentBadge,
                  { backgroundColor: '#FEE2E2', borderColor: '#FECACA' },
                ]}>
                <Ionicons name="flash" size={11} color="#DC2626" />
                <Text style={styles.bodyUrgentText}>URGENT SELLING</Text>
              </View>
            )}
            {item.status === 'sold' && (
              <View
                style={[
                  styles.bodyUrgentBadge,
                  { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' },
                ]}>
                <Ionicons name="checkmark-done" size={11} color={theme.textSecondary} />
                <Text style={[styles.bodyUrgentText, { color: theme.textSecondary }]}>
                  {item.tradeType === 'free' ? 'CLAIMED' : item.tradeType === 'swap' ? 'SWAPPED' : 'SOLD'}
                </Text>
              </View>
            )}
            {item.status !== 'sold' && (item.isReserved || item.status === 'reserved') && (
              <View
                style={[
                  styles.bodyUrgentBadge,
                  { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' },
                ]}>
                <Ionicons name="time" size={11} color="#D97706" />
                <Text style={[styles.bodyUrgentText, { color: '#B45309' }]}>RESERVED</Text>
              </View>
            )}
            <View
              style={[
                styles.tradeTypePill,
                { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
              ]}>
              <Text style={[styles.tradeTypePillText, { color: theme.textSecondary }]}>
                {item.tradeType === 'buy'
                  ? 'Verified Purchase'
                  : item.tradeType === 'swap'
                  ? 'Campus Exchange'
                  : 'Student Freebie'}
              </Text>
            </View>
          </View>

          {/* Condition, Category & Post Time */}
          <View style={styles.metaRow}>
            <View style={styles.conditionGroup}>
              <Text style={[styles.metaLabel, { color: theme.textSecondary }]}>
                Condition:
              </Text>
              <Text style={[styles.conditionValue, { color: theme.text }]}>
                {item.condition}
              </Text>
            </View>
            <Text style={[styles.timeText, { color: theme.textMuted }]}>
              Listed {item.createdAt}
            </Text>
          </View>

          {/* Sustainability Impact Strip */}
          <View
            style={[
              styles.greenImpactStrip,
              {
                backgroundColor: theme.surfaceSubtle,
                borderColor: theme.border,
              },
            ]}>
            <View
              style={[
                styles.leafCircle,
                { backgroundColor: theme.surface },
              ]}>
              <Ionicons name="leaf-outline" size={15} color={theme.primary} />
            </View>
            <View style={styles.greenImpactTextGroup}>
              <Text
                style={[
                  styles.greenImpactHeading,
                  { color: theme.text },
                ]}>
                Green Campus Impact
              </Text>
              <Text
                style={[
                  styles.greenImpactSubtext,
                  { color: theme.textSecondary },
                ]}>
                Saves ~{item.estimatedCo2SavedKg} kg CO₂e from new manufacturing
              </Text>
            </View>
          </View>

          {/* Section Divider */}
          <View style={[styles.divider, { backgroundColor: theme.borderSubtle }]} />

          {/* Description Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionHeading, { color: theme.text }]}>
              About this item
            </Text>
            <Text style={[styles.description, { color: theme.textSecondary }]}>
              {item.description}
            </Text>
          </View>

          {/* Section Divider */}
          <View style={[styles.divider, { backgroundColor: theme.borderSubtle }]} />

          {/* Photo Gallery Section (Thumbnails corresponding to swipable photos) */}
          <View style={styles.section}>
            <View style={styles.galleryHeader}>
              <Text style={[styles.sectionHeading, { color: theme.text }]}>
                Photo Gallery
              </Text>
              <Text style={[styles.galleryCount, { color: theme.textSecondary }]}>
                {photos.length} {photos.length === 1 ? 'photo' : 'photos'}
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.galleryScroll}>
              {photos.map((photo, index) => {
                const isActive = index === activePhotoIndex;
                return (
                  <Pressable
                    key={photo.id}
                    accessibilityRole="button"
                    accessibilityLabel={`View ${photo.label}`}
                    style={({ pressed }) => [
                      styles.thumbnailCard,
                      {
                        backgroundColor: theme.surface,
                        borderColor: isActive ? theme.primary : theme.border,
                        borderWidth: isActive ? 2 : 1,
                        opacity: pressed ? 0.75 : 1,
                      },
                    ]}
                    onPress={() => scrollToPhoto(index)}>
                    <View
                      style={[
                        styles.thumbnailIconBox,
                        { backgroundColor: theme.surfaceSubtle },
                      ]}>
                      {photo.uri ? (
                        <Image
                          source={{ uri: photo.uri }}
                          style={StyleSheet.absoluteFill}
                          contentFit="cover"
                          transition={200}
                        />
                      ) : (
                        <Ionicons
                          name={photo.iconName}
                          size={24}
                          color={isActive ? theme.primary : theme.textSecondary}
                        />
                      )}
                    </View>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.thumbnailLabel,
                        {
                          color: isActive ? theme.primary : theme.textSecondary,
                          fontWeight: isActive ? '700' : '500',
                        },
                      ]}>
                      {photo.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Section Divider */}
          <View style={[styles.divider, { backgroundColor: theme.borderSubtle }]} />

          {/* Safe Meetup Spot Card */}
          <View style={styles.section}>
            <Text style={[styles.sectionHeading, { color: theme.text }]}>
              Safe Meetup Location
            </Text>
            <View
              style={[
                styles.meetupCard,
                {
                  backgroundColor: theme.surfaceSubtle,
                  borderColor: theme.border,
                },
              ]}>
              <View
                style={[
                  styles.meetupIconCircle,
                  { backgroundColor: theme.primaryLight },
                ]}>
                <Ionicons name="location" size={18} color={theme.primary} />
              </View>
              <View style={styles.meetupTextGroup}>
                <Text style={[styles.meetupSpotName, { color: theme.text }]}>
                  {item.safeMeetupSpot}
                </Text>
                <Text
                  style={[
                    styles.meetupInstructions,
                    { color: theme.textSecondary },
                  ]}>
                  Designated campus exchange zone • Staffed security area
                </Text>
              </View>
            </View>
          </View>

          {/* Section Divider */}
          <View style={[styles.divider, { backgroundColor: theme.borderSubtle }]} />

          {/* Seller Profile */}
          <View style={styles.section}>
            <Text style={[styles.sectionHeading, { color: theme.text }]}>
              Listed by
            </Text>
            <View
              style={[
                styles.sellerCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}>
              <View
                style={[
                  styles.sellerAvatar,
                  { backgroundColor: theme.primaryLight },
                ]}>
                {item.sellerAvatarUri ? (
                  <Image
                    source={{ uri: item.sellerAvatarUri }}
                    style={styles.sellerAvatarImage}
                    contentFit="cover"
                    transition={200}
                  />
                ) : (
                  <Ionicons name="person" size={20} color={theme.primary} />
                )}
              </View>
              <View style={styles.sellerInfo}>
                <View style={styles.sellerNameRow}>
                  <Text style={[styles.sellerName, { color: theme.text }]}>
                    {item.sellerName}
                  </Text>
                  {item.isVerifiedStudent && (
                    <Ionicons
                      name="checkmark-circle"
                      size={15}
                      color={theme.primary}
                    />
                  )}
                </View>
                <Text
                  style={[styles.sellerYear, { color: theme.textSecondary }]}>
                  {item.sellerYear} • Verified Student
                </Text>
              </View>
              <View style={styles.sellerRatingBadge}>
                <Ionicons name="star" size={13} color="#D97706" />
                <Text style={[styles.sellerRatingText, { color: theme.text }]}>
                  {item.sellerRating.toFixed(1)}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Floating Header Bar (Back button & Share button) */}
      <View
        style={[
          styles.floatingTopBar,
          {
            top: insets.top + (Platform.OS === 'ios' ? 4 : 8),
          },
        ]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={({ pressed }) => [
            styles.floatingIconButton,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              opacity: pressed ? 0.75 : 1,
            },
          ]}
          onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={theme.text} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Share item"
          style={({ pressed }) => [
            styles.floatingIconButton,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              opacity: pressed ? 0.75 : 1,
            },
          ]}
          onPress={handleShare}>
          <Ionicons name="share-outline" size={20} color={theme.text} />
        </Pressable>
      </View>

      {/* Pinned Bottom Action Dock in Thumb Zone */}
      <View
        style={[
          styles.bottomDock,
          {
            backgroundColor: theme.surface,
            borderTopColor: theme.border,
            paddingBottom: Math.max(insets.bottom, 12),
          },
        ]}>
        {isOwner ? (
          <View
            style={[
              styles.ownerBannerContainer,
              {
                backgroundColor: theme.surfaceSubtle,
                borderColor: theme.border,
              },
            ]}>
            <View style={styles.ownerBannerIconBox}>
              <Ionicons name="person-circle-outline" size={22} color={theme.primary} />
            </View>
            <View style={styles.ownerBannerTextBox}>
              <Text style={[styles.ownerBannerTitle, { color: theme.text }]}>
                Your Listing
              </Text>
              <Text style={[styles.ownerBannerSubtitle, { color: theme.textSecondary }]}>
                You listed this item. Manage it or see status in your Profile tab.
              </Text>
            </View>
          </View>
        ) : item.status === 'sold' ? (
          <View style={styles.dockRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Chat with seller"
              style={({ pressed }) => [
                styles.chatSecondaryButton,
                {
                  backgroundColor: theme.surfaceSubtle,
                  borderColor: theme.border,
                  opacity: pressed ? 0.75 : 1,
                },
              ]}
              onPress={() => {
                const conv = ensureConversation(item);
                router.push({
                  pathname: '/chat/[id]',
                  params: {
                    id: item.id,
                    conversationId: conv.id,
                    sellerName: item.sellerName,
                    sellerAvatarUri: item.sellerAvatarUri || undefined,
                    buyerName: currentUserFullName || undefined,
                    isSeller: 'false',
                  },
                });
              }}>
              <Ionicons
                name="chatbubbles-outline"
                size={20}
                color={theme.text}
              />
            </Pressable>

            <View
              style={[
                styles.primaryCta,
                styles.primaryCtaFlex,
                {
                  backgroundColor: theme.surfaceSubtle,
                  borderColor: theme.border,
                  borderWidth: 1,
                },
              ]}>
              <Ionicons name="checkmark-done-circle" size={18} color={theme.textSecondary} />
              <Text style={[styles.primaryCtaText, { color: theme.textSecondary }]}>
                {item.tradeType === 'free'
                  ? 'Item Claimed on Campus'
                  : item.tradeType === 'swap'
                  ? 'Item Swapped on Campus'
                  : 'Item Sold on Campus'}
              </Text>
            </View>
          </View>
        ) : item.tradeType === 'buy' && item.price !== null && item.price > 0 ? (
          <View style={styles.dockRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={inBasket ? 'Remove from basket' : 'Add to basket'}
              style={({ pressed }) => [
                styles.chatSecondaryButton,
                {
                  backgroundColor: inBasket ? theme.badgeGreenBg : theme.surfaceSubtle,
                  borderColor: inBasket ? theme.primary : theme.border,
                  opacity: pressed ? 0.75 : 1,
                },
              ]}
              onPress={async () => {
                if (inBasket) {
                  await removeFromBasket(item.id);
                } else {
                  await addToBasket(item);
                  ensureConversation(item);
                }
              }}>
              <Ionicons
                name={inBasket ? 'basket' : 'basket-outline'}
                size={20}
                color={inBasket ? theme.primary : theme.text}
              />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Chat with seller"
              style={({ pressed }) => [
                styles.chatSecondaryButton,
                {
                  backgroundColor: theme.surfaceSubtle,
                  borderColor: theme.border,
                  opacity: pressed ? 0.75 : 1,
                },
              ]}
              onPress={() => {
                const conv = ensureConversation(item);
                router.push({
                  pathname: '/chat/[id]',
                  params: {
                    id: item.id,
                    conversationId: conv.id,
                    sellerName: item.sellerName,
                    sellerAvatarUri: item.sellerAvatarUri || undefined,
                    buyerName: currentUserFullName || undefined,
                    isSeller: 'false',
                  },
                });
              }}>
              <Ionicons
                name="chatbubbles-outline"
                size={20}
                color={theme.text}
              />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Pay now ₱${item.price}`}
              style={({ pressed }) => [
                styles.primaryCta,
                styles.primaryCtaFlex,
                {
                  backgroundColor: theme.primary,
                  opacity: pressed ? 0.88 : 1,
                },
              ]}
              onPress={() => {
                ensureConversation(item);
                router.push({
                  pathname: '/payment/[id]',
                  params: { id: item.id },
                });
              }}>
              <Ionicons name="card-outline" size={18} color="#FFFFFF" />
              <Text style={styles.primaryCtaText}>
                Pay Now • ₱{item.price}
              </Text>
            </Pressable>
          </View>
        ) : item.tradeType === 'swap' ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Propose swap trade"
            style={({ pressed }) => [
              styles.primaryCta,
              {
                backgroundColor: theme.primary,
                opacity: pressed ? 0.88 : 1,
              },
            ]}
            onPress={() => setSwapModalVisible(true)}>
            <Ionicons name="repeat" size={18} color="#FFFFFF" />
            <Text style={styles.primaryCtaText}>Propose Swap Trade</Text>
          </Pressable>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Request freebie"
            style={({ pressed }) => [
              styles.primaryCta,
              {
                backgroundColor: theme.primary,
                opacity: pressed ? 0.88 : 1,
              },
            ]}
            onPress={() => {
              const conv = ensureConversation(item);
              router.push({
                pathname: '/chat/[id]',
                params: {
                  id: item.id,
                  conversationId: conv.id,
                  sellerName: item.sellerName,
                  sellerAvatarUri: item.sellerAvatarUri || undefined,
                  buyerName: currentUserFullName || undefined,
                  isSeller: 'false',
                },
              });
            }}>
            <Ionicons name="chatbubbles-outline" size={18} color="#FFFFFF" />
            <Text style={styles.primaryCtaText}>Request Freebie</Text>
          </Pressable>
        )}
      </View>

      {/* Swap Proposal Modal (Requester specifies what to trade) */}
      <Modal
        visible={swapModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSwapModalVisible(false)}>
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setSwapModalVisible(false)}>
          <Pressable
            style={[
              styles.swapModalSheet,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                paddingBottom: Math.max(insets.bottom, 20),
              },
            ]}
            onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeaderRow}>
              <View style={styles.modalTitleGroup}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  Propose Swap Trade
                </Text>
                <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
                  Offer gear in exchange for &quot;{item.title}&quot;
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close swap proposal"
                onPress={() => setSwapModalVisible(false)}
                hitSlop={8}
                style={[styles.closeIconBtn, { backgroundColor: theme.surfaceSubtle }]}>
                <Ionicons name="close" size={20} color={theme.textSecondary} />
              </Pressable>
            </View>

            <View style={styles.swapInputSection}>
              <Text style={[styles.inputSectionLabel, { color: theme.text }]}>
                What item are you offering to trade?
              </Text>
              <TextInput
                accessibilityLabel="Item you are offering in trade"
                placeholder="e.g. Casio fx-991EX Calculator, Study Lamp, Lab Coat"
                placeholderTextColor={theme.textMuted}
                value={offeredTradeItem}
                onChangeText={setOfferedTradeItem}
                style={[
                  styles.swapTextInput,
                  {
                    backgroundColor: theme.surfaceSubtle,
                    borderColor: theme.border,
                    color: theme.text,
                  },
                ]}
              />

              <View
                style={[
                  styles.swapPromptBox,
                  {
                    backgroundColor: theme.blueBg,
                    borderColor: theme.borderSubtle,
                  },
                ]}>
                <Ionicons name="information-circle-outline" size={18} color={theme.blue} />
                <Text style={[styles.swapPromptText, { color: theme.blue }]}>
                  Your offered item will be sent to {item.sellerName} and displayed in the campus handover pass.
                </Text>
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Confirm and send trade offer"
              disabled={!offeredTradeItem.trim()}
              style={({ pressed }) => [
                styles.confirmTradeBtn,
                {
                  backgroundColor: offeredTradeItem.trim() ? theme.primary : theme.surfaceSubtle,
                  opacity: pressed ? 0.88 : 1,
                },
              ]}
              onPress={() => {
                const offered = offeredTradeItem.trim();
                const conv = ensureConversation(item);
                setSwapModalVisible(false);
                setOfferedTradeItem('');
                router.push({
                  pathname: '/chat/[id]',
                  params: {
                    id: item.id,
                    conversationId: conv.id,
                    sellerName: item.sellerName,
                    sellerAvatarUri: item.sellerAvatarUri || undefined,
                    offeredItem: offered,
                    buyerName: currentUserFullName || undefined,
                    isSeller: 'false',
                  },
                });
              }}>
              <Ionicons
                name="repeat"
                size={18}
                color={offeredTradeItem.trim() ? '#FFFFFF' : theme.textMuted}
              />
              <Text
                style={[
                  styles.confirmTradeBtnText,
                  { color: offeredTradeItem.trim() ? '#FFFFFF' : theme.textMuted },
                ]}>
                Send Trade Proposal
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  floatingTopBar: {
    position: 'absolute',
    left: Spacing.four,
    right: Spacing.four,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  floatingIconButton: {
    width: 42,
    height: 42,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  carouselWrapper: {
    position: 'relative',
    height: HERO_HEIGHT,
    borderBottomWidth: 1,
  },
  heroSlide: {
    height: HERO_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  heroImageFrame: {
    width: '100%',
    height: '100%',
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  concentricOuter: {
    width: 150,
    height: 150,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(31, 92, 58, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  concentricInner: {
    width: 100,
    height: 100,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(31, 92, 58, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryIcon: {
    opacity: 0.9,
  },
  photoAngleLabel: {
    position: 'absolute',
    bottom: 14,
    left: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    zIndex: 5,
  },
  photoAngleText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  heroUrgentBadge: {
    position: 'absolute',
    left: Spacing.four,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: Radius.full,
    gap: 3,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  heroUrgentText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  heroDealTagContainer: {
    position: 'absolute',
    bottom: 14,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 5,
  },
  heroDealBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.full,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  heroDealPriceText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  heroDealText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  paginationRow: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    zIndex: 5,
  },
  paginationDot: {
    height: 6,
    borderRadius: Radius.full,
  },
  paginationDotActive: {
    width: 18,
  },
  paginationDotInactive: {
    width: 6,
  },
  body: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
  },
  academicRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  courseTag: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  campusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 26,
    marginBottom: 6,
  },
  priceAndStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.three,
  },
  mainPriceText: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  bodyUrgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  bodyUrgentText: {
    color: '#DC2626',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  tradeTypePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  tradeTypePillText: {
    fontSize: 10,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  conditionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaLabel: {
    fontSize: 13,
  },
  conditionValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  timeText: {
    fontSize: 12,
  },
  greenImpactStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: Spacing.two + 2,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginBottom: Spacing.four,
  },
  leafCircle: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greenImpactTextGroup: {
    flex: 1,
    gap: 1,
  },
  greenImpactHeading: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  greenImpactSubtext: {
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    width: '100%',
    marginVertical: Spacing.three,
  },
  section: {
    gap: Spacing.two,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
  },
  galleryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  galleryCount: {
    fontSize: 12,
    fontWeight: '500',
  },
  galleryScroll: {
    gap: 10,
    paddingVertical: 2,
  },
  thumbnailCard: {
    width: 96,
    borderRadius: Radius.md,
    padding: 8,
    alignItems: 'center',
    gap: 6,
  },
  thumbnailIconBox: {
    width: 52,
    height: 52,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailLabel: {
    fontSize: 10,
    textAlign: 'center',
    width: '100%',
  },
  meetupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  meetupIconCircle: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meetupTextGroup: {
    flex: 1,
    gap: 2,
  },
  meetupSpotName: {
    fontSize: 14,
    fontWeight: '700',
  },
  meetupInstructions: {
    fontSize: 11,
    lineHeight: 15,
  },
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  sellerAvatar: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  sellerAvatarImage: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
  },
  sellerInfo: {
    flex: 1,
    gap: 2,
  },
  sellerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sellerName: {
    fontSize: 14,
    fontWeight: '700',
  },
  sellerYear: {
    fontSize: 12,
  },
  sellerRatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(217, 119, 6, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  sellerRatingText: {
    fontSize: 12,
    fontWeight: '700',
  },
  bottomDock: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
  },
  ownerBannerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.three,
  },
  ownerBannerIconBox: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownerBannerTextBox: {
    flex: 1,
  },
  ownerBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  ownerBannerSubtitle: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  primaryCta: {
    height: 48,
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryCtaText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  dockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  chatSecondaryButton: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryCtaFlex: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  swapModalSheet: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    borderWidth: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: Radius.full,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginBottom: Spacing.three,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.three,
  },
  modalTitleGroup: {
    flex: 1,
    paddingRight: Spacing.two,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  closeIconBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swapInputSection: {
    marginBottom: Spacing.four,
  },
  inputSectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: Spacing.two,
  },
  swapTextInput: {
    height: 48,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    fontSize: 14,
    marginBottom: Spacing.three,
  },
  swapPromptBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: Spacing.two,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  swapPromptText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  confirmTradeBtn: {
    height: 48,
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  confirmTradeBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
