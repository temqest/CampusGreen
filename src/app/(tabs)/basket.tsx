import React, { useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { MOCK_ITEMS } from '@/data/mock-items';
import { MarketplaceItem } from '@/types/item';

interface BasketItem {
  item: MarketplaceItem;
  quantity: number;
}

export default function BasketScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Initial mock basket with items from MOCK_ITEMS
  const [basketItems, setBasketItems] = useState<BasketItem[]>([
    { item: MOCK_ITEMS[0], quantity: 1 },
    { item: MOCK_ITEMS[1], quantity: 1 },
  ]);

  const handleRemoveItem = (itemId: string) => {
    setBasketItems((prev) => prev.filter((b) => b.item.id !== itemId));
  };

  const subtotal = basketItems.reduce(
    (sum, b) => sum + (b.item.price ?? 0) * b.quantity,
    0
  );

  const totalCo2Saved = basketItems.reduce(
    (sum, b) => sum + (b.item.estimatedCo2SavedKg ?? 0) * b.quantity,
    0
  );

  const itemCount = basketItems.reduce((sum, b) => sum + b.quantity, 0);

  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: theme.background,
        },
      ]}>
      {/* Native Mobile Scroll Feed - Zero Website Topbar */}
      <FlatList
        data={basketItems}
        keyExtractor={(b) => b.item.id}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingTop: insets.top + Spacing.three,
            paddingBottom: insets.bottom + 120,
          },
        ]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            {/* Organic In-Page Title */}
            <View style={styles.titleSection}>
              <Text style={[styles.largeTitle, { color: theme.text }]}>
                Basket
              </Text>
              {basketItems.length > 0 && (
                <Text
                  style={[styles.subtitle, { color: theme.textSecondary }]}>
                  {itemCount} {itemCount === 1 ? 'item' : 'items'} ready for campus pickup
                </Text>
              )}
            </View>

            {basketItems.length > 0 && (
              <View
                style={[
                  styles.noticeBanner,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  },
                ]}>
                <Ionicons
                  name="location-outline"
                  size={18}
                  color={theme.primary}
                />
                <Text
                  style={[
                    styles.noticeText,
                    { color: theme.textSecondary },
                  ]}>
                  Meet sellers at designated on-campus safe zones. Payment stays
                  in escrow until physical item verification.
                </Text>
              </View>
            )}
          </View>
        }
        renderItem={({ item: basketEntry }) => {
          const { item } = basketEntry;
          return (
            <View
              style={[
                styles.itemCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}>
              <View style={styles.cardHeaderRow}>
                {/* Category icon placeholder */}
                <View
                  style={[
                    styles.itemIconCircle,
                    { backgroundColor: theme.surfaceSubtle },
                  ]}>
                  <Ionicons
                    name={
                      item.category.includes('Tech')
                        ? 'calculator-outline'
                        : item.category.includes('Uniform')
                        ? 'shirt-outline'
                        : 'book-outline'
                    }
                    size={22}
                    color={theme.primary}
                  />
                </View>

                <View style={styles.itemMainInfo}>
                  <Text
                    numberOfLines={2}
                    style={[styles.itemTitle, { color: theme.text }]}>
                    {item.title}
                  </Text>
                  <Text
                    style={[
                      styles.itemCondition,
                      { color: theme.textSecondary },
                    ]}>
                    {item.condition} · Sold by {item.sellerName}
                  </Text>
                </View>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${item.title} from basket`}
                  hitSlop={8}
                  style={({ pressed }) => [
                    styles.removeButton,
                    { opacity: pressed ? 0.6 : 1 },
                  ]}
                  onPress={() => handleRemoveItem(item.id)}>
                  <Ionicons
                    name="trash-outline"
                    size={18}
                    color={theme.textMuted}
                  />
                </Pressable>
              </View>

              {/* Meetup spot info */}
              <View
                style={[
                  styles.meetupRow,
                  {
                    backgroundColor: theme.surfaceSubtle,
                    borderColor: theme.borderSubtle,
                  },
                ]}>
                <Ionicons
                  name="navigate-circle-outline"
                  size={16}
                  color={theme.primary}
                />
                <Text
                  numberOfLines={1}
                  style={[styles.meetupText, { color: theme.textSecondary }]}>
                  Pickup: {item.safeMeetupSpot}
                </Text>
              </View>

              {/* Price and Action Row */}
              <View style={styles.cardFooterRow}>
                <View>
                  <Text
                    style={[
                      styles.priceLabel,
                      { color: theme.textSecondary },
                    ]}>
                    Escrow Price
                  </Text>
                  <Text style={[styles.priceValue, { color: theme.text }]}>
                    ₱{item.price?.toLocaleString()}
                  </Text>
                </View>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Chat with ${item.sellerName}`}
                  style={({ pressed }) => [
                    styles.cardChatButton,
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
                    size={15}
                    color={theme.primary}
                  />
                  <Text
                    style={[
                      styles.cardChatButtonText,
                      { color: theme.primary },
                    ]}>
                    Chat Seller
                  </Text>
                </Pressable>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View
              style={[
                styles.emptyIconCircle,
                { backgroundColor: theme.surfaceSubtle },
              ]}>
              <Ionicons
                name="basket-outline"
                size={44}
                color={theme.textMuted}
              />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              Your basket is empty
            </Text>
            <Text
              style={[
                styles.emptyDescription,
                { color: theme.textSecondary },
              ]}>
              Browse textbooks, lab tools, uniforms, and dorm essentials verified
              by fellow campus students.
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Browse marketplace"
              style={({ pressed }) => [
                styles.browseButton,
                {
                  backgroundColor: theme.primary,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
              onPress={() => router.push('/(tabs)/marketplace')}>
              <Ionicons name="storefront-outline" size={18} color="#FFFFFF" />
              <Text style={styles.browseButtonText}>Browse Marketplace</Text>
            </Pressable>
          </View>
        }
        ListFooterComponent={
          basketItems.length > 0 ? (
            <View
              style={[
                styles.summaryCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}>
              <Text style={[styles.summaryTitle, { color: theme.text }]}>
                Order Breakdown
              </Text>

              <View style={styles.summaryRow}>
                <Text
                  style={[
                    styles.summaryLabel,
                    { color: theme.textSecondary },
                  ]}>
                  Items Subtotal
                </Text>
                <Text style={[styles.summaryValue, { color: theme.text }]}>
                  ₱{subtotal.toLocaleString()}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text
                  style={[
                    styles.summaryLabel,
                    { color: theme.textSecondary },
                  ]}>
                  Campus Escrow Protection
                </Text>
                <Text style={[styles.summaryValue, { color: theme.primary }]}>
                  Free (₱0)
                </Text>
              </View>

              <View
                style={[
                  styles.divider,
                  { backgroundColor: theme.borderSubtle },
                ]}
              />

              <View style={styles.summaryRow}>
                <Text
                  style={[
                    styles.totalLabel,
                    { color: theme.text },
                  ]}>
                  Total Amount
                </Text>
                <Text style={[styles.totalValue, { color: theme.text }]}>
                  ₱{subtotal.toLocaleString()}
                </Text>
              </View>

              {/* Eco Impact Note */}
              <View
                style={[
                  styles.ecoImpactBanner,
                  {
                    backgroundColor: theme.surfaceSubtle,
                    borderColor: theme.borderSubtle,
                  },
                ]}>
                <Ionicons name="leaf-outline" size={16} color={theme.primary} />
                <Text
                  style={[
                    styles.ecoImpactText,
                    { color: theme.textSecondary },
                  ]}>
                  This basket diverts{' '}
                  <Text style={[styles.ecoImpactHighlight, { color: theme.text }]}>
                    ~{totalCo2Saved.toFixed(1)} kg of CO₂
                  </Text>{' '}
                  by reusing items within your university.
                </Text>
              </View>
            </View>
          ) : undefined
        }
      />

      {/* Pinned Bottom Checkout Dock */}
      {basketItems.length > 0 && (
        <View
          style={[
            styles.bottomDock,
            {
              backgroundColor: theme.surface,
              borderTopColor: theme.border,
              paddingBottom: Math.max(insets.bottom, 12),
            },
          ]}>
          <View style={styles.dockTotalCol}>
            <Text
              style={[styles.dockTotalLabel, { color: theme.textSecondary }]}>
              Total to pay
            </Text>
            <Text style={[styles.dockTotalAmount, { color: theme.text }]}>
              ₱{subtotal.toLocaleString()}
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Proceed to checkout ₱${subtotal}`}
            style={({ pressed }) => [
              styles.checkoutButton,
              {
                backgroundColor: theme.primary,
                opacity: pressed ? 0.88 : 1,
              },
            ]}
            onPress={() => {
              if (basketItems.length > 0) {
                router.push({
                  pathname: '/payment/[id]',
                  params: { id: basketItems[0].item.id },
                });
              }
            }}>
            <Text style={styles.checkoutButtonText}>Proceed to Escrow</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  headerBlock: {
    gap: Spacing.two,
    paddingBottom: Spacing.two,
  },
  titleSection: {
    gap: 3,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.one,
  },
  largeTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
  },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  itemCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
  },
  itemIconCircle: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemMainInfo: {
    flex: 1,
    gap: 3,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  itemCondition: {
    fontSize: 12,
  },
  removeButton: {
    padding: Spacing.one,
  },
  meetupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  meetupText: {
    flex: 1,
    fontSize: 12,
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.one,
  },
  priceLabel: {
    fontSize: 11,
  },
  priceValue: {
    fontSize: 17,
    fontWeight: '700',
  },
  cardChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.three,
    paddingVertical: 7,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  cardChatButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  summaryCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.four,
    gap: Spacing.two + 2,
    marginTop: Spacing.two,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: Spacing.one,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 13,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: Spacing.one,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  ecoImpactBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginTop: Spacing.two,
  },
  ecoImpactText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  ecoImpactHighlight: {
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.seven,
    gap: Spacing.two,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    maxWidth: 280,
    marginBottom: Spacing.two,
  },
  browseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.three,
    borderRadius: Radius.md,
  },
  browseButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  bottomDock: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    borderTopWidth: 1,
  },
  dockTotalCol: {
    gap: 2,
  },
  dockTotalLabel: {
    fontSize: 11,
  },
  dockTotalAmount: {
    fontSize: 19,
    fontWeight: '700',
  },
  checkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.three,
    borderRadius: Radius.md,
  },
  checkoutButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
