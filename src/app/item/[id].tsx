import React from 'react';
import {
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

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const item = MOCK_ITEMS.find((i) => i.id === id) || MOCK_ITEMS[0];

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out "${item.title}" on CampusGreen Connect! Available at ${item.campus}.`,
      });
    } catch {
      // User dismissed share dialog
    }
  };

  const getCategoryIcon = () => {
    switch (item.category) {
      case 'Textbooks & Reviewers':
        return 'book-outline';
      case 'Uniforms & Scrubs':
        return 'shirt-outline';
      case 'Tools & Lab Gear':
        return 'construct-outline';
      case 'Dorm & Room':
        return 'home-outline';
      case 'Tech & Gadgets':
        return 'hardware-chip-outline';
      default:
        return 'cube-outline';
    }
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
        {/* Edge-to-Edge Hero Image / Motif Area */}
        <View
          style={[
            styles.heroArea,
            { backgroundColor: theme.surfaceSubtle },
          ]}>
          {/* Background Concentric Vector Circles */}
          <View style={styles.concentricOuter}>
            <View style={styles.concentricInner}>
              <Ionicons
                name={getCategoryIcon()}
                size={64}
                color={theme.primary}
                style={styles.categoryIcon}
              />
            </View>
          </View>

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
                backgroundColor: theme.badgeGreenBg,
                borderColor: theme.primaryBorder,
              },
            ]}>
            <View
              style={[
                styles.leafCircle,
                { backgroundColor: theme.surface },
              ]}>
              <Ionicons name="leaf" size={15} color={theme.primary} />
            </View>
            <View style={styles.greenImpactTextGroup}>
              <Text
                style={[
                  styles.greenImpactHeading,
                  { color: theme.primaryDark },
                ]}>
                Green Campus Impact
              </Text>
              <Text
                style={[
                  styles.greenImpactSubtext,
                  { color: theme.primary },
                ]}>
                Saves ~{item.estimatedCo2SavedKg} kg CO₂e from new manufacturing
              </Text>
            </View>
          </View>

          {/* Section Divider */}
          <View style={[styles.divider, { backgroundColor: theme.borderSubtle }]} />

          {/* Description */}
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
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Contact seller"
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
              : item.tradeType === 'free'
              ? 'Request Freebie'
              : 'Chat with Seller'}
          </Text>
        </Pressable>
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
  heroArea: {
    height: 240,
    width: '100%',
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
  heroDealTagContainer: {
    position: 'absolute',
    bottom: 16,
    right: 16,
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
});
