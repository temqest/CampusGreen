import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { GreenImpactStats } from '@/types/item';

interface GreenImpactCardProps {
  stats: GreenImpactStats;
}

export function GreenImpactCard({ stats }: GreenImpactCardProps) {
  const theme = useTheme();
  const [scope, setScope] = useState<'campus' | 'personal'>('campus');
  const [infoModalVisible, setInfoModalVisible] = useState(false);

  const isCampus = scope === 'campus';
  const co2Display = isCampus ? stats.co2SavedKg : stats.userCo2SavedKg;
  const wasteDisplay = isCampus ? stats.wasteDivertedKg : (stats.userItemsReused * 1.4).toFixed(1);
  const itemsDisplay = isCampus ? stats.itemsReused : stats.userItemsReused;
  const moneyDisplay = isCampus ? stats.moneySavedPhp : stats.userMoneySavedPhp;

  return (
    <View style={styles.cardContainer}>
      {/* Wallet-Style Sustainability Card */}
      <View style={[styles.card, { backgroundColor: theme.primaryDark }]}>
        {/* Top bar: Title, scope switcher & info icon */}
        <View style={styles.topRow}>
          <View style={styles.headerLeft}>
            <View style={styles.leafIconBadge}>
              <Ionicons name="leaf" size={13} color="#86EFAC" />
            </View>
            <Text numberOfLines={1} style={styles.headerTitle}>Green Impact</Text>
          </View>

          <View style={styles.headerRight}>
            {/* Scope Switcher: Campus vs Personal */}
            <View style={styles.scopeToggleContainer}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Show campus total impact"
                style={[
                  styles.scopeOption,
                  isCampus && styles.scopeOptionActive,
                ]}
                onPress={() => setScope('campus')}>
                <Text
                  style={[
                    styles.scopeOptionText,
                    isCampus && styles.scopeOptionTextActive,
                  ]}>
                  Campus
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Show my personal impact"
                style={[
                  styles.scopeOption,
                  !isCampus && styles.scopeOptionActive,
                ]}
                onPress={() => setScope('personal')}>
                <Text
                  style={[
                    styles.scopeOptionText,
                    !isCampus && styles.scopeOptionTextActive,
                  ]}>
                  Mine
                </Text>
              </Pressable>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Impact info"
              style={styles.infoButton}
              hitSlop={8}
              onPress={() => setInfoModalVisible(true)}>
              <Ionicons name="information-circle-outline" size={18} color="#D1D5DB" />
            </Pressable>
          </View>
        </View>

        {/* Primary Hero Metric (Analogous to Wallet Balance) */}
        <View style={styles.metricHero}>
          <Text style={styles.metricHeroLabel}>
            {isCampus ? 'TOTAL EMISSIONS PREVENTED' : 'YOUR PERSONAL CONTRIBUTION'}
          </Text>
          <View style={styles.heroNumberRow}>
            <Text style={styles.heroNumber}>{co2Display}</Text>
            <Text style={styles.heroUnit}>kg CO₂e</Text>
          </View>
          <Text style={styles.heroSubtitle}>
            Saved by keeping college gear in active circulation
          </Text>
        </View>

        {/* Secondary Stat Strip with crisp vertical dividers */}
        <View style={styles.statStrip}>
          <View style={styles.statCell}>
            <Text style={styles.statCellValue}>{wasteDisplay} kg</Text>
            <Text style={styles.statCellLabel}>Waste Diverted</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statCell}>
            <Text style={styles.statCellValue}>{itemsDisplay}</Text>
            <Text style={styles.statCellLabel}>Items Reused</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statCell}>
            <Text style={styles.statCellValue}>₱{moneyDisplay.toLocaleString()}</Text>
            <Text style={styles.statCellLabel}>Student Savings</Text>
          </View>
        </View>
      </View>

      {/* Sustainability Calculation Info Modal */}
      <Modal
        visible={infoModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setInfoModalVisible(false)}>
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setInfoModalVisible(false)}>
          <Pressable
            style={[styles.modalCard, { backgroundColor: theme.surface }]}
            onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconRow}>
                <Ionicons name="earth" size={22} color={theme.primary} />
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  How Campus Impact is Counted
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close info"
                hitSlop={8}
                onPress={() => setInfoModalVisible(false)}>
                <Ionicons name="close" size={20} color={theme.textSecondary} />
              </Pressable>
            </View>

            <View style={styles.modalContent}>
              <Text style={[styles.modalBody, { color: theme.textSecondary }]}>
                Every textbook, uniform, and tool exchanged on CampusGreen prevents virgin manufacturing, packaging, and shipping footprint:
              </Text>

              <View style={styles.modalFactorList}>
                <View style={styles.modalFactorItem}>
                  <Text style={[styles.modalFactorTitle, { color: theme.text }]}>
                    📚 Textbooks & Notes
                  </Text>
                  <Text style={[styles.modalFactorText, { color: theme.textSecondary }]}>
                    Saves ~3.5 to 5.4 kg CO₂ and 1.2 kg paper waste per copy reused.
                  </Text>
                </View>

                <View style={styles.modalFactorItem}>
                  <Text style={[styles.modalFactorTitle, { color: theme.text }]}>
                    🩺 Uniforms & Scrubs
                  </Text>
                  <Text style={[styles.modalFactorText, { color: theme.textSecondary }]}>
                    Saves ~4.2 kg CO₂ and 2,700 liters of water used in cotton dyeing.
                  </Text>
                </View>

                <View style={styles.modalFactorItem}>
                  <Text style={[styles.modalFactorTitle, { color: theme.text }]}>
                    📐 Lab Instruments & Tech
                  </Text>
                  <Text style={[styles.modalFactorText, { color: theme.textSecondary }]}>
                    Saves e-waste and precious metals from ending up in city landfills.
                  </Text>
                </View>
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Got it"
              style={[styles.modalCloseButton, { backgroundColor: theme.primary }]}
              onPress={() => setInfoModalVisible(false)}>
              <Text style={styles.modalCloseButtonText}>Got it</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    marginHorizontal: Spacing.four,
    marginBottom: Spacing.three,
  },
  card: {
    borderRadius: Radius.lg,
    paddingVertical: Spacing.three + 2,
    paddingHorizontal: Spacing.four,
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.two + 2,
    gap: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  leafIconBadge: {
    width: 22,
    height: 22,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E5E7EB',
    letterSpacing: 0.2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scopeToggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
    borderRadius: Radius.full,
    padding: 2,
  },
  scopeOption: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  scopeOptionActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  scopeOptionText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  scopeOptionTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  infoButton: {
    padding: 2,
  },
  metricHero: {
    marginBottom: Spacing.two + 2,
  },
  metricHeroLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#86EFAC',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  heroNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
  },
  heroNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  heroUnit: {
    fontSize: 13,
    fontWeight: '600',
    color: '#A7F3D0',
  },
  heroSubtitle: {
    fontSize: 11,
    color: '#D1D5DB',
    marginTop: 1,
  },
  statStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: Radius.md,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
  },
  statCellValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statCellLabel: {
    fontSize: 9,
    color: '#9CA3AF',
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    height: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.five,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: Radius.xl,
    padding: Spacing.five,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  modalIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalContent: {
    gap: Spacing.three,
    marginBottom: Spacing.four,
  },
  modalBody: {
    fontSize: 13,
    lineHeight: 18,
  },
  modalFactorList: {
    gap: Spacing.two,
    marginTop: 4,
  },
  modalFactorItem: {
    padding: Spacing.two,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: Radius.md,
  },
  modalFactorTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  modalFactorText: {
    fontSize: 11,
    lineHeight: 15,
  },
  modalCloseButton: {
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
