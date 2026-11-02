import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Spacing, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useItems } from '@/context/items-context';
import { ItemCategory, TradeType } from '@/types/item';
import { INITIAL_GREEN_IMPACT } from '@/data/mock-items';

import { MarketplaceHeader } from '@/components/marketplace/marketplace-header';
import { GreenImpactCard } from '@/components/marketplace/green-impact-card';
import { DealTypeSelector } from '@/components/marketplace/deal-type-selector';
import { CategoryBar } from '@/components/marketplace/category-bar';
import { ItemCard } from '@/components/marketplace/item-card';

const CATEGORIES: { label: ItemCategory; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: 'Textbooks & Reviewers', icon: 'book-outline' },
  { label: 'Uniforms & Scrubs', icon: 'shirt-outline' },
  { label: 'Tools & Lab Gear', icon: 'construct-outline' },
  { label: 'Dorm & Room', icon: 'home-outline' },
  { label: 'Tech & Gadgets', icon: 'hardware-chip-outline' },
];

const TRADE_OPTIONS: { label: string; value: TradeType | null }[] = [
  { label: 'All Deals', value: null },
  { label: 'Buy (₱)', value: 'buy' },
  { label: 'Swap Zone', value: 'swap' },
  { label: 'Freebies', value: 'free' },
];

const CAMPUS_OPTIONS = [
  'Ateneo de Naga University',
  'Univ. of Nueva Caceres',
  'All Campuses',
];

const POPULAR_COURSES = [
  'BS Tourism Management',
  'BS Accountancy',
  'BS Nursing',
  'BS Information Technology',
  'BS Computer Science',
  'BS Civil Engineering',
  'BS Business Administration',
  'BS Architecture',
  'BS Secondary Education',
  'BS Psychology',
  'BS Biology',
];

