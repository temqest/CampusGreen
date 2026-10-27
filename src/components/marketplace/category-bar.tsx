import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ItemCategory } from '@/types/item';

interface CategoryBarProps {
  selectedCategory: ItemCategory | null;
  onSelectCategory: (category: ItemCategory | null) => void;
}

const CATEGORIES: { label: ItemCategory; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: 'Textbooks & Reviewers', icon: 'book-outline' },
  { label: 'Uniforms & Scrubs', icon: 'shirt-outline' },
  { label: 'Tools & Lab Gear', icon: 'construct-outline' },
  { label: 'Dorm & Room', icon: 'home-outline' },
  { label: 'Tech & Gadgets', icon: 'hardware-chip-outline' },
];

export function CategoryBar({
  selectedCategory,
  onSelectCategory,
}: CategoryBarProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* Neutral "All Categories" chip */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Show all categories"
          style={({ pressed }) => [
            styles.chip,
            {
              backgroundColor:
                selectedCategory === null ? theme.primary : theme.surface,
              borderColor:
                selectedCategory === null ? theme.primary : theme.border,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
          onPress={() => onSelectCategory(null)}>
          <Ionicons
            name="grid-outline"
            size={14}
            color={selectedCategory === null ? '#FFFFFF' : theme.textSecondary}
          />
          <Text
            style={[
              styles.chipText,
              {
                color:
                  selectedCategory === null ? '#FFFFFF' : theme.text,
                fontWeight: selectedCategory === null ? '600' : '500',
              },
            ]}>
            All Categories
          </Text>
        </Pressable>

        {/* Specific categories */}
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.label;
          return (
            <Pressable
              key={cat.label}
              accessibilityRole="button"
              accessibilityLabel={`Filter by ${cat.label}`}
              style={({ pressed }) => [
                styles.chip,
                {
                  backgroundColor: isSelected ? theme.primary : theme.surface,
                  borderColor: isSelected ? theme.primary : theme.border,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
              onPress={() => onSelectCategory(isSelected ? null : cat.label)}>
              <Ionicons
                name={cat.icon}
                size={14}
                color={isSelected ? '#FFFFFF' : theme.textSecondary}
              />
              <Text
                style={[
                  styles.chipText,
                  {
                    color: isSelected ? '#FFFFFF' : theme.text,
                    fontWeight: isSelected ? '600' : '500',
                  },
                ]}>
                {cat.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.four,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.two + 2,
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 40,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
  },
});
