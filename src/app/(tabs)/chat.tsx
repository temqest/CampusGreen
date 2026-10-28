import React, { useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { useChat } from '@/context/chat-context';

type ChatFilter = 'all' | 'swap' | 'free' | 'buy';

export default function ChatInboxScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { conversations, markAsRead } = useChat();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<ChatFilter>('all');

  const filteredConversations = conversations.filter((c) => {
    const matchesFilter =
      activeFilter === 'all' ? true : c.tradeType === activeFilter;
    const matchesSearch =
      c.sellerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.itemTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const filterTabs: { id: ChatFilter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'swap', label: 'Trades (Swap)' },
    { id: 'free', label: 'Freebies' },
    { id: 'buy', label: 'Purchases' },
  ];

  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: theme.background,
        },
      ]}>
      {/* Native Mobile Conversation Feed - Zero Website Topbar */}
      <FlatList
        data={filteredConversations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingTop: insets.top + Spacing.three,
            paddingBottom: insets.bottom + 80,
          },
        ]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            {/* Organic In-Page Title */}
            <View style={styles.titleSection}>
              <Text style={[styles.largeTitle, { color: theme.text }]}>
                Messages
              </Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Campus peer conversations
              </Text>
            </View>

            {/* In-Feed Search Bar */}
            <View
              style={[
                styles.searchContainer,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}>
              <Ionicons
                name="search-outline"
                size={18}
                color={theme.textSecondary}
                style={styles.searchIcon}
              />
              <TextInput
                accessibilityLabel="Search conversations"
                placeholder="Search students, items, or messages..."
                placeholderTextColor={theme.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={[styles.searchInput, { color: theme.text }]}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Clear search"
                  hitSlop={8}
                  onPress={() => setSearchQuery('')}>
                  <Ionicons
                    name="close-circle"
                    size={18}
                    color={theme.textSecondary}
                  />
                </Pressable>
              )}
            </View>

            {/* Filter Tabs Row */}
            <View style={styles.filterRow}>
              {filterTabs.map((tab) => {
                const isSelected = activeFilter === tab.id;
                return (
                  <Pressable
                    key={tab.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Filter by ${tab.label}`}
                    style={({ pressed }) => [
                      styles.filterChip,
                      {
                        backgroundColor: isSelected
                          ? theme.primary
                          : theme.surface,
                        borderColor: isSelected ? theme.primary : theme.border,
                        opacity: pressed ? 0.8 : 1,
                      },
                    ]}
                    onPress={() => setActiveFilter(tab.id)}>
                    <Text
                      style={[
                        styles.filterChipText,
                        {
                          color: isSelected ? '#FFFFFF' : theme.textSecondary,
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}>
                      {tab.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* In-Feed Safety Reminder Note */}
            <View
              style={[
                styles.safetyTipCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}>
              <Ionicons
                name="shield-checkmark"
                size={18}
                color={theme.primary}
              />
              <Text
                style={[
                  styles.safetyTipText,
                  { color: theme.textSecondary },
                ]}>
                Stay safe: Coordinate inside CampusGreen and meet at designated
                campus zones during daytime.
              </Text>
            </View>
          </View>
        }
        renderItem={({ item }) => {
          const initials = item.sellerName
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase();

          const isSwap = item.tradeType === 'swap';
          const isFree = item.tradeType === 'free';

          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Open chat with ${item.sellerName}`}
              style={({ pressed }) => [
                styles.conversationCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
              onPress={() => {
                markAsRead(item.itemId);
                router.push({
                  pathname: '/chat/[id]',
                  params: {
                    id: item.itemId,
                    sellerName: item.sellerName,
                    itemTitle: item.itemTitle,
                    price: item.price !== null ? item.price.toString() : '0',
                  },
                });
              }}>
              {/* Student Avatar */}
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: theme.surfaceSubtle },
                ]}>
                <Text style={[styles.avatarText, { color: theme.primary }]}>
                  {initials}
                </Text>
              </View>

              {/* Chat details */}
              <View style={styles.chatDetails}>
                <View style={styles.topRow}>
                  <View style={styles.nameGroup}>
                    <Text
                      numberOfLines={1}
                      style={[styles.sellerName, { color: theme.text }]}>
                      {item.sellerName}
                    </Text>
                    <Ionicons
                      name="checkmark-circle"
                      size={14}
                      color={theme.primary}
                    />
                  </View>
                  <Text
                    style={[styles.timestamp, { color: theme.textSecondary }]}>
                    {item.timestamp}
                  </Text>
                </View>

                {/* Item label with deal-type contextual tag */}
                <View style={styles.itemTagRow}>
                  <Ionicons
                    name={
                      isSwap
                        ? 'repeat'
                        : isFree
                        ? 'gift-outline'
                        : 'pricetag-outline'
                    }
                    size={13}
                    color={theme.primary}
                  />
                  <Text
                    numberOfLines={1}
                    style={[styles.itemSnippet, { color: theme.textSecondary }]}>
                    {item.itemTitle}
                  </Text>
                </View>

                {/* Last message and unread badge */}
                <View style={styles.messageRow}>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.lastMessageText,
                      {
                        color:
                          item.unreadCount > 0
                            ? theme.text
                            : theme.textSecondary,
                        fontWeight: item.unreadCount > 0 ? '600' : '400',
                      },
                    ]}>
                    {item.lastMessage}
                  </Text>
                  {item.unreadCount > 0 && (
                    <View
                      style={[
                        styles.unreadBadge,
                        { backgroundColor: theme.primary },
                      ]}>
                      <Text style={styles.unreadBadgeText}>
                        {item.unreadCount}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name="chatbubbles-outline"
              size={44}
              color={theme.textMuted}
            />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              No conversations found
            </Text>
            <Text
              style={[
                styles.emptySubtitle,
                { color: theme.textSecondary },
              ]}>
              Ask sellers questions, propose trades, or request freebies right
              from item pages.
            </Text>
          </View>
        }
      />
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
  },
  searchIcon: {
    marginRight: Spacing.two,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    height: '100%',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    paddingVertical: Spacing.one,
  },
  filterChip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 12,
  },
  safetyTipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + 2,
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  safetyTipText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '700',
  },
  chatDetails: {
    flex: 1,
    gap: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nameGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '75%',
  },
  sellerName: {
    fontSize: 15,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 11,
  },
  itemTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  itemSnippet: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  messageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  lastMessageText: {
    flex: 1,
    fontSize: 13,
    marginRight: Spacing.two,
  },
  unreadBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.seven,
    gap: Spacing.two,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: Spacing.two,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 240,
  },
});
