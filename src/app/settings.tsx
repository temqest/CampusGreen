import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useThemeContext } from '@/context/theme-context';
import { useItems } from '@/context/items-context';
import { EscrowTransaction } from '@/types/item';
import { supabase } from '@/lib/supabase';
import { fetchProfileFromSupabase, saveProfileToSupabase } from '@/lib/database';
import { ConfirmationModal, ConfirmationType } from '@/components/confirmation-modal';

const GCASH_LOGO = require('@/assets/gcash.svg');
const MAYA_LOGO = require('@/assets/maya.svg');

type CashOutChannel = 'gcash' | 'maya';

export default function SettingsScreen() {
  const theme = useTheme();
  const { themeMode, setThemeMode } = useThemeContext();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    wallet,
    subscription,
    subscribeSeller,
    cancelSubscription,
    refreshItems,
  } = useItems();

  // Student Profile state for saving preferences
  const [profileId, setProfileId] = useState<string>('user_active_student');
  const [profileName, setProfileName] = useState('New Student');
  const [profileDegree, setProfileDegree] = useState('Select Degree Program');
  const [profileYearLevel, setProfileYearLevel] = useState('1st Year');
  const [profileAvatarUri, setProfileAvatarUri] = useState<string | null>(null);

  // Escrow Ledger Modal
  const [isLedgerModalVisible, setIsLedgerModalVisible] = useState(false);

  // Payment Details Modal
  const [isPaymentDetailsModalVisible, setIsPaymentDetailsModalVisible] = useState(false);
  const [defaultPayoutChannel, setDefaultPayoutChannel] = useState<CashOutChannel>('gcash');
  const [defaultPayoutNumber, setDefaultPayoutNumber] = useState('0917 824 5519');
  const [tempPayoutChannel, setTempPayoutChannel] = useState<CashOutChannel>(defaultPayoutChannel);
  const [tempPayoutNumber, setTempPayoutNumber] = useState(defaultPayoutNumber);

  // Change Password Modal
  const [isChangePasswordModalVisible, setIsChangePasswordModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Escrow Explainer Modal
  const [isEscrowGuideVisible, setIsEscrowGuideVisible] = useState(false);

  // Edit Meetup Spot Modal
  const [isEditSpotModalVisible, setIsEditSpotModalVisible] = useState(false);
  const [preferredSpot, setPreferredSpot] = useState('Main Library Ground Floor');
  const [tempSpot, setTempSpot] = useState(preferredSpot);

  // Subscription Modal State
  const [isSubscriptionModalVisible, setIsSubscriptionModalVisible] = useState(false);
  const [selectedSubTier, setSelectedSubTier] = useState<'weekly_boost' | 'semester_pass' | null>(null);
  const [subPaymentMethod, setSubPaymentMethod] = useState<'wallet' | 'gcash' | 'maya' | null>(null);
  const [isProcessingSub, setIsProcessingSub] = useState(false);
  const [subSuccess, setSubSuccess] = useState<{
    referenceCode: string;
    tierName: string;
    method: string;
  } | null>(null);

  // Settings toggles
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isAppearanceModalVisible, setIsAppearanceModalVisible] = useState(false);

  // Action feedback toast
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Custom Confirmation Dialog State (Replaces generic white system alert)
  const [confirmConfig, setConfirmConfig] = useState<{
    visible: boolean;
    type?: ConfirmationType;
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    iconName?: keyof typeof Ionicons.glyphMap;
    onConfirm: () => void;
  }>({
    visible: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  // Load user profile on mount
  useEffect(() => {
    let isMounted = true;

    async function loadActiveProfile() {
      try {
        let activeUserId = 'user_active_student';
        const local = await AsyncStorage.getItem('@campusgreen_user_profile');
        if (local && isMounted) {
          const parsed = JSON.parse(local);
          if (parsed.id) {
            activeUserId = parsed.id;
            setProfileId(parsed.id);
          }
          if (parsed.fullName) setProfileName(parsed.fullName);
          if (parsed.degreeProgram) setProfileDegree(parsed.degreeProgram);
          if (parsed.yearLevel) setProfileYearLevel(parsed.yearLevel);
          if (parsed.avatarUrl) setProfileAvatarUri(parsed.avatarUrl);
          if (parsed.preferredMeetupSpot) {
            setPreferredSpot(parsed.preferredMeetupSpot);
            setTempSpot(parsed.preferredMeetupSpot);
          }
        }

        const p = await fetchProfileFromSupabase(activeUserId);
        if (p && isMounted) {
          setProfileName(p.fullName);
          setProfileDegree(p.degreeProgram);
          setProfileYearLevel(p.yearLevel);
          if (p.avatarUrl) setProfileAvatarUri(p.avatarUrl);
          if (p.preferredMeetupSpot) {
            setPreferredSpot(p.preferredMeetupSpot);
            setTempSpot(p.preferredMeetupSpot);
          }
        }
      } catch (err) {
        console.warn('Error loading settings profile:', err);
      }
    }

    loadActiveProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  // Save Meetup Spot
  const handleSaveMeetupSpot = () => {
    if (tempSpot.trim()) {
      const newSpot = tempSpot.trim();
      setPreferredSpot(newSpot);
      setIsEditSpotModalVisible(false);
      setActionFeedback('Preferred meetup spot updated & saved.');
      setTimeout(() => setActionFeedback(null), 3000);

      saveProfileToSupabase({
        id: profileId,
        fullName: profileName,
        degreeProgram: profileDegree,
        yearLevel: profileYearLevel,
        campus: 'Ateneo de Naga University',
        avatarUrl: profileAvatarUri || undefined,
        preferredMeetupSpot: newSpot,
      }).catch((err) => console.warn('Supabase save spot error:', err));
    }
  };

  // Save Payment Details
  const handleSavePaymentDetails = () => {
    if (!tempPayoutNumber.trim() || tempPayoutNumber.trim().length < 10) {
      Alert.alert('Invalid Mobile Number', 'Please enter a valid 11-digit mobile number.');
      return;
    }
    setDefaultPayoutChannel(tempPayoutChannel);
    setDefaultPayoutNumber(tempPayoutNumber.trim());
    setIsPaymentDetailsModalVisible(false);
    setActionFeedback('Payment and payout details updated.');
    setTimeout(() => setActionFeedback(null), 3000);
  };

  // Change Password
  const handleChangePassword = () => {
    if (!currentPassword) {
      Alert.alert('Required Field', 'Please enter your current password.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      Alert.alert('Password Length', 'New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Password Mismatch', 'New password and confirmation do not match.');
      return;
    }
    setIsChangePasswordModalVisible(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setActionFeedback('Password updated successfully.');
    setTimeout(() => setActionFeedback(null), 3000);
  };

  // Purchase Subscription
  const handleExecuteSubscription = async () => {
    if (!selectedSubTier) {
      Alert.alert('Plan Selection Required', 'Please select either Weekly Sprint Boost or Semester Seller Pass.');
      return;
    }
    if (!subPaymentMethod) {
      Alert.alert('Payment Source Required', 'Please select Escrow Wallet, GCash, or Maya.');
      return;
    }

    setIsProcessingSub(true);
    setTimeout(async () => {
      const result = await subscribeSeller(selectedSubTier, subPaymentMethod, defaultPayoutNumber);
      setIsProcessingSub(false);
      if (result.success) {
        setSubSuccess({
          referenceCode: result.referenceCode || 'CG-SUB-100234',
          tierName: selectedSubTier === 'weekly_boost' ? 'Weekly Sprint Boost' : 'Semester Seller Pass',
          method:
            subPaymentMethod === 'wallet'
              ? 'Escrow Cleared Balance'
              : subPaymentMethod === 'gcash'
              ? 'GCash'
              : 'Maya',
        });
      } else {
        Alert.alert('Subscription Failed', result.error || 'Please try again.');
      }
    }, 700);
  };

  const handleCloseSubscriptionModal = () => {
    setIsSubscriptionModalVisible(false);
    setSelectedSubTier(null);
    setSubPaymentMethod(null);
    setSubSuccess(null);
  };

  // Log Out confirmation (Using Custom Branded Modal)
  const handleSignOut = () => {
    setConfirmConfig({
      visible: true,
      type: 'danger',
      title: 'Log Out?',
      description: 'Are you sure you want to log out of your student account? You will need to log back in with your university credentials.',
      confirmLabel: 'Log Out',
      cancelLabel: 'Stay Signed In',
      iconName: 'log-out-outline',
      onConfirm: async () => {
        setConfirmConfig((prev) => ({ ...prev, visible: false }));
        try {
          await AsyncStorage.removeItem('@campusgreen_user_profile');
          await supabase.auth.signOut().catch(() => {});
          await refreshItems().catch(() => {});
        } catch (e) {
          console.warn('Error clearing profile on logout:', e);
        }
        router.replace('/(auth)/login');
      },
    });
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      {/* Top Navigation Header Row */}
      <View
        style={[
          styles.headerRow,
          {
            paddingTop: insets.top + (Platform.OS === 'ios' ? 8 : 14),
            borderBottomColor: theme.borderSubtle,
            backgroundColor: theme.surface,
          },
        ]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to Profile"
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: theme.surfaceSubtle, borderColor: theme.border }]}>
          <Ionicons name="chevron-back" size={20} color={theme.text} />
        </Pressable>

        <View style={styles.headerTitleGroup}>
          <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
            Settings & Preferences
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]} numberOfLines={1}>
            Account, security & app defaults
          </Text>
        </View>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: insets.bottom + 48,
          },
        ]}>
        {/* Action Feedback Toast */}
        {actionFeedback && (
          <View
            style={[
              styles.feedbackBanner,
              { backgroundColor: theme.badgeGreenBg, borderColor: theme.primary },
            ]}>
            <Ionicons name="checkmark-circle" size={16} color={theme.primary} />
            <Text style={[styles.feedbackBannerText, { color: theme.primaryDark }]}>
              {actionFeedback}
            </Text>
          </View>
        )}

        {/* SECTION 1: ACCOUNT & SECURITY */}
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionHeading, { color: theme.textSecondary }]}>
            ACCOUNT & SECURITY
          </Text>

          <View style={[styles.groupedCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {/* Student Verification Row */}
            <View style={styles.accountRow}>
              <View style={[styles.accountRowIconCircle, { backgroundColor: theme.badgeGreenBg }]}>
                <Ionicons name="school-outline" size={17} color={theme.primary} />
              </View>
              <View style={styles.accountRowContent}>
                <Text style={[styles.accountRowTitle, { color: theme.text }]}>
                  Student Verification
                </Text>
                <Text style={[styles.accountRowValue, { color: theme.primary }]}>
                  Verified • Ateneo de Naga (.edu.ph)
                </Text>
              </View>
              <Ionicons name="checkmark-circle" size={18} color={theme.primary} />
            </View>

            <View style={[styles.rowDivider, { backgroundColor: theme.borderSubtle }]} />

            {/* Payout E-Wallet Details */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Manage linked payout methods"
              style={styles.accountRow}
              onPress={() => {
                setTempPayoutChannel(defaultPayoutChannel);
                setTempPayoutNumber(defaultPayoutNumber);
                setIsPaymentDetailsModalVisible(true);
              }}>
              <View
                style={[
                  styles.accountRowIconCircle,
                  {
                    backgroundColor: defaultPayoutChannel === 'gcash' ? '#EFF6FF' : '#0A1810',
                    borderWidth: 1,
                    borderColor: defaultPayoutChannel === 'gcash' ? '#DBEAFE' : '#183824',
                  },
                ]}>
                <Image
                  source={defaultPayoutChannel === 'gcash' ? GCASH_LOGO : MAYA_LOGO}
                  style={defaultPayoutChannel === 'gcash' ? styles.rowGcashLogo : styles.rowMayaLogo}
                  contentFit="contain"
                />
              </View>
              <View style={styles.accountRowContent}>
                <Text style={[styles.accountRowTitle, { color: theme.text }]}>
                  Payout E-Wallet Details
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 1 }}>
                  <Text style={[styles.accountRowValue, { color: theme.textSecondary }]} numberOfLines={1}>
                    {defaultPayoutNumber}
                  </Text>
                  <View
                    style={[
                      styles.rowChannelBadge,
                      {
                        backgroundColor: defaultPayoutChannel === 'gcash' ? '#EFF6FF' : '#0A1810',
                        borderColor: defaultPayoutChannel === 'gcash' ? '#DBEAFE' : '#183824',
                      },
                    ]}>
                    <Image
                      source={defaultPayoutChannel === 'gcash' ? GCASH_LOGO : MAYA_LOGO}
                      style={defaultPayoutChannel === 'gcash' ? styles.badgeGcashLogo : styles.badgeMayaLogo}
                      contentFit="contain"
                    />
                  </View>
                  <Text style={[styles.accountRowValue, { color: theme.textMuted }]}>
                    (Default)
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={17} color={theme.textMuted} />
            </Pressable>

            <View style={[styles.rowDivider, { backgroundColor: theme.borderSubtle }]} />

            {/* Safe Meetup Spot */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Edit preferred campus safe meetup spot"
              style={styles.accountRow}
              onPress={() => {
                setTempSpot(preferredSpot);
                setIsEditSpotModalVisible(true);
              }}>
              <View style={[styles.accountRowIconCircle, { backgroundColor: theme.badgeGreenBg }]}>
                <Ionicons name="location-outline" size={17} color={theme.primary} />
              </View>
              <View style={styles.accountRowContent}>
                <Text style={[styles.accountRowTitle, { color: theme.text }]}>
                  Safe Meetup Spot
                </Text>
                <Text style={[styles.accountRowValue, { color: theme.textSecondary }]} numberOfLines={1}>
                  {preferredSpot}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={17} color={theme.textMuted} />
            </Pressable>

            <View style={[styles.rowDivider, { backgroundColor: theme.borderSubtle }]} />

            {/* Change Password */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Change student account password"
              style={styles.accountRow}
              onPress={() => {
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setShowPassword(false);
                setIsChangePasswordModalVisible(true);
              }}>
              <View style={[styles.accountRowIconCircle, { backgroundColor: theme.surfaceSubtle }]}>
                <Ionicons name="key-outline" size={17} color={theme.text} />
              </View>
              <View style={styles.accountRowContent}>
                <Text style={[styles.accountRowTitle, { color: theme.text }]}>
                  Change Password
                </Text>
                <Text style={[styles.accountRowValue, { color: theme.textSecondary }]}>
                  Update your student account security credentials
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={17} color={theme.textMuted} />
            </Pressable>
          </View>
        </View>

        {/* SECTION 2: ESCROW & TRANSACTIONS */}
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionHeading, { color: theme.textSecondary }]}>
            ESCROW & TRANSACTIONS
          </Text>

          <View style={[styles.groupedCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {/* Escrow & Payout Ledger */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="View Escrow and Payout Ledger"
              style={styles.accountRow}
              onPress={() => setIsLedgerModalVisible(true)}>
              <View style={[styles.accountRowIconCircle, { backgroundColor: theme.badgeGreenBg }]}>
                <Ionicons name="receipt-outline" size={17} color={theme.primary} />
              </View>
              <View style={styles.accountRowContent}>
                <Text style={[styles.accountRowTitle, { color: theme.text }]}>
                  Escrow & Payout Ledger
                </Text>
                <Text style={[styles.accountRowValue, { color: theme.textSecondary }]}>
                  History of locks, releases & disbursements
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={17} color={theme.textMuted} />
            </Pressable>

            <View style={[styles.rowDivider, { backgroundColor: theme.borderSubtle }]} />

            {/* Escrow Protection Guide */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="View Escrow Protection Guide"
              style={styles.accountRow}
              onPress={() => setIsEscrowGuideVisible(true)}>
              <View style={[styles.accountRowIconCircle, { backgroundColor: theme.surfaceSubtle }]}>
                <Ionicons name="shield-checkmark-outline" size={17} color={theme.text} />
              </View>
              <View style={styles.accountRowContent}>
                <Text style={[styles.accountRowTitle, { color: theme.text }]}>
                  Escrow Protection & 72h Guarantee
                </Text>
                <Text style={[styles.accountRowValue, { color: theme.textSecondary }]}>
                  How your payments and sales are safeguarded
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={17} color={theme.textMuted} />
            </Pressable>
          </View>
        </View>

        {/* SECTION 3: SELLER GROWTH */}
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionHeading, { color: theme.textSecondary }]}>
            SELLER GROWTH & VISIBILITY
          </Text>

          <View style={[styles.groupedCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Manage Campus Boost Seller Subscription"
              style={styles.accountRow}
              onPress={() => {
                setSelectedSubTier(null);
                setSubPaymentMethod(null);
                setIsSubscriptionModalVisible(true);
              }}>
              <View style={[styles.accountRowIconCircle, { backgroundColor: theme.badgeGreenBg }]}>
                <Ionicons name="rocket-outline" size={17} color={theme.primary} />
              </View>
              <View style={styles.accountRowContent}>
                <Text style={[styles.accountRowTitle, { color: theme.text }]}>
                  Campus Boost Subscription
                </Text>
                <Text style={[styles.accountRowValue, { color: subscription.isActive ? theme.primary : theme.textSecondary }]}>
                  {subscription.isActive
                    ? `${subscription.tierName} • Active (${subscription.remainingBumps} bumps left)`
                    : 'Unlock listing bumps & urgent selling tags'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={17} color={theme.textMuted} />
            </Pressable>
          </View>
        </View>

        {/* SECTION 4: APP PREFERENCES */}
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionHeading, { color: theme.textSecondary }]}>
            APP PREFERENCES
          </Text>

          <View style={[styles.groupedCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {/* Handover & Payout Alerts */}
            <View style={styles.accountRow}>
              <View style={[styles.accountRowIconCircle, { backgroundColor: theme.surfaceSubtle }]}>
                <Ionicons name="notifications-outline" size={17} color={theme.text} />
              </View>
              <View style={styles.accountRowContent}>
                <Text style={[styles.accountRowTitle, { color: theme.text }]}>
                  Handover & Payout Alerts
                </Text>
                <Text style={[styles.accountRowValue, { color: theme.textSecondary }]}>
                  Push notices on payouts and meetup arrivals
                </Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: theme.border, true: theme.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={[styles.rowDivider, { backgroundColor: theme.borderSubtle }]} />

            {/* App Appearance */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Change app appearance theme"
              style={styles.accountRow}
              onPress={() => setIsAppearanceModalVisible(true)}>
              <View style={[styles.accountRowIconCircle, { backgroundColor: theme.surfaceSubtle }]}>
                <Ionicons
                  name={themeMode === 'dark' ? 'moon-outline' : themeMode === 'light' ? 'sunny-outline' : 'contrast-outline'}
                  size={17}
                  color={theme.text}
                />
              </View>
              <View style={styles.accountRowContent}>
                <Text style={[styles.accountRowTitle, { color: theme.text }]}>
                  App Appearance
                </Text>
                <Text style={[styles.accountRowValue, { color: theme.textSecondary }]}>
                  {themeMode === 'system' ? 'System Default' : themeMode === 'light' ? 'Light Theme' : 'Dark Theme'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={17} color={theme.textMuted} />
            </Pressable>
          </View>
        </View>

        {/* SECTION 5: ACCOUNT SESSION */}
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionHeading, { color: theme.textSecondary }]}>
            ACCOUNT SESSION
          </Text>

          <View style={[styles.groupedCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Log out of student account"
              style={styles.accountRow}
              onPress={handleSignOut}>
              <View style={[styles.accountRowIconCircle, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="log-out-outline" size={17} color={theme.error} />
              </View>
              <View style={styles.accountRowContent}>
                <Text style={[styles.accountRowTitle, { color: theme.error, fontWeight: '700' }]}>
                  Log Out
                </Text>
                <Text style={[styles.accountRowValue, { color: theme.textSecondary }]}>
                  Sign out of this campus device
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={17} color={theme.textMuted} />
            </Pressable>
          </View>
        </View>

        {/* App Version Stamp */}
        <View style={styles.versionFooter}>
          <Text style={[styles.versionText, { color: theme.textMuted }]}>
            CampusGreen • Ateneo de Naga University
          </Text>
          <Text style={[styles.versionSubtext, { color: theme.textMuted }]}>
            Version 1.2.0 • Build 2026.11
          </Text>
        </View>
      </ScrollView>

      {/* ================= MODAL: ESCROW LEDGER ================= */}
      <Modal
        visible={isLedgerModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsLedgerModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setIsLedgerModalVisible(false)} />

          <View
            style={[
              styles.modalSheet,
              { backgroundColor: theme.surface, maxHeight: '80%', paddingBottom: insets.bottom + 20 },
            ]}>
            <View style={styles.modalDragNotch} />

            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Escrow Ledger</Text>
                <Text style={[styles.modalSub, { color: theme.textSecondary }]}>
                  Locks, releases, and disbursements record
                </Text>
              </View>
              <Pressable onPress={() => setIsLedgerModalVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={22} color={theme.textMuted} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: Spacing.three }}>
              {wallet.transactions.map((tx: EscrowTransaction) => {
                const isCashOut = tx.type === 'cash_out';
                const isPending = tx.status === 'pending';
                const isRelease = tx.type === 'escrow_release';

                return (
                  <View
                    key={tx.id}
                    style={[
                      styles.ledgerTxCard,
                      { backgroundColor: theme.surfaceSubtle, borderColor: theme.borderSubtle },
                    ]}>
                    <View
                      style={[
                        styles.ledgerIconCircle,
                        {
                          backgroundColor: isCashOut
                            ? '#FEE2E2'
                            : isPending
                            ? theme.goldBg
                            : theme.badgeGreenBg,
                        },
                      ]}>
                      <Ionicons
                        name={
                          isCashOut
                            ? 'arrow-up'
                            : isPending
                            ? 'lock-closed'
                            : 'checkmark-circle'
                        }
                        size={16}
                        color={
                          isCashOut ? theme.error : isPending ? theme.gold : theme.primary
                        }
                      />
                    </View>

                    <View style={{ flex: 1, gap: 2 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={[styles.ledgerTxTitle, { color: theme.text }]} numberOfLines={1}>
                          {tx.title}
                        </Text>
                        <Text
                          style={[
                            styles.ledgerTxAmount,
                            {
                              color: isCashOut
                                ? theme.error
                                : isRelease
                                ? theme.primary
                                : theme.text,
                            },
                          ]}>
                          {isCashOut ? '-' : '+'}₱
                          {tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={[styles.ledgerTxSub, { color: theme.textMuted }]}>
                          {tx.referenceCode} • {tx.date}
                        </Text>
                        <Text
                          style={[
                            styles.ledgerTxStatus,
                            { color: isPending ? theme.gold : theme.primary },
                          ]}>
                          {isPending ? 'In Escrow' : 'Completed'}
                        </Text>
                      </View>
                      {tx.notes && (
                        <Text style={[styles.ledgerTxNotes, { color: theme.textSecondary }]}>
                          {tx.notes}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ================= MODAL: PAYMENT DETAILS ================= */}
      <Modal
        visible={isPaymentDetailsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsPaymentDetailsModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setIsPaymentDetailsModalVisible(false)} />
          <View style={[styles.modalSheet, { backgroundColor: theme.surface, paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalDragNotch} />
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Payout E-Wallet Details</Text>
                <Text style={[styles.modalSub, { color: theme.textSecondary }]}>
                  Default disbursement account for cleared escrow funds
                </Text>
              </View>
              <Pressable onPress={() => setIsPaymentDetailsModalVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={22} color={theme.textMuted} />
              </Pressable>
            </View>

            {/* Channel Selection */}
            <Text style={[styles.modalInputLabel, { color: theme.text, marginTop: Spacing.four }]}>
              Default Payout Channel *
            </Text>
            <View style={styles.channelRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Select GCash as default payout channel"
                style={[
                  styles.channelCard,
                  {
                    backgroundColor:
                      tempPayoutChannel === 'gcash' ? theme.primaryLight : theme.surface,
                    borderColor: tempPayoutChannel === 'gcash' ? theme.primary : theme.border,
                  },
                ]}
                onPress={() => setTempPayoutChannel('gcash')}>
                <View style={styles.channelLogoBoxGcash}>
                  <Image
                    source={GCASH_LOGO}
                    style={styles.channelLogoImgGcash}
                    contentFit="contain"
                  />
                </View>
                <Text
                  style={[
                    styles.channelName,
                    {
                      color: tempPayoutChannel === 'gcash' ? theme.primary : theme.text,
                      fontWeight: tempPayoutChannel === 'gcash' ? '700' : '600',
                    },
                  ]}>
                  GCash
                </Text>
                {tempPayoutChannel === 'gcash' && (
                  <Ionicons name="checkmark-circle" size={15} color={theme.primary} />
                )}
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Select Maya as default payout channel"
                style={[
                  styles.channelCard,
                  {
                    backgroundColor:
                      tempPayoutChannel === 'maya' ? theme.primaryLight : theme.surface,
                    borderColor: tempPayoutChannel === 'maya' ? theme.primary : theme.border,
                  },
                ]}
                onPress={() => setTempPayoutChannel('maya')}>
                <View style={styles.channelLogoBoxMaya}>
                  <Image
                    source={MAYA_LOGO}
                    style={styles.channelLogoImgMaya}
                    contentFit="contain"
                  />
                </View>
                <Text
                  style={[
                    styles.channelName,
                    {
                      color: tempPayoutChannel === 'maya' ? theme.primary : theme.text,
                      fontWeight: tempPayoutChannel === 'maya' ? '700' : '600',
                    },
                  ]}>
                  Maya
                </Text>
                {tempPayoutChannel === 'maya' && (
                  <Ionicons name="checkmark-circle" size={15} color={theme.primary} />
                )}
              </Pressable>
            </View>

            {/* Mobile number */}
            <Text style={[styles.modalInputLabel, { color: theme.text, marginTop: Spacing.three }]}>
              Registered E-Wallet Mobile Number *
            </Text>
            <View
              style={[
                styles.modalInputContainer,
                { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
              ]}>
              <Text style={[styles.countryCode, { color: theme.textMuted }]}>+63</Text>
              <TextInput
                style={[styles.modalTextInput, { color: theme.text }]}
                placeholder="917 824 5519"
                placeholderTextColor={theme.textMuted}
                keyboardType="phone-pad"
                value={tempPayoutNumber}
                onChangeText={setTempPayoutNumber}
              />
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Save payout details"
              style={[styles.modalPrimaryActionBtn, { backgroundColor: theme.primary, marginTop: Spacing.four }]}
              onPress={handleSavePaymentDetails}>
              <Text style={styles.modalPrimaryActionText}>Save Payout Details</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ================= MODAL: EDIT MEETUP SPOT ================= */}
      <Modal
        visible={isEditSpotModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsEditSpotModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setIsEditSpotModalVisible(false)} />
          <View style={[styles.modalSheet, { backgroundColor: theme.surface, paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalDragNotch} />
            <Text style={[styles.modalTitle, { color: theme.text }]}>Preferred Meetup Spot</Text>
            <Text style={[styles.modalSub, { color: theme.textSecondary }]}>
              Designate a safe campus zone for physical item handovers
            </Text>

            <View
              style={[
                styles.modalInputContainer,
                { backgroundColor: theme.surfaceSubtle, borderColor: theme.border, marginTop: Spacing.four },
              ]}>
              <Ionicons name="location-outline" size={18} color={theme.primary} style={{ marginRight: 8 }} />
              <TextInput
                style={[styles.modalTextInput, { color: theme.text }]}
                value={tempSpot}
                onChangeText={setTempSpot}
                placeholder="e.g. Alingal Hall Tourism Lobby, Library Ground Floor"
                placeholderTextColor={theme.textMuted}
              />
            </View>

            <View style={styles.quickSpotChipsRow}>
              {['Alingal Hall Tourism Lobby', 'Main Library Ground Floor', 'Gate 1 Security Post'].map((spot) => (
                <Pressable
                  key={spot}
                  style={[
                    styles.quickSpotChip,
                    { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
                  ]}
                  onPress={() => setTempSpot(spot)}>
                  <Text style={[styles.quickSpotChipText, { color: theme.text }]}>{spot}</Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Save meetup spot"
              style={[styles.modalPrimaryActionBtn, { backgroundColor: theme.primary, marginTop: Spacing.four }]}
              onPress={handleSaveMeetupSpot}>
              <Text style={styles.modalPrimaryActionText}>Save Preferred Spot</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ================= MODAL: CHANGE PASSWORD ================= */}
      <Modal
        visible={isChangePasswordModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsChangePasswordModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setIsChangePasswordModalVisible(false)} />
          <View style={[styles.modalSheet, { backgroundColor: theme.surface, paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalDragNotch} />
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Change Password</Text>
                <Text style={[styles.modalSub, { color: theme.textSecondary }]}>
                  Keep your student institutional account safe
                </Text>
              </View>
              <Pressable onPress={() => setIsChangePasswordModalVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={22} color={theme.textMuted} />
              </Pressable>
            </View>

            {/* Current Password */}
            <Text style={[styles.modalInputLabel, { color: theme.text, marginTop: Spacing.four }]}>
              Current Password *
            </Text>
            <View
              style={[
                styles.modalInputContainer,
                { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
              ]}>
              <TextInput
                style={[styles.modalTextInput, { color: theme.text }]}
                placeholder="Enter current password"
                placeholderTextColor={theme.textMuted}
                secureTextEntry={!showPassword}
                value={currentPassword}
                onChangeText={setCurrentPassword}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={theme.textMuted}
                />
              </Pressable>
            </View>

            {/* New Password */}
            <Text style={[styles.modalInputLabel, { color: theme.text, marginTop: Spacing.three }]}>
              New Password (minimum 6 characters) *
            </Text>
            <View
              style={[
                styles.modalInputContainer,
                { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
              ]}>
              <TextInput
                style={[styles.modalTextInput, { color: theme.text }]}
                placeholder="Enter new password"
                placeholderTextColor={theme.textMuted}
                secureTextEntry={!showPassword}
                value={newPassword}
                onChangeText={setNewPassword}
              />
            </View>

            {/* Confirm Password */}
            <Text style={[styles.modalInputLabel, { color: theme.text, marginTop: Spacing.three }]}>
              Confirm New Password *
            </Text>
            <View
              style={[
                styles.modalInputContainer,
                { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
              ]}>
              <TextInput
                style={[styles.modalTextInput, { color: theme.text }]}
                placeholder="Re-type new password"
                placeholderTextColor={theme.textMuted}
                secureTextEntry={!showPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Update password"
              style={[styles.modalPrimaryActionBtn, { backgroundColor: theme.primary, marginTop: Spacing.four }]}
              onPress={handleChangePassword}>
              <Text style={styles.modalPrimaryActionText}>Update Password</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ================= MODAL: ESCROW GUIDE ================= */}
      <Modal
        visible={isEscrowGuideVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsEscrowGuideVisible(false)}>
        <View style={styles.centerModalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setIsEscrowGuideVisible(false)} />
          <View style={[styles.dialogBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.dialogIconBox, { backgroundColor: theme.badgeGreenBg }]}>
              <Ionicons name="shield-checkmark" size={30} color={theme.primary} />
            </View>
            <Text style={[styles.dialogTitle, { color: theme.text }]}>
              Escrow Protection
            </Text>
            <Text style={[styles.dialogBody, { color: theme.textSecondary }]}>
              1. <Text style={{ fontWeight: '700', color: theme.text }}>Lock in Escrow:</Text> When a
              buyer pays digitally via GCash or Maya, payment is safely held in platform escrow.
              {'\n\n'}
              2. <Text style={{ fontWeight: '700', color: theme.text }}>Safe Meetup Inspection:</Text>{' '}
              Buyer and seller meet at the designated campus meetup spot. Buyer inspects the textbook, scrubs, or gadget.
              {'\n\n'}
              3. <Text style={{ fontWeight: '700', color: theme.text }}>Instant Release:</Text> Once
              handed over, buyer taps confirm, or the 72-hour inspection window finishes.
              Funds immediately become Available for Cash-Out to GCash/Maya with ₱0 fees.
            </Text>
            <Pressable
              style={[styles.dialogBtn, { backgroundColor: theme.primary }]}
              onPress={() => setIsEscrowGuideVisible(false)}>
              <Text style={styles.dialogBtnText}>Got it</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ================= MODAL: CAMPUS BOOST SUBSCRIPTION ================= */}
      <Modal
        visible={isSubscriptionModalVisible}
        transparent
        animationType="slide"
        onRequestClose={handleCloseSubscriptionModal}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={handleCloseSubscriptionModal} />
          <View
            style={[
              styles.modalSheet,
              { backgroundColor: theme.surface, paddingBottom: insets.bottom + 20 },
            ]}>
            <View style={styles.modalDragNotch} />

            <View style={styles.subModalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.subModalTitle, { color: theme.text }]}>
                  Campus Boost Subscription
                </Text>
                <Text style={[styles.subModalSubtitle, { color: theme.textSecondary }]}>
                  Promote items with listing bumps & urgent selling tags
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close subscription modal"
                onPress={handleCloseSubscriptionModal}
                style={styles.modalCloseBtn}>
                <Ionicons name="close" size={22} color={theme.textMuted} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 520 }}>
              {subSuccess ? (
                <View style={styles.subSuccessBox}>
                  <View style={[styles.subSuccessIconCircle, { backgroundColor: theme.badgeGreenBg }]}>
                    <Ionicons name="checkmark-circle" size={42} color={theme.primary} />
                  </View>
                  <Text style={[styles.subSuccessTitle, { color: theme.text }]}>
                    Boost Activated!
                  </Text>
                  <Text style={[styles.subSuccessDesc, { color: theme.textSecondary }]}>
                    You are now subscribed to {subSuccess.tierName}. Your listing bumps and urgent badges are immediately ready to use.
                  </Text>

                  <View
                    style={[
                      styles.subReceiptCard,
                      { backgroundColor: theme.surfaceSubtle, borderColor: theme.borderSubtle },
                    ]}>
                    <View style={styles.subReceiptRow}>
                      <Text style={[styles.subReceiptLabel, { color: theme.textSecondary }]}>Ref Code</Text>
                      <Text style={[styles.subReceiptVal, { color: theme.text, fontWeight: '700' }]}>
                        {subSuccess.referenceCode}
                      </Text>
                    </View>
                    <View style={styles.subReceiptRow}>
                      <Text style={[styles.subReceiptLabel, { color: theme.textSecondary }]}>Payment Source</Text>
                      <Text style={[styles.subReceiptVal, { color: theme.text }]}>
                        {subSuccess.method}
                      </Text>
                    </View>
                    <View style={styles.subReceiptRow}>
                      <Text style={[styles.subReceiptLabel, { color: theme.textSecondary }]}>Status</Text>
                      <Text style={[styles.subReceiptVal, { color: theme.primary, fontWeight: '700' }]}>
                        Active
                      </Text>
                    </View>
                  </View>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Done"
                    style={[styles.modalPrimaryActionBtn, { backgroundColor: theme.primary, marginTop: 16 }]}
                    onPress={handleCloseSubscriptionModal}>
                    <Text style={styles.modalPrimaryActionText}>Done</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={{ gap: 16 }}>
                  {subscription.isActive && (
                    <View
                      style={[
                        styles.subCurrentPlanNotice,
                        { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
                      ]}>
                      <Ionicons name="information-circle" size={16} color={theme.text} />
                      <Text style={[styles.subCurrentPlanNoticeText, { color: theme.textSecondary }]}>
                        Currently on <Text style={{ fontWeight: '700', color: theme.text }}>{subscription.tierName}</Text> ({subscription.remainingBumps} bumps, {subscription.remainingUrgentBadges} urgent tags left). Upgrading extends your benefits!
                      </Text>
                    </View>
                  )}

                  <View>
                    <Text style={[styles.subSectionTitle, { color: theme.textSecondary }]}>
                      1. CHOOSE YOUR PLAN
                    </Text>

                    <View style={{ gap: 10, marginTop: 8 }}>
                      <Pressable
                        accessibilityRole="radio"
                        accessibilityState={{ selected: selectedSubTier === 'weekly_boost' }}
                        accessibilityLabel="Weekly Sprint Boost, 29 pesos per week"
                        style={[
                          styles.subTierOptionCard,
                          {
                            backgroundColor: selectedSubTier === 'weekly_boost' ? theme.surfaceSubtle : theme.surface,
                            borderColor: selectedSubTier === 'weekly_boost' ? theme.primary : theme.border,
                            borderWidth: selectedSubTier === 'weekly_boost' ? 2 : 1,
                          },
                        ]}
                        onPress={() => setSelectedSubTier('weekly_boost')}>
                        <View style={styles.subTierOptionHeader}>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.subTierOptionName, { color: theme.text }]}>
                              Weekly Sprint Boost
                            </Text>
                            <Text style={[styles.subTierOptionDuration, { color: theme.textSecondary }]}>
                              7-day quick seller pass
                            </Text>
                          </View>
                          <View style={styles.subTierPriceCol}>
                            <Text style={[styles.subTierPrice, { color: theme.text }]}>₱29</Text>
                            <Text style={[styles.subTierPricePeriod, { color: theme.textMuted }]}>/week</Text>
                          </View>
                        </View>
                        <View style={[styles.subTierPerksList, { borderTopColor: theme.borderSubtle }]}>
                          <View style={styles.subTierPerkRow}>
                            <Ionicons name="checkmark" size={14} color={theme.primary} />
                            <Text style={[styles.subTierPerkText, { color: theme.text }]}>
                              <Text style={{ fontWeight: '700' }}>5 Listing Bumps</Text> to jump to top of feed
                            </Text>
                          </View>
                          <View style={styles.subTierPerkRow}>
                            <Ionicons name="checkmark" size={14} color={theme.primary} />
                            <Text style={[styles.subTierPerkText, { color: theme.text }]}>
                              <Text style={{ fontWeight: '700' }}>2 Urgent Badges</Text> for rapid disposal
                            </Text>
                          </View>
                        </View>
                      </Pressable>

                      <Pressable
                        accessibilityRole="radio"
                        accessibilityState={{ selected: selectedSubTier === 'semester_pass' }}
                        accessibilityLabel="Semester Seller Pass, 89 pesos per term"
                        style={[
                          styles.subTierOptionCard,
                          {
                            backgroundColor: selectedSubTier === 'semester_pass' ? theme.surfaceSubtle : theme.surface,
                            borderColor: selectedSubTier === 'semester_pass' ? theme.primary : theme.border,
                            borderWidth: selectedSubTier === 'semester_pass' ? 2 : 1,
                          },
                        ]}
                        onPress={() => setSelectedSubTier('semester_pass')}>
                        <View style={styles.subTierOptionHeader}>
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <Text style={[styles.subTierOptionName, { color: theme.text }]}>
                                Semester Seller Pass
                              </Text>
                              <View style={[styles.bestValueTag, { backgroundColor: theme.primary }]}>
                                <Text style={styles.bestValueTagText}>BEST VALUE</Text>
                              </View>
                            </View>
                            <Text style={[styles.subTierOptionDuration, { color: theme.textSecondary }]}>
                              Full 4-month term visibility
                            </Text>
                          </View>
                          <View style={styles.subTierPriceCol}>
                            <Text style={[styles.subTierPrice, { color: theme.text }]}>₱89</Text>
                            <Text style={[styles.subTierPricePeriod, { color: theme.textMuted }]}>/term</Text>
                          </View>
                        </View>
                        <View style={[styles.subTierPerksList, { borderTopColor: theme.borderSubtle }]}>
                          <View style={styles.subTierPerkRow}>
                            <Ionicons name="checkmark" size={14} color={theme.primary} />
                            <Text style={[styles.subTierPerkText, { color: theme.text }]}>
                              <Text style={{ fontWeight: '700' }}>25 Listing Bumps</Text> across campus
                            </Text>
                          </View>
                          <View style={styles.subTierPerkRow}>
                            <Ionicons name="checkmark" size={14} color={theme.primary} />
                            <Text style={[styles.subTierPerkText, { color: theme.text }]}>
                              <Text style={{ fontWeight: '700' }}>10 Urgent Badges</Text> for rapid sales
                            </Text>
                          </View>
                        </View>
                      </Pressable>
                    </View>
                  </View>

                  {/* Payment Method */}
                  <View>
                    <Text style={[styles.subSectionTitle, { color: theme.textSecondary }]}>
                      2. PAYMENT METHOD
                    </Text>

                    <View style={{ gap: 8, marginTop: 8 }}>
                      <Pressable
                        accessibilityRole="radio"
                        accessibilityState={{ selected: subPaymentMethod === 'wallet' }}
                        style={[
                          styles.subPaymentMethodCard,
                          {
                            backgroundColor: subPaymentMethod === 'wallet' ? theme.surfaceSubtle : theme.surface,
                            borderColor: subPaymentMethod === 'wallet' ? theme.primary : theme.border,
                            borderWidth: subPaymentMethod === 'wallet' ? 2 : 1,
                          },
                        ]}
                        onPress={() => setSubPaymentMethod('wallet')}>
                        <View style={[styles.subPaymentIconCircle, { backgroundColor: theme.badgeGreenBg }]}>
                          <Ionicons name="shield-checkmark" size={16} color={theme.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.subPaymentTitle, { color: theme.text }]}>
                            Escrow Cleared Balance
                          </Text>
                          <Text style={[styles.subPaymentSub, { color: theme.textSecondary }]}>
                            ₱{wallet.availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })} available
                          </Text>
                        </View>
                        <Ionicons
                          name={subPaymentMethod === 'wallet' ? 'radio-button-on' : 'radio-button-off'}
                          size={18}
                          color={subPaymentMethod === 'wallet' ? theme.primary : theme.textMuted}
                        />
                      </Pressable>

                      <Pressable
                        accessibilityRole="radio"
                        accessibilityState={{ selected: subPaymentMethod === 'gcash' }}
                        style={[
                          styles.subPaymentMethodCard,
                          {
                            backgroundColor: subPaymentMethod === 'gcash' ? theme.surfaceSubtle : theme.surface,
                            borderColor: subPaymentMethod === 'gcash' ? theme.primary : theme.border,
                            borderWidth: subPaymentMethod === 'gcash' ? 2 : 1,
                          },
                        ]}
                        onPress={() => setSubPaymentMethod('gcash')}>
                        <View style={[styles.subPaymentIconCircle, { backgroundColor: '#EFF6FF', borderColor: '#DBEAFE', borderWidth: 1 }]}>
                          <Image source={GCASH_LOGO} style={{ width: 22, height: 22 }} contentFit="contain" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.subPaymentTitle, { color: theme.text }]}>
                            GCash
                          </Text>
                          <Text style={[styles.subPaymentSub, { color: theme.textSecondary }]}>
                            Instant mobile wallet checkout
                          </Text>
                        </View>
                        <Ionicons
                          name={subPaymentMethod === 'gcash' ? 'radio-button-on' : 'radio-button-off'}
                          size={18}
                          color={subPaymentMethod === 'gcash' ? theme.primary : theme.textMuted}
                        />
                      </Pressable>

                      <Pressable
                        accessibilityRole="radio"
                        accessibilityState={{ selected: subPaymentMethod === 'maya' }}
                        style={[
                          styles.subPaymentMethodCard,
                          {
                            backgroundColor: subPaymentMethod === 'maya' ? theme.surfaceSubtle : theme.surface,
                            borderColor: subPaymentMethod === 'maya' ? theme.primary : theme.border,
                            borderWidth: subPaymentMethod === 'maya' ? 2 : 1,
                          },
                        ]}
                        onPress={() => setSubPaymentMethod('maya')}>
                        <View style={[styles.subPaymentIconCircle, { backgroundColor: '#0A1810', borderColor: '#183824', borderWidth: 1 }]}>
                          <Image source={MAYA_LOGO} style={{ width: 22, height: 22 }} contentFit="contain" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.subPaymentTitle, { color: theme.text }]}>
                            Maya
                          </Text>
                          <Text style={[styles.subPaymentSub, { color: theme.textSecondary }]}>
                            Scan to pay or linked mobile account
                          </Text>
                        </View>
                        <Ionicons
                          name={subPaymentMethod === 'maya' ? 'radio-button-on' : 'radio-button-off'}
                          size={18}
                          color={subPaymentMethod === 'maya' ? theme.primary : theme.textMuted}
                        />
                      </Pressable>
                    </View>
                  </View>

                  <View style={{ marginTop: 8 }}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Subscribe and activate boost"
                      disabled={isProcessingSub || !selectedSubTier || !subPaymentMethod}
                      style={[
                        styles.modalPrimaryActionBtn,
                        {
                          backgroundColor:
                            !selectedSubTier || !subPaymentMethod
                              ? theme.border
                              : theme.primary,
                        },
                      ]}
                      onPress={handleExecuteSubscription}>
                      {isProcessingSub ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <Ionicons name="rocket-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                          <Text style={styles.modalPrimaryActionText}>
                            {selectedSubTier
                              ? `Pay ₱${selectedSubTier === 'weekly_boost' ? '29.00' : '89.00'} & Activate Boost`
                              : 'Select a Plan to Continue'}
                          </Text>
                        </>
                      )}
                    </Pressable>

                    {subscription.isActive && (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Cancel active subscription"
                        style={{ alignItems: 'center', marginTop: 12, paddingVertical: 6 }}
                        onPress={() => {
                          setConfirmConfig({
                            visible: true,
                            type: 'warning',
                            title: 'Cancel Campus Boost?',
                            description: 'Are you sure you want to cancel your Campus Boost subscription? Your remaining bumps and badges will be cleared immediately.',
                            confirmLabel: 'Cancel Plan',
                            cancelLabel: 'Keep Plan',
                            iconName: 'alert-circle-outline',
                            onConfirm: () => {
                              setConfirmConfig((prev) => ({ ...prev, visible: false }));
                              cancelSubscription();
                              handleCloseSubscriptionModal();
                              setActionFeedback('Subscription cancelled.');
                              setTimeout(() => setActionFeedback(null), 3000);
                            },
                          });
                        }}>
                        <Text style={{ fontSize: 13, color: theme.error, fontWeight: '600' }}>
                          Cancel Campus Boost Subscription
                        </Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ================= MODAL: APP APPEARANCE ================= */}
      <Modal
        visible={isAppearanceModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsAppearanceModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setIsAppearanceModalVisible(false)} />
          <View style={[styles.modalSheet, { backgroundColor: theme.surface, paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalDragNotch} />
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={[styles.modalTitle, { color: theme.text }]}>App Appearance</Text>
                <Text style={[styles.modalSub, { color: theme.textSecondary }]}>
                  Choose how CampusGreen looks on this device
                </Text>
              </View>
              <Pressable onPress={() => setIsAppearanceModalVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={22} color={theme.textMuted} />
              </Pressable>
            </View>

            <View style={{ gap: Spacing.two, marginTop: Spacing.four }}>
              {[
                {
                  id: 'system' as const,
                  title: 'System Default',
                  desc: 'Automatically matches your device display settings',
                  icon: 'phone-portrait-outline' as const,
                },
                {
                  id: 'light' as const,
                  title: 'Light Theme',
                  desc: 'Classic ivory background with forest academic green',
                  icon: 'sunny-outline' as const,
                },
                {
                  id: 'dark' as const,
                  title: 'Dark Theme',
                  desc: 'Soft dark charcoal tones for low-light campus reading',
                  icon: 'moon-outline' as const,
                },
              ].map((opt) => {
                const isSelected = themeMode === opt.id;
                return (
                  <Pressable
                    key={opt.id}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={`${opt.title} option`}
                    style={[
                      styles.appearanceOptionCard,
                      {
                        backgroundColor: isSelected ? theme.primaryLight : theme.surfaceSubtle,
                        borderColor: isSelected ? theme.primary : theme.border,
                      },
                    ]}
                    onPress={() => {
                      setThemeMode(opt.id);
                      setActionFeedback(`App appearance set to ${opt.title}`);
                      setTimeout(() => setActionFeedback(null), 3000);
                      setIsAppearanceModalVisible(false);
                    }}>
                    <View
                      style={[
                        styles.accountRowIconCircle,
                        {
                          backgroundColor: isSelected ? theme.badgeGreenBg : theme.surface,
                        },
                      ]}>
                      <Ionicons
                        name={opt.icon}
                        size={18}
                        color={isSelected ? theme.primary : theme.text}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.appearanceOptionTitle,
                          {
                            color: isSelected ? theme.primaryDark : theme.text,
                            fontWeight: isSelected ? '700' : '600',
                          },
                        ]}>
                        {opt.title}
                      </Text>
                      <Text style={[styles.appearanceOptionDesc, { color: theme.textSecondary }]}>
                        {opt.desc}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.radioIndicator,
                        {
                          borderColor: isSelected ? theme.primary : theme.border,
                          backgroundColor: isSelected ? theme.primary : 'transparent',
                        },
                      ]}>
                      {isSelected && <Ionicons name="checkmark" size={13} color="#FFFFFF" />}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>

      {/* ================= CUSTOM THEMED CONFIRMATION MODAL ================= */}
      <ConfirmationModal
        visible={confirmConfig.visible}
        type={confirmConfig.type}
        title={confirmConfig.title}
        description={confirmConfig.description}
        confirmLabel={confirmConfig.confirmLabel}
        cancelLabel={confirmConfig.cancelLabel}
        iconName={confirmConfig.iconName}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig((prev) => ({ ...prev, visible: false }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleGroup: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginBottom: Spacing.three,
    gap: 8,
  },
  feedbackBannerText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  sectionBlock: {
    marginBottom: Spacing.four,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  groupedCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: 14,
    gap: 12,
  },
  accountRowIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountRowContent: {
    flex: 1,
  },
  accountRowTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  accountRowValue: {
    fontSize: 12,
    marginTop: 2,
  },
  rowDivider: {
    height: 1,
    marginLeft: 58,
  },
  rowGcashLogo: {
    width: 20,
    height: 20,
  },
  rowMayaLogo: {
    width: 20,
    height: 20,
  },
  rowChannelBadge: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
  },
  badgeGcashLogo: {
    width: 14,
    height: 14,
  },
  badgeMayaLogo: {
    width: 14,
    height: 14,
  },
  versionFooter: {
    alignItems: 'center',
    paddingVertical: Spacing.four,
    gap: 4,
  },
  versionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  versionSubtext: {
    fontSize: 11,
  },

  // Modal Common Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Spacing.four,
    paddingTop: 12,
  },
  modalDragNotch: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(150,150,150,0.4)',
    alignSelf: 'center',
    marginBottom: 14,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalSub: {
    fontSize: 13,
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalInputLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  modalInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 48,
  },
  modalTextInput: {
    flex: 1,
    fontSize: 14,
  },
  countryCode: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 6,
  },
  channelRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  channelCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: 8,
  },
  channelLogoBoxGcash: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  channelLogoImgGcash: {
    width: 18,
    height: 18,
  },
  channelLogoBoxMaya: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: '#0A1810',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#183824',
  },
  channelLogoImgMaya: {
    width: 18,
    height: 18,
  },
  channelName: {
    fontSize: 13,
    flex: 1,
  },
  quickSpotChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  quickSpotChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  quickSpotChipText: {
    fontSize: 12,
  },
  modalPrimaryActionBtn: {
    height: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  modalPrimaryActionText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  // Center Dialog Explainer
  centerModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  dialogBox: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
  },
  dialogIconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
  },
  dialogBody: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 20,
  },
  dialogBtn: {
    width: '100%',
    height: 46,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // Ledger Cards
  ledgerTxCard: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginBottom: 8,
    gap: 10,
  },
  ledgerIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ledgerTxTitle: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  ledgerTxAmount: {
    fontSize: 13,
    fontWeight: '700',
  },
  ledgerTxSub: {
    fontSize: 11,
  },
  ledgerTxStatus: {
    fontSize: 11,
    fontWeight: '600',
  },
  ledgerTxNotes: {
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 2,
  },

  // Subscription Modal Styles
  subModalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  subModalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  subModalSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  subCurrentPlanNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  subCurrentPlanNoticeText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 17,
  },
  subSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  subTierOptionCard: {
    padding: 12,
    borderRadius: Radius.md,
    gap: 10,
  },
  subTierOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subTierOptionName: {
    fontSize: 15,
    fontWeight: '700',
  },
  subTierOptionDuration: {
    fontSize: 12,
    marginTop: 1,
  },
  subTierPriceCol: {
    alignItems: 'flex-end',
  },
  subTierPrice: {
    fontSize: 18,
    fontWeight: '800',
  },
  subTierPricePeriod: {
    fontSize: 11,
  },
  bestValueTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  bestValueTagText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  subTierPerksList: {
    borderTopWidth: 1,
    paddingTop: 8,
    gap: 4,
  },
  subTierPerkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  subTierPerkText: {
    fontSize: 12,
  },
  subPaymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: Radius.md,
    gap: 10,
  },
  subPaymentIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subPaymentTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  subPaymentSub: {
    fontSize: 11,
    marginTop: 1,
  },
  subSuccessBox: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  subSuccessIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  subSuccessTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
  },
  subSuccessDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  subReceiptCard: {
    width: '100%',
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: 12,
    gap: 8,
    marginBottom: 16,
  },
  subReceiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subReceiptLabel: {
    fontSize: 12,
  },
  subReceiptVal: {
    fontSize: 12,
  },

  // Appearance Option Card
  appearanceOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: 12,
  },
  appearanceOptionTitle: {
    fontSize: 14,
  },
  appearanceOptionDesc: {
    fontSize: 12,
    marginTop: 1,
  },
  radioIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
