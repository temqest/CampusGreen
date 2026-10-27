import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Spacing, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ItemCategory, MarketplaceItem, TradeType } from '@/types/item';
import { INITIAL_GREEN_IMPACT, MOCK_ITEMS } from '@/data/mock-items';

import { MarketplaceHeader } from '@/components/marketplace/marketplace-header';
import { GreenImpactCard } from '@/components/marketplace/green-impact-card';
import { DealTypeSelector } from '@/components/marketplace/deal-type-selector';
import { CategoryBar } from '@/components/marketplace/category-bar';
import { ItemCard } from '@/components/marketplace/item-card';

const CAMPUS_OPTIONS = [
  'Ateneo de Naga University',
  'Univ. of Nueva Caceres',
  'All Campuses',
];

export default function MarketplaceScreen() {
  const theme = useTheme();

  // State
  const [selectedCampus, setSelectedCampus] = useState('Ateneo de Naga University');
  const [campusModalVisible, setCampusModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTradeType, setSelectedTradeType] = useState<TradeType | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [items] = useState<MarketplaceItem[]>(MOCK_ITEMS);
  const [greenStats] = useState(INITIAL_GREEN_IMPACT);

  // Pull-to-refresh
  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 600);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedTradeType(null);
    setSelectedCategory(null);
  };

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // 1. Campus Filter
      if (selectedCampus !== 'All Campuses' && item.campus !== selectedCampus) {
        return false;
      }

      // 2. Deal Type Filter
      if (selectedTradeType && item.tradeType !== selectedTradeType) {
        return false;
      }

      // 3. Category Filter
      if (selectedCategory && item.category !== selectedCategory) {
        return false;
      }

      // 4. Search Query Filter
      if (searchQuery.trim().length > 0) {
        const query = searchQuery.toLowerCase().trim();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesCourse = item.courseTag?.toLowerCase().includes(query) ?? false;
        const matchesCategory = item.category.toLowerCase().includes(query);
        const matchesDesc = item.description.toLowerCase().includes(query);
        const matchesSpot = item.safeMeetupSpot.toLowerCase().includes(query);

        if (!matchesTitle && !matchesCourse && !matchesCategory && !matchesDesc && !matchesSpot) {
          return false;
        }
      }

      return true;
    });
  }, [items, selectedCampus, selectedTradeType, selectedCategory, searchQuery]);

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    selectedTradeType !== null ||
    selectedCategory !== null;

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.screen, { backgroundColor: theme.background }]}>
      {/* 2-Column Responsive Feed */}
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }
        ListHeaderComponent={
          <View style={styles.headerComponent}>
            {/* Campus Selector & Search Bar */}
            <MarketplaceHeader
              campus={selectedCampus}
              onChangeCampus={() => setCampusModalVisible(true)}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />

            {/* Green Impact Counter (Wallet-style Sustainability Card) */}
            <GreenImpactCard stats={greenStats} />

            {/* Deal Type Selector (All, Buy, Swap, Free) */}
            <DealTypeSelector
              selectedTradeType={selectedTradeType}
              onSelectTradeType={setSelectedTradeType}
            />

            {/* Category Filter Bar */}
            <CategoryBar
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />

            {/* Feed Status Row: Results count & clear filters button */}
            <View style={styles.feedStatusRow}>
              <Text style={[styles.resultsCount, { color: theme.textSecondary }]}>
                {filteredItems.length === 1
                  ? '1 item available'
                  : `${filteredItems.length} items available`}
              </Text>

              {hasActiveFilters && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Reset all active filters"
                  hitSlop={8}
                  style={styles.resetButton}
                  onPress={handleResetFilters}>
                  <Text style={[styles.resetButtonText, { color: theme.primary }]}>
                    Reset filters
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        }
        renderItem={({ item }) => <ItemCard item={item} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View
              style={[
                styles.emptyMotifCircle,
                { backgroundColor: theme.surfaceSubtle },
              ]}>
              <Ionicons
                name="search-outline"
                size={36}
                color={theme.textMuted}
              />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              No items found
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              Try adjusting your search terms or clearing your category and deal filters.
            </Text>
            {hasActiveFilters && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Clear all filters"
                style={[
                  styles.emptyResetButton,
                  { backgroundColor: theme.primary },
                ]}
                onPress={handleResetFilters}>
                <Text style={styles.emptyResetButtonText}>
                  Show All Campus Items
                </Text>
              </Pressable>
            )}
          </View>
        }
      />

      {/* Campus Selector Modal */}
      <Modal
        visible={campusModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCampusModalVisible(false)}>
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setCampusModalVisible(false)}>
          <Pressable
            style={[styles.campusModalCard, { backgroundColor: theme.surface }]}
            onPress={(e) => e.stopPropagation()}>
            <Text style={[styles.campusModalTitle, { color: theme.text }]}>
              Select Your Campus
            </Text>
            <View style={styles.campusOptionList}>
              {CAMPUS_OPTIONS.map((c) => {
                const isSelected = selectedCampus === c;
                return (
                  <Pressable
                    key={c}
                    accessibilityRole="button"
                    accessibilityLabel={`Choose ${c}`}
                    style={[
                      styles.campusOptionItem,
                      {
                        backgroundColor: isSelected
                          ? theme.primaryLight
                          : 'transparent',
                        borderColor: isSelected
                          ? theme.primary
                          : theme.borderSubtle,
                      },
                    ]}
                    onPress={() => {
                      setSelectedCampus(c);
                      setCampusModalVisible(false);
                    }}>
                    <Ionicons
                      name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                      size={18}
                      color={isSelected ? theme.primary : theme.textSecondary}
                    />
                    <Text
                      style={[
                        styles.campusOptionText,
                        {
                          color: isSelected ? theme.primary : theme.text,
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}>
                      {c}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  listContent: {
    paddingBottom: Spacing.eight + 24,
  },
  columnWrapper: {
    paddingHorizontal: Spacing.three,
  },
  headerComponent: {
    paddingBottom: Spacing.three,
  },
  feedStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    marginTop: Spacing.two,
    marginBottom: Spacing.three,
  },
  resultsCount: {
    fontSize: 13,
    fontWeight: '600',
  },
  resetButton: {
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  resetButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: Spacing.six,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.four,
  },
  emptyMotifCircle: {
    width: 72,
    height: 72,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.three,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
    marginBottom: Spacing.four,
  },
  emptyResetButton: {
    paddingHorizontal: Spacing.four,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyResetButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.five,
  },
  campusModalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: Radius.xl,
    padding: Spacing.five,
  },
  campusModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: Spacing.four,
  },
  campusOptionList: {
    gap: Spacing.two,
  },
  campusOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: Spacing.three,
    height: 48,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  campusOptionText: {
    fontSize: 14,
  },
});
