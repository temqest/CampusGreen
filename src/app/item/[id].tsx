import React, { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { MOCK_ITEMS } from '@/data/mock-items';
import { ItemPhoto } from '@/types/item';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const item = MOCK_ITEMS.find((i) => i.id === id) || MOCK_ITEMS[0];
  const photos: ItemPhoto[] =
    item.photos && item.photos.length > 0
      ? item.photos
      : [
          {
            id: 'p1',
            label: 'Main View',
            iconName: 'cube-outline',
          },
        ];

  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const carouselRef = useRef<FlatList<ItemPhoto>>(null);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out "${item.title}" on CampusGreen Connect! Available at ${item.campus}.`,
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
        <View style={styles.carouselWrapper}>
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
                    backgroundColor: theme.surfaceSubtle,
                  },
                ]}>
                {/* Background Concentric Vector Circles */}
                <View style={styles.concentricOuter}>
                  <View style={styles.concentricInner}>
                    <Ionicons
                      name={photo.iconName}
                      size={64}
                      color={theme.primary}
                      style={styles.categoryIcon}
                    />
                  </View>
                </View>

                {/* Photo Angle Tag in slide */}
                <View style={styles.photoAngleLabel}>
                  <Text style={styles.photoAngleText}>
                    {photo.label}
                  </Text>
                </View>
              </View>
            )}
          />

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
                      <Ionicons
                        name={photo.iconName}
                        size={24}
                        color={isActive ? theme.primary : theme.textSecondary}
                      />
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
                <Ionicons name="person" size={20} color={theme.primary} />
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
        {item.tradeType === 'buy' && item.price !== null && item.price > 0 ? (
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
              onPress={() =>
                router.push({
                  pathname: '/chat/[id]',
                  params: { id: item.id },
                })
              }>
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
              onPress={() =>
                router.push({
                  pathname: '/payment/[id]',
                  params: { id: item.id },
                })
              }>
              <Ionicons name="card-outline" size={18} color="#FFFFFF" />
              <Text style={styles.primaryCtaText}>
                Pay Now • ₱{item.price}
              </Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              item.tradeType === 'swap' ? 'Propose swap trade' : 'Request freebie'
            }
            style={({ pressed }) => [
              styles.primaryCta,
              {
                backgroundColor: theme.primary,
                opacity: pressed ? 0.88 : 1,
              },
            ]}
            onPress={() =>
              router.push({
                pathname: '/chat/[id]',
                params: { id: item.id },
              })
            }>
            <Ionicons name="chatbubbles-outline" size={18} color="#FFFFFF" />
            <Text style={styles.primaryCtaText}>
              {item.tradeType === 'swap'
                ? 'Propose Swap Trade'
                : 'Request Freebie'}
            </Text>
          </Pressable>
        )}
      </View>
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
    height: 250,
  },
  heroSlide: {
    height: 250,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
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
    top: 70,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  photoAngleText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  heroDealTagContainer: {
    position: 'absolute',
    bottom: 14,
    right: 16,
    zIndex: 5,
  },
  heroDealBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.full,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  heroDealPriceText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  heroDealText: {
    color: '#FFFFFF',
    fontSize: 13,
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
    marginBottom: Spacing.two + 2,
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
});
