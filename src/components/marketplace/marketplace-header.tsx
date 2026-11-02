import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface MarketplaceHeaderProps {
  campus: string;
  onChangeCampus: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onPressFilter?: () => void;
  hasActiveFilters?: boolean;
}

export function MarketplaceHeader({
  campus,
  onChangeCampus,
  searchQuery,
  onSearchChange,
  onPressFilter,
  hasActiveFilters,
}: MarketplaceHeaderProps) {
  const theme = useTheme();

  return (
    <View style={styles.header}>
      {/* Top Campus Selector (clean, no meeting zone pill) */}
      <View style={styles.topRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Change campus: currently ${campus}`}
          style={({ pressed }) => [
            styles.campusSelector,
            { opacity: pressed ? 0.75 : 1 },
          ]}
          onPress={onChangeCampus}>
          <View
            style={[
              styles.campusIconCircle,
              { backgroundColor: theme.primaryLight },
            ]}>
            <Ionicons name="school" size={15} color={theme.primary} />
          </View>
          <View style={styles.campusTextGroup}>
            <Text style={[styles.campusSubLabel, { color: theme.textSecondary }]}>
              Campus
            </Text>
            <View style={styles.campusNameRow}>
              <Text
                numberOfLines={1}
                style={[styles.campusText, { color: theme.text }]}>
                {campus}
              </Text>
              <Ionicons
                name="chevron-down"
                size={14}
                color={theme.textSecondary}
              />
            </View>
          </View>
        </Pressable>
      </View>

      {/* Search Input Bar with Embedded Filter Button */}
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
          size={19}
          color={theme.textSecondary}
          style={styles.searchIcon}
        />
        <TextInput
          accessibilityLabel="Search items or courses"
          placeholder="Search items, courses (e.g. Tourism), gear..."
          placeholderTextColor={theme.textMuted}
          value={searchQuery}
          onChangeText={onSearchChange}
          style={[styles.searchInput, { color: theme.text }]}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            hitSlop={8}
            onPress={() => onSearchChange('')}
            style={styles.clearButton}>
            <Ionicons
              name="close-circle"
              size={18}
              color={theme.textSecondary}
            />
          </Pressable>
        )}

        {onPressFilter && (
          <>
            <View style={[styles.filterDivider, { backgroundColor: theme.borderSubtle }]} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Filter items"
              hitSlop={8}
              style={({ pressed }) => [
                styles.inlineFilterButton,
                hasActiveFilters && {
                  backgroundColor: theme.primaryLight,
                },
                { opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={onPressFilter}>
              <Ionicons
                name={hasActiveFilters ? 'options' : 'options-outline'}
                size={18}
                color={hasActiveFilters ? theme.primary : theme.textSecondary}
              />
              {hasActiveFilters && (
                <View
                  style={[styles.activeDot, { backgroundColor: theme.primary }]}
                />
              )}
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.three,
    marginBottom: Spacing.two,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  campusSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  campusIconCircle: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  campusTextGroup: {
    gap: 1,
  },
  campusSubLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  campusNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  campusText: {
    fontSize: 15,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.four,
  },
  searchIcon: {
    marginRight: Spacing.two + 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    height: '100%',
  },
  clearButton: {
    padding: 2,
    marginRight: Spacing.two,
  },
  filterDivider: {
    width: 1,
    height: 22,
    marginHorizontal: Spacing.two,
  },
  inlineFilterButton: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  activeDot: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
