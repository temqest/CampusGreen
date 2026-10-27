import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { TradeType } from '@/types/item';

interface DealTypeSelectorProps {
  selectedTradeType: TradeType | null;
  onSelectTradeType: (type: TradeType | null) => void;
}

const TRADE_OPTIONS: { label: string; value: TradeType | null }[] = [
  { label: 'All Deals', value: null },
  { label: 'Buy (₱)', value: 'buy' },
  { label: 'Swap Zone', value: 'swap' },
  { label: 'Freebies', value: 'free' },
];

export function DealTypeSelector({
  selectedTradeType,
  onSelectTradeType,
}: DealTypeSelectorProps) {
  const theme = useTheme();

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.surfaceSubtle,
            borderColor: theme.border,
          },
        ]}>
        {TRADE_OPTIONS.map((opt) => {
          const isActive = selectedTradeType === opt.value;
          return (
            <Pressable
              key={opt.label}
              accessibilityRole="button"
              accessibilityLabel={`Filter by ${opt.label}`}
              style={[
                styles.segment,
                isActive && [
                  styles.segmentActive,
                  { backgroundColor: theme.surface },
                ],
              ]}
              onPress={() => onSelectTradeType(opt.value)}>
              <Text
                style={[
                  styles.segmentText,
                  {
                    color: isActive ? theme.primary : theme.textSecondary,
                    fontWeight: isActive ? '700' : '500',
                  },
                ]}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: Spacing.four,
    marginBottom: Spacing.four,
  },
  container: {
    flexDirection: 'row',
    borderRadius: Radius.md,
    padding: 4,
    borderWidth: 1,
  },
  segment: {
    flex: 1,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.sm,
  },
  segmentActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 12,
  },
});
