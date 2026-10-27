import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { MarketplaceItem } from '@/types/item';

interface ItemCardProps {
  item: MarketplaceItem;
}

export function ItemCard({ item }: ItemCardProps) {
  const theme = useTheme();
  const router = useRouter();

  const handlePress = () => {
    router.push({
      pathname: '/item/[id]',
      params: { id: item.id },
    });
  };

  const photoUri = item.imageUrl || item.photos?.[0]?.uri;

  // Helper icon for category vector placeholder
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
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.title}, ${
        item.tradeType === 'buy' ? `₱${item.price}` : item.tradeType
      }`}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
      onPress={handlePress}>
      {/* Visual Image Area */}
      <View
        style={[
          styles.imageArea,
          { backgroundColor: theme.surfaceSubtle },
        ]}>
        {photoUri ? (
          <Image
            source={{ uri: photoUri }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={styles.motifBackground}>
            <Ionicons
              name={getCategoryIcon()}
              size={36}
              color={theme.primary}
              style={styles.categoryGlyph}
            />
          </View>
        )}

        {/* Dynamic Actionable State Badge ONLY (Price / Swap / Free) */}
        <View style={styles.badgeTopLeft}>
          {item.tradeType === 'buy' && (
            <View
              style={[
                styles.dealBadge,
                { backgroundColor: theme.badgeGreenBg },
              ]}>
              <Text
                style={[
                  styles.dealBadgeText,
                  { color: theme.badgeGreenText },
                ]}>
                ₱{item.price}
              </Text>
            </View>
          )}

          {item.tradeType === 'swap' && (
            <View
              style={[
                styles.dealBadge,
                { backgroundColor: theme.blueBg },
              ]}>
              <Text style={[styles.dealBadgeText, { color: theme.blue }]}>
                Swap
              </Text>
            </View>
          )}

          {item.tradeType === 'free' && (
            <View
              style={[
                styles.dealBadge,
                { backgroundColor: theme.goldBg },
              ]}>
              <Text style={[styles.dealBadgeText, { color: theme.gold }]}>
                Free
              </Text>
            </View>
          )}
        </View>

        {/* Dynamic Urgent Selling Badge (Goal #6) */}
        {item.isUrgent && (
          <View style={[styles.urgentBadgeTopRight, { backgroundColor: '#DC2626' }]}>
            <Ionicons name="flash" size={10} color="#FFFFFF" style={{ marginRight: 2 }} />
            <Text style={styles.urgentBadgeText}>Urgent</Text>
          </View>
        )}

        {/* Reserved badge if applicable */}
        {item.isReserved && (
          <View style={[styles.reservedOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.6)' }]}>
            <Text style={styles.reservedText}>Reserved</Text>
          </View>
        )}
      </View>

      {/* Card Information */}
      <View style={styles.cardContent}>
        {/* Course / Academic Tag */}
        {item.courseTag ? (
          <Text
            numberOfLines={1}
            style={[styles.courseTag, { color: theme.primary }]}>
            {item.courseTag} {item.yearLevel ? `• ${item.yearLevel}` : ''}
          </Text>
        ) : null}

        {/* Title */}
        <Text
          numberOfLines={2}
          style={[styles.title, { color: theme.text }]}>
          {item.title}
        </Text>

        {/* Condition & Time */}
        <View style={styles.metaRow}>
          <Text style={[styles.conditionText, { color: theme.textSecondary }]}>
            {item.condition}
          </Text>
          <Text style={[styles.timeText, { color: theme.textMuted }]}>
            {item.createdAt}
          </Text>
        </View>

        {/* Safe Meetup Spot Indicator */}
        <View style={styles.meetupRow}>
          <Ionicons
            name="location-outline"
            size={12}
            color={theme.textSecondary}
          />
          <Text
            numberOfLines={1}
            style={[styles.meetupText, { color: theme.textSecondary }]}>
            {item.safeMeetupSpot}
          </Text>
        </View>

        {/* Seller Info & Student Trust */}
        <View style={[styles.sellerRow, { borderTopColor: theme.borderSubtle }]}>
          <Text
            numberOfLines={1}
            style={[styles.sellerName, { color: theme.textSecondary }]}>
            {item.sellerName}
          </Text>
          {item.isVerifiedStudent && (
            <Ionicons
              name="checkmark-circle"
              size={13}
              color={theme.primary}
              style={styles.verifiedIcon}
            />
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    marginHorizontal: Spacing.one,
    marginBottom: Spacing.four,
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  imageArea: {
    height: 118,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  motifBackground: {
    width: 62,
    height: 62,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(31, 92, 58, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryGlyph: {
    opacity: 0.85,
  },
  badgeTopLeft: {
    position: 'absolute',
    top: 8,
    left: 8,
  },
  dealBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  dealBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  urgentBadgeTopRight: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  urgentBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reservedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reservedText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardContent: {
    padding: Spacing.three,
    gap: 5,
  },
  courseTag: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 17,
    minHeight: 34,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  conditionText: {
    fontSize: 11,
    fontWeight: '500',
  },
  timeText: {
    fontSize: 10,
  },
  meetupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  meetupText: {
    fontSize: 10,
    flex: 1,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 6,
    marginTop: 4,
    gap: 4,
  },
  sellerName: {
    fontSize: 11,
    fontWeight: '500',
    flex: 1,
  },
  verifiedIcon: {
    marginLeft: 2,
  },
});
