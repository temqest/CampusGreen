import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { MOCK_ITEMS } from '@/data/mock-items';

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const router = useRouter();

  const item = MOCK_ITEMS.find((i) => i.id === id) || MOCK_ITEMS[0];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}>
      {/* Visual Header / Motif Area */}
      <View
        style={[
          styles.heroArea,
          { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
        ]}>
        <View
          style={[
            styles.heroCircle,
            { backgroundColor: 'rgba(31, 92, 58, 0.08)' },
          ]}>
          <Ionicons name="cube-outline" size={54} color={theme.primary} />
        </View>

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
                Swap Zone
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
                Freebie / Pay-It-Forward
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Item Information Card */}
      <View
        style={[
          styles.infoCard,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}>
        {item.courseTag ? (
          <Text style={[styles.courseTag, { color: theme.primary }]}>
            {item.courseTag} {item.yearLevel ? `• ${item.yearLevel}` : ''}
          </Text>
        ) : null}

        <Text style={[styles.title, { color: theme.text }]}>{item.title}</Text>

        <View style={styles.metaRow}>
          <Text style={[styles.metaCondition, { color: theme.textSecondary }]}>
            Condition: <Text style={{ fontWeight: '700', color: theme.text }}>{item.condition}</Text>
          </Text>
          <Text style={[styles.metaTime, { color: theme.textMuted }]}>
            Listed {item.createdAt}
          </Text>
        </View>

        {/* Environmental Impact Tag */}
        <View
          style={[
            styles.greenImpactRow,
            { backgroundColor: theme.badgeGreenBg },
          ]}>
          <Ionicons name="leaf" size={16} color={theme.primary} />
          <Text style={[styles.greenImpactText, { color: theme.primary }]}>
            Saves ~{item.estimatedCo2SavedKg} kg CO₂e through reuse
          </Text>
        </View>

        <Text style={[styles.description, { color: theme.textSecondary }]}>
          {item.description}
        </Text>

        {/* Safe Meetup Spot */}
        <View
          style={[
            styles.meetupCard,
            { backgroundColor: theme.surfaceSubtle, borderColor: theme.borderSubtle },
          ]}>
          <Ionicons name="location" size={18} color={theme.primary} />
          <View style={styles.meetupInfo}>
            <Text style={[styles.meetupLabel, { color: theme.textMuted }]}>
              Designated Safe Meetup Spot:
            </Text>
            <Text style={[styles.meetupSpot, { color: theme.text }]}>
              {item.safeMeetupSpot}
            </Text>
            <Text style={[styles.meetupCampus, { color: theme.textSecondary }]}>
              {item.campus}
            </Text>
          </View>
        </View>

        {/* Seller Info */}
        <View
          style={[
            styles.sellerCard,
            { borderTopColor: theme.borderSubtle },
          ]}>
          <View style={styles.sellerAvatar}>
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
            <Text style={[styles.sellerYear, { color: theme.textSecondary }]}>
              {item.sellerYear} • ⭐ {item.sellerRating.toFixed(1)} rating
            </Text>
          </View>
        </View>
      </View>

      {/* Bottom Action CTA */}
      <View style={styles.actionContainer}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Message seller"
          style={({ pressed }) => [
            styles.primaryButton,
            {
              backgroundColor: theme.primary,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
          onPress={() =>
            router.push({
              pathname: '/chat/[id]',
              params: { id: item.id },
            })
          }>
          <Ionicons name="chatbubbles-outline" size={18} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>
            {item.tradeType === 'swap'
              ? 'Propose Swap'
              : item.tradeType === 'free'
              ? 'Request Freebie'
              : 'Chat with Seller'}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.four,
    gap: Spacing.four,
  },
  heroArea: {
    height: 180,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  heroCircle: {
    width: 90,
    height: 90,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeTopLeft: {
    position: 'absolute',
    top: 12,
    left: 12,
  },
  dealBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.sm,
  },
  dealBadgeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  infoCard: {
    padding: Spacing.four,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.three,
  },
  courseTag: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaCondition: {
    fontSize: 13,
  },
  metaTime: {
    fontSize: 12,
  },
  greenImpactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: Spacing.two + 2,
    borderRadius: Radius.md,
  },
  greenImpactText: {
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  meetupCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  meetupInfo: {
    flex: 1,
    gap: 2,
  },
  meetupLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  meetupSpot: {
    fontSize: 13,
    fontWeight: '700',
  },
  meetupCampus: {
    fontSize: 11,
  },
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: 1,
    paddingTop: Spacing.three,
  },
  sellerAvatar: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(31, 92, 58, 0.1)',
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
  actionContainer: {
    marginTop: Spacing.two,
  },
  primaryButton: {
    height: 50,
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