export default function MarketplaceScreen() {
  const theme = useTheme();
  const { items } = useItems();

  // State
  const [selectedCampus, setSelectedCampus] = useState('Ateneo de Naga University');
  const [campusModalVisible, setCampusModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTradeType, setSelectedTradeType] = useState<TradeType | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [greenStats] = useState(INITIAL_GREEN_IMPACT);

  const isSearching = searchQuery.trim().length > 0;

  // Available courses dynamically gathered from active items + popular list
  const availableCourses = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => {
      if (item.courseTag && item.courseTag.trim().length > 0) {
        set.add(item.courseTag.trim());
      }
    });
    POPULAR_COURSES.forEach((course) => set.add(course));
    return Array.from(set).sort();
  }, [items]);

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
    setSelectedCourse(null);
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

      // 4. Course Filter
      if (selectedCourse && item.courseTag?.toLowerCase() !== selectedCourse.toLowerCase()) {
        return false;
      }

      // 5. Search Query Filter
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
  }, [items, selectedCampus, selectedTradeType, selectedCategory, selectedCourse, searchQuery]);

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    selectedTradeType !== null ||
    selectedCategory !== null ||
    selectedCourse !== null;

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
              onPressFilter={() => setFilterModalVisible(true)}
              hasActiveFilters={
                selectedTradeType !== null ||
                selectedCategory !== null ||
                selectedCourse !== null
              }
            />

            {!isSearching ? (
              <>
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
              </>
            ) : (
              /* Search query indicator bar when searching */
              <View style={styles.searchActiveBar}>
                <View style={styles.searchActiveBadge}>
                  <Ionicons name="search" size={13} color={theme.primary} />
                  <Text style={[styles.searchActiveText, { color: theme.primary }]}>
                    Searching: &ldquo;{searchQuery}&rdquo;
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Clear search input"
                  hitSlop={6}
                  onPress={() => setSearchQuery('')}>
                  <Text style={[styles.clearSearchLink, { color: theme.textSecondary }]}>
                    Exit search
                  </Text>
                </Pressable>
              </View>
            )}

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

      {/* Filter Modal */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFilterModalVisible(false)}>
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setFilterModalVisible(false)}>
          <Pressable
            style={[styles.filterModalCard, { backgroundColor: theme.surface }]}
            onPress={(e) => e.stopPropagation()}>
            <View style={styles.filterModalHeader}>
              <View>
                <Text style={[styles.filterModalTitle, { color: theme.text }]}>
                  Filter Marketplace
                </Text>
                <Text style={[styles.filterModalSubtitle, { color: theme.textSecondary }]}>
                  Refine by deal type, category, or course
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close filter modal"
                hitSlop={8}
                onPress={() => setFilterModalVisible(false)}
                style={styles.modalCloseButton}>
                <Ionicons name="close" size={20} color={theme.textSecondary} />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.filterModalScrollContent}>
              {/* Deal Type Section */}
              <View style={styles.filterSection}>
                <Text style={[styles.filterSectionTitle, { color: theme.textSecondary }]}>
                  DEAL TYPE
                </Text>
                <View style={styles.filterChipGrid}>
                  {TRADE_OPTIONS.map((opt) => {
                    const isSelected = selectedTradeType === opt.value;
                    return (
                      <Pressable
                        key={opt.label}
                        accessibilityRole="button"
                        accessibilityLabel={`Select deal filter ${opt.label}`}
                        style={[
                          styles.filterModalChip,
                          {
                            backgroundColor: isSelected
                              ? theme.primary
                              : theme.surfaceSubtle,
                            borderColor: isSelected
                              ? theme.primary
                              : theme.border,
                          },
                        ]}
                        onPress={() => setSelectedTradeType(opt.value)}>
                        <Text
                          style={[
                            styles.filterModalChipText,
                            {
                              color: isSelected ? '#FFFFFF' : theme.text,
                              fontWeight: isSelected ? '700' : '500',
                            },
                          ]}>
                          {opt.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Category Section */}
              <View style={styles.filterSection}>
                <Text style={[styles.filterSectionTitle, { color: theme.textSecondary }]}>
                  CATEGORY
                </Text>
                <View style={styles.filterChipGrid}>
                  {/* All categories option */}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="All Categories"
                    style={[
                      styles.filterModalChip,
                      {
                        backgroundColor:
                          selectedCategory === null
                            ? theme.primary
                            : theme.surfaceSubtle,
                        borderColor:
                          selectedCategory === null
                            ? theme.primary
                            : theme.border,
                      },
                    ]}
                    onPress={() => setSelectedCategory(null)}>
                    <Ionicons
                      name="grid-outline"
                      size={14}
                      color={selectedCategory === null ? '#FFFFFF' : theme.textSecondary}
                    />
                    <Text
                      style={[
                        styles.filterModalChipText,
                        {
                          color: selectedCategory === null ? '#FFFFFF' : theme.text,
                          fontWeight: selectedCategory === null ? '700' : '500',
                        },
                      ]}>
                      All Categories
                    </Text>
                  </Pressable>

                  {CATEGORIES.map((cat) => {
                    const isSelected = selectedCategory === cat.label;
                    return (
                      <Pressable
                        key={cat.label}
                        accessibilityRole="button"
                        accessibilityLabel={`Category filter ${cat.label}`}
                        style={[
                          styles.filterModalChip,
                          {
                            backgroundColor: isSelected
                              ? theme.primary
                              : theme.surfaceSubtle,
                            borderColor: isSelected
                              ? theme.primary
                              : theme.border,
                          },
                        ]}
                        onPress={() =>
                          setSelectedCategory(isSelected ? null : cat.label)
                        }>
                        <Ionicons
                          name={cat.icon}
                          size={14}
                          color={isSelected ? '#FFFFFF' : theme.textSecondary}
                        />
                        <Text
                          style={[
                            styles.filterModalChipText,
                            {
                              color: isSelected ? '#FFFFFF' : theme.text,
                              fontWeight: isSelected ? '700' : '500',
                            },
                          ]}>
                          {cat.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Course Program Section */}
              <View style={styles.filterSection}>
                <Text style={[styles.filterSectionTitle, { color: theme.textSecondary }]}>
                  COURSE & ACADEMIC PROGRAM
                </Text>
                <View style={styles.filterChipGrid}>
                  {/* All courses option */}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="All Courses"
                    style={[
                      styles.filterModalChip,
                      {
                        backgroundColor:
                          selectedCourse === null
                            ? theme.primary
                            : theme.surfaceSubtle,
                        borderColor:
                          selectedCourse === null
                            ? theme.primary
                            : theme.border,
                      },
                    ]}
                    onPress={() => setSelectedCourse(null)}>
                    <Ionicons
                      name="school-outline"
                      size={14}
                      color={selectedCourse === null ? '#FFFFFF' : theme.textSecondary}
                    />
                    <Text
                      style={[
                        styles.filterModalChipText,
                        {
                          color: selectedCourse === null ? '#FFFFFF' : theme.text,
                          fontWeight: selectedCourse === null ? '700' : '500',
                        },
                      ]}>
                      All Courses
                    </Text>
                  </Pressable>

                  {availableCourses.map((course) => {
                    const isSelected = selectedCourse === course;
                    return (
                      <Pressable
                        key={course}
                        accessibilityRole="button"
                        accessibilityLabel={`Course filter ${course}`}
                        style={[
                          styles.filterModalChip,
                          {
                            backgroundColor: isSelected
                              ? theme.primary
                              : theme.surfaceSubtle,
                            borderColor: isSelected
                              ? theme.primary
                              : theme.border,
                          },
                        ]}
                        onPress={() =>
                          setSelectedCourse(isSelected ? null : course)
                        }>
                        <Ionicons
                          name="school-outline"
                          size={14}
                          color={isSelected ? '#FFFFFF' : theme.textSecondary}
                        />
                        <Text
                          style={[
                            styles.filterModalChipText,
                            {
                              color: isSelected ? '#FFFFFF' : theme.text,
                              fontWeight: isSelected ? '700' : '500',
                            },
                          ]}>
                          {course}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </ScrollView>

            {/* Actions Footer */}
            <View style={styles.filterModalActions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Reset filters"
                style={[
                  styles.filterResetAction,
                  { borderColor: theme.border, backgroundColor: theme.surfaceSubtle },
                ]}
                onPress={() => {
                  setSelectedTradeType(null);
                  setSelectedCategory(null);
                  setSelectedCourse(null);
                }}>
                <Text style={[styles.filterResetActionText, { color: theme.textSecondary }]}>
                  Reset
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Apply filters"
                style={[
                  styles.filterApplyAction,
                  { backgroundColor: theme.primary },
                ]}
                onPress={() => setFilterModalVisible(false)}>
                <Text style={styles.filterApplyActionText}>
                  Apply Filters
                </Text>
              </Pressable>
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
  searchActiveBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    marginBottom: Spacing.two,
  },
  searchActiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  searchActiveText: {
    fontSize: 13,
    fontWeight: '600',
  },
  clearSearchLink: {
    fontSize: 12,
    fontWeight: '600',
    paddingLeft: Spacing.two,
  },
  filterModalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: Radius.xl,
    padding: Spacing.five,
    maxHeight: '85%',
  },
  filterModalScrollContent: {
    paddingBottom: Spacing.three,
  },
  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.four,
  },
  filterModalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  filterModalSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  modalCloseButton: {
    padding: 4,
  },
  filterSection: {
    marginBottom: Spacing.four,
  },
  filterSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: Spacing.two,
  },
  filterChipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  filterModalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.three,
    paddingVertical: 8,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  filterModalChipText: {
    fontSize: 13,
  },
  filterModalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginTop: Spacing.two,
  },
  filterResetAction: {
    flex: 1,
    height: 44,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterResetActionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  filterApplyAction: {
    flex: 2,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterApplyActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
