import React from 'react';
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

export type ConfirmationType = 'danger' | 'warning' | 'info' | 'success';

export interface ConfirmationModalProps {
  visible: boolean;
  type?: ConfirmationType;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  iconName?: keyof typeof Ionicons.glyphMap;
}

export function ConfirmationModal({
  visible,
  type = 'danger',
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmDestructive = false,
  onConfirm,
  onCancel,
  iconName,
}: ConfirmationModalProps) {
  const theme = useTheme();

  if (!visible) return null;

  // Visual accents depending on modal type
  const isDanger = type === 'danger' || confirmDestructive;
  const isWarning = type === 'warning';
  const isSuccess = type === 'success';

  const accentColor = isDanger
    ? theme.error || '#DC2626'
    : isWarning
    ? theme.gold || '#D97706'
    : isSuccess
    ? theme.primary
    : theme.primary;

  const accentBg = isDanger
    ? theme.errorBg || '#FEE2E2'
    : isWarning
    ? theme.goldBg || '#FEF3C7'
    : isSuccess
    ? theme.badgeGreenBg || '#E6EFE9'
    : theme.primaryLight || '#E6EFE9';

  const defaultIcon: keyof typeof Ionicons.glyphMap = isDanger
    ? 'trash-outline'
    : isWarning
    ? 'alert-circle-outline'
    : isSuccess
    ? 'checkmark-circle-outline'
    : 'information-circle-outline';

  const resolvedIcon = iconName || defaultIcon;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss confirmation"
          style={StyleSheet.absoluteFill}
          onPress={onCancel}
        />

        <View
          style={[
            styles.dialogCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}>
          {/* Circular Motif Icon */}
          <View style={[styles.iconCircle, { backgroundColor: accentBg }]}>
            <Ionicons name={resolvedIcon} size={28} color={accentColor} />
          </View>

          {/* Title & Description */}
          <Text style={[styles.title, { color: theme.text }]}>
            {title}
          </Text>
          <Text style={[styles.description, { color: theme.textSecondary }]}>
            {description}
          </Text>

          {/* Action Button Row */}
          <View style={styles.actionRow}>
            {/* Cancel Button */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={cancelLabel}
              onPress={onCancel}
              style={({ pressed }) => [
                styles.cancelButton,
                {
                  backgroundColor: theme.surfaceSubtle,
                  borderColor: theme.border,
                  opacity: pressed ? 0.75 : 1,
                },
              ]}>
              <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>
                {cancelLabel}
              </Text>
            </Pressable>

            {/* Confirm / Action Button */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={confirmLabel}
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.confirmButton,
                {
                  backgroundColor: accentColor,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}>
              <Text style={styles.confirmButtonText}>
                {confirmLabel}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.four + 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 8,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: Spacing.two - 2,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: Spacing.four + 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.two + 2,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    height: 44,
    borderRadius: Radius.lg,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    height: 44,
    borderRadius: Radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

