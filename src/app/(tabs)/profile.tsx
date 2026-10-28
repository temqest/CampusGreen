import React, { useState } from 'react';
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
import * as ImagePicker from 'expo-image-picker';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useThemeContext } from '@/context/theme-context';
import { useItems } from '@/context/items-context';
import { INITIAL_GREEN_IMPACT } from '@/data/mock-items';
import { EscrowTransaction, MarketplaceItem } from '@/types/item';

const GCASH_LOGO = require('@/assets/gcash.svg');
const MAYA_LOGO = require('@/assets/maya.svg');

const AVATAR_PRESETS = [
  {
    title: 'Student 1',
    uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80',
  },
  {
    title: 'Student 2',
    uri: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&q=80',
  },
  {
    title: 'Student 3',
    uri: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&q=80',
  },
  {
    title: 'Student 4',
    uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
  },
];

const YEAR_LEVEL_OPTIONS = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Graduate'];

type ListingTab = 'active' | 'sold' | 'purchases';
type CashOutChannel = 'gcash' | 'maya';

export default function ProfileScreen() {
  const theme = useTheme();
  const { themeMode, setThemeMode } = useThemeContext();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    items,
    bumpItem,
    toggleUrgent,
    setItemStatus,
    deleteItem,
    wallet,
    cashOut,
  } = useItems();

  // Content tab: Active Listings, Sold, Purchases
  const [activeTab, setActiveTab] = useState<ListingTab>('active');

  // Listing Management Modal (Replaces cramped 5-button card dock)
  const [manageItem, setManageItem] = useState<MarketplaceItem | null>(null);

  // Cash-Out Modal State (Clean Slate Invariant: starts unselected null)
  const [isCashOutModalVisible, setIsCashOutModalVisible] = useState(false);
  const [cashOutChannel, setCashOutChannel] = useState<CashOutChannel | null>(null);
  const [cashOutAmount, setCashOutAmount] = useState('');
  const [cashOutAccount, setCashOutAccount] = useState('');
  const [isProcessingCashOut, setIsProcessingCashOut] = useState(false);
  const [cashOutSuccess, setCashOutSuccess] = useState<{
    referenceCode: string;
    amount: number;
    channel: string;
  } | null>(null);

  // Escrow Ledger Modal (Moved to Preferences)
  const [isLedgerModalVisible, setIsLedgerModalVisible] = useState(false);

  // Payment Details Modal State
  const [isPaymentDetailsModalVisible, setIsPaymentDetailsModalVisible] = useState(false);
  const [defaultPayoutChannel, setDefaultPayoutChannel] = useState<CashOutChannel>('gcash');
  const [defaultPayoutNumber, setDefaultPayoutNumber] = useState('0917 824 5519');
  const [tempPayoutChannel, setTempPayoutChannel] = useState<CashOutChannel>(defaultPayoutChannel);
  const [tempPayoutNumber, setTempPayoutNumber] = useState(defaultPayoutNumber);

  // Change Password Modal State
  const [isChangePasswordModalVisible, setIsChangePasswordModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Escrow Explainer Modal
  const [isEscrowGuideVisible, setIsEscrowGuideVisible] = useState(false);

  // Edit Meetup Spot Modal
  const [isEditSpotModalVisible, setIsEditSpotModalVisible] = useState(false);
  const [preferredSpot, setPreferredSpot] = useState('Nursing Bldg Lobby (Burns Hall)');
  const [tempSpot, setTempSpot] = useState(preferredSpot);

  // Student Profile Identity State
  const [profileName, setProfileName] = useState('Maria Santos');
  const [profileDegree, setProfileDegree] = useState('BS Nursing');
  const [profileYearLevel, setProfileYearLevel] = useState('3rd Year');
  const [profileAvatarUri, setProfileAvatarUri] = useState<string | null>(null);

  // Edit Profile Details Modal State
  const [isEditProfileModalVisible, setIsEditProfileModalVisible] = useState(false);
  const [tempProfileName, setTempProfileName] = useState(profileName);
  const [tempProfileDegree, setTempProfileDegree] = useState(profileDegree);
  const [tempProfileYearLevel, setTempProfileYearLevel] = useState(profileYearLevel);
  const [tempAvatarUri, setTempAvatarUri] = useState<string | null>(profileAvatarUri);

  // Profile Photo Picker Modal State (Same file picker found in sell)
  const [isPhotoPickerModalVisible, setIsPhotoPickerModalVisible] = useState(false);

  // Settings toggles
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isAppearanceModalVisible, setIsAppearanceModalVisible] = useState(false);

  // Action feedback toast
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Filter items owned by current student ('Maria Santos' or profileName or 'You')
  const userItems = items.filter(
    (item) => item.sellerName === profileName || item.sellerName === 'Maria Santos' || item.sellerName === 'You'
  );
  const activeListings = userItems.filter((i) => i.status !== 'sold');
  const soldListings = userItems.filter((i) => i.status === 'sold');

  // Mock student purchases (In Escrow / Completed)
  const studentPurchases = [
    {
      id: 'purch_1',
      title: 'Casio FX-991EX ClassWiz Scientific Calculator',
      price: 850,
      sellerName: 'Kenzo Alcantara',
      campus: 'Ateneo de Naga University',
      safeMeetupSpot: 'Main Library Ground Floor',
      escrowStatus: 'in_escrow',
      referenceCode: 'CG-ESC-749201',
      date: 'Today, 2:15 PM',
    },
  ];

  // Handle Listing Bump
  const handleBump = (item: MarketplaceItem) => {
    bumpItem(item.id);
    setActionFeedback(`"${item.title.substring(0, 24)}..." bumped to top of feed!`);
    setTimeout(() => setActionFeedback(null), 3500);
  };

  // Handle Urgent Toggle
  const handleToggleUrgent = (item: MarketplaceItem) => {
    toggleUrgent(item.id);
    const newState = !item.isUrgent;
    if (manageItem?.id === item.id) {
      setManageItem({ ...manageItem, isUrgent: newState });
    }
    setActionFeedback(
      newState
        ? `Urgent Selling badge added! Highlighted across Marketplace.`
        : `Urgent badge removed.`
    );
    setTimeout(() => setActionFeedback(null), 3500);
  };

  // Handle Toggle Reserved
  const handleToggleReserved = (item: MarketplaceItem) => {
    const isCurrentlyReserved = item.isReserved || item.status === 'reserved';
    const newStatus = isCurrentlyReserved ? 'active' : 'reserved';
    setItemStatus(item.id, newStatus);
    if (manageItem?.id === item.id) {
      setManageItem({ ...manageItem, status: newStatus, isReserved: newStatus === 'reserved' });
    }
    setActionFeedback(
      newStatus === 'reserved'
        ? `Marked as Reserved. Buyers see reservation tag.`
        : `Marked as Active and ready for trade.`
    );
    setTimeout(() => setActionFeedback(null), 3000);
  };

  // Handle Mark Sold
  const handleMarkSold = (item: MarketplaceItem) => {
    setItemStatus(item.id, 'sold');
    setManageItem(null);
    setActionFeedback(`"${item.title.substring(0, 24)}..." marked as Sold!`);
    setTimeout(() => setActionFeedback(null), 3000);
  };

  // Handle Delete Confirmation
  const handleDeleteConfirm = (item: MarketplaceItem) => {
    Alert.alert(
      'Remove Listing',
      `Are you sure you want to remove "${item.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            deleteItem(item.id);
            setManageItem(null);
            setActionFeedback('Listing removed.');
            setTimeout(() => setActionFeedback(null), 3000);
          },
        },
      ]
    );
  };

  // Preset Amount Selection
  const handleSelectPresetAmount = (preset: number) => {
    const validAmount = Math.min(preset, wallet.availableBalance);
    setCashOutAmount(validAmount.toString());
  };

  const handleSelectAllAmount = () => {
    setCashOutAmount(wallet.availableBalance.toString());
  };

  // Execute Cash Out
  const handleExecuteCashOut = async () => {
    if (!cashOutChannel) {
      Alert.alert('Channel Required', 'Please select GCash or Maya.');
      return;
    }
    const numAmount = Number(cashOutAmount);
    if (!cashOutAmount.trim() || isNaN(numAmount) || numAmount < 100) {
      Alert.alert('Minimum Amount', 'The minimum cash-out amount is ₱100.00.');
      return;
    }
    if (numAmount > wallet.availableBalance) {
      Alert.alert('Insufficient Balance', 'Amount exceeds available balance.');
      return;
    }
    if (!cashOutAccount.trim() || cashOutAccount.trim().length < 10) {
      Alert.alert('Account Number Required', 'Please enter your registered 11-digit mobile number.');
      return;
    }

    setIsProcessingCashOut(true);

    setTimeout(async () => {
      const result = await cashOut(numAmount, cashOutChannel, cashOutAccount);
      setIsProcessingCashOut(false);
      if (result.success) {
        setCashOutSuccess({
          referenceCode: result.referenceCode,
          amount: numAmount,
          channel: cashOutChannel === 'gcash' ? 'GCash' : 'Maya',
        });
      } else {
        Alert.alert('Cash-Out Failed', result.error || 'Please try again.');
      }
    }, 800);
  };

  const handleCloseCashOutModal = () => {
    setIsCashOutModalVisible(false);
    setCashOutChannel(null);
    setCashOutAmount('');
    setCashOutAccount('');
    setCashOutSuccess(null);
  };

  // Save new meetup spot
  const handleSaveMeetupSpot = () => {
    if (tempSpot.trim()) {
      setPreferredSpot(tempSpot.trim());
      setIsEditSpotModalVisible(false);
      setActionFeedback('Preferred meetup spot updated.');
      setTimeout(() => setActionFeedback(null), 3000);
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

  // Log Out confirmation
  const handleSignOut = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out of your student account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: () => router.replace('/(auth)/login'),
      },
    ]);
  };

  // Photo Picker: Choose from Library
  const handlePickAvatarFromLibrary = async () => {
    setIsPhotoPickerModalVisible(false);
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Photo Library Access Required',
          'CampusGreen needs permission to access your photo library so you can upload your student profile picture.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const pickedUri = result.assets[0].uri;
        setProfileAvatarUri(pickedUri);
        setTempAvatarUri(pickedUri);
        setActionFeedback('Profile photo updated.');
        setTimeout(() => setActionFeedback(null), 3000);
      }
    } catch {
      Alert.alert('Error', 'Unable to open photo library. Please try again.');
    }
  };

  // Photo Picker: Take Photo with Camera
  const handleTakeAvatarPhoto = async () => {
    setIsPhotoPickerModalVisible(false);
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Camera Access Required',
          'CampusGreen needs camera permission so you can take a profile photo.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const capturedUri = result.assets[0].uri;
        setProfileAvatarUri(capturedUri);
        setTempAvatarUri(capturedUri);
        setActionFeedback('Profile photo updated.');
        setTimeout(() => setActionFeedback(null), 3000);
      }
    } catch {
      Alert.alert('Error', 'Unable to launch camera. Please try again.');
    }
  };

  // Photo Picker: Select Preset
  const handleSelectAvatarPreset = (uri: string) => {
    setIsPhotoPickerModalVisible(false);
    setProfileAvatarUri(uri);
    setTempAvatarUri(uri);
    setActionFeedback('Profile photo updated.');
    setTimeout(() => setActionFeedback(null), 3000);
  };

  // Photo Picker: Remove
  const handleRemoveAvatarPhoto = () => {
    setIsPhotoPickerModalVisible(false);
    setProfileAvatarUri(null);
    setTempAvatarUri(null);
    setActionFeedback('Custom photo removed.');
    setTimeout(() => setActionFeedback(null), 3000);
  };

  // Save Edit Profile Details
  const handleSaveProfile = () => {
    if (!tempProfileName.trim()) {
      Alert.alert('Name Required', 'Please enter your student name.');
      return;
    }
    setProfileName(tempProfileName.trim());
    setProfileDegree(tempProfileDegree.trim());
    setProfileYearLevel(tempProfileYearLevel);
    setProfileAvatarUri(tempAvatarUri);
    setIsEditProfileModalVisible(false);
    setActionFeedback('Student profile details updated.');
    setTimeout(() => setActionFeedback(null), 3000);
  };

  // Category Icon Resolver
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Uniforms & Scrubs':
        return 'shirt-outline';
      case 'Textbooks & Reviewers':
        return 'book-outline';
      case 'Tools & Lab Equipment':
        return 'calculator-outline';
      case 'Dorm & Room Essentials':
        return 'bed-outline';
      case 'Tech & Study Gadgets':
        return 'laptop-outline';
      default:
        return 'cube-outline';
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + Spacing.three,
            paddingBottom: insets.bottom + 100,
          },
        ]}>
        {/* ================= 1. REFINED STUDENT PROFILE HEADER ================= */}
        <View
          style={[
            styles.studentProfileCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}>
          <View style={styles.studentInfoRow}>
            {/* Student Avatar with Camera/Pen Edit Overlay */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Change profile picture"
              style={styles.avatarPressable}
              onPress={() => setIsPhotoPickerModalVisible(true)}>
              <View style={[styles.avatarCircle, { backgroundColor: theme.primary }]}>
                {profileAvatarUri ? (
                  <Image
                    source={{ uri: profileAvatarUri }}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                  />
                ) : (
                  <Text style={styles.avatarInitials}>
                    {profileName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .substring(0, 2) || 'MS'}
                  </Text>
                )}
              </View>

              {/* Pen / Camera Badge on Avatar */}
              <View
                style={[
                  styles.avatarPenBadge,
                  { backgroundColor: theme.primary, borderColor: theme.surface },
                ]}>
                <Ionicons name="camera" size={10} color="#FFFFFF" />
              </View>
            </Pressable>

            {/* Name & Academic Meta */}
            <View style={styles.studentMeta}>
              <View style={styles.nameAndStatusRow}>
                <Text style={[styles.studentName, { color: theme.text }]} numberOfLines={1}>
                  {profileName}
                </Text>
                <View style={[styles.verifiedTag, { backgroundColor: theme.badgeGreenBg }]}>
                  <Text style={[styles.verifiedTagText, { color: theme.badgeGreenText }]}>
                    Verified
                  </Text>
                </View>
              </View>

              <Text style={[styles.studentDegree, { color: theme.textSecondary }]} numberOfLines={1}>
                {profileDegree} • {profileYearLevel}
              </Text>
              <Text style={[styles.studentCampus, { color: theme.primary }]} numberOfLines={1}>
                Ateneo de Naga University
              </Text>
            </View>

            {/* Edit Profile Pen Button */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Edit profile details"
              style={[
                styles.editProfilePenBtn,
                { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
              ]}
              onPress={() => {
                setTempProfileName(profileName);
                setTempProfileDegree(profileDegree);
                setTempProfileYearLevel(profileYearLevel);
                setTempAvatarUri(profileAvatarUri);
                setIsEditProfileModalVisible(true);
              }}>
              <Ionicons name="pencil" size={14} color={theme.text} />
            </Pressable>
          </View>

          {/* Unified Reputation & Green Impact Matrix */}
          <View
            style={[
              styles.metricsMatrix,
              { backgroundColor: theme.surfaceSubtle, borderColor: theme.borderSubtle },
            ]}>
            {/* Metric 1: Trust Rating */}
            <View style={styles.matrixItem}>
              <View style={styles.metricRow}>
                <Ionicons name="star" size={13} color={theme.gold} style={{ marginRight: 3 }} />
                <Text style={[styles.matrixVal, { color: theme.text }]}>4.9</Text>
              </View>
              <Text style={[styles.matrixLabel, { color: theme.textSecondary }]}>24 Reviews</Text>
            </View>

            <View style={[styles.matrixDivider, { backgroundColor: theme.border }]} />

            {/* Metric 2: Meetup Completion */}
            <View style={styles.matrixItem}>
              <Text style={[styles.matrixVal, { color: theme.primary }]}>100%</Text>
              <Text style={[styles.matrixLabel, { color: theme.textSecondary }]}>Meetups</Text>
            </View>

            <View style={[styles.matrixDivider, { backgroundColor: theme.border }]} />

            {/* Metric 3: Carbon Saved */}
            <View style={styles.matrixItem}>
              <View style={styles.metricRow}>
                <Ionicons name="leaf" size={13} color={theme.primary} style={{ marginRight: 3 }} />
                <Text style={[styles.matrixVal, { color: theme.primaryDark }]}>
                  {INITIAL_GREEN_IMPACT.userCo2SavedKg}kg
                </Text>
              </View>
              <Text style={[styles.matrixLabel, { color: theme.textSecondary }]}>CO₂ Saved</Text>
            </View>
          </View>
        </View>

        {/* Action Feedback Banner */}
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

        {/* ================= 2. ESCROW WALLET CARD ================= */}
        <View
          style={[
            styles.escrowWalletCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}>
          <View style={styles.walletHeaderRow}>
            <View style={styles.walletTitleGroup}>
              <View style={[styles.walletIconCircle, { backgroundColor: theme.badgeGreenBg }]}>
                <Ionicons name="shield-checkmark" size={18} color={theme.primary} />
              </View>
              <View>
                <Text style={[styles.walletTitle, { color: theme.text }]}>Escrow Wallet</Text>
                <Text style={[styles.walletSubtitle, { color: theme.textSecondary }]}>
                  Buyer Protection & Cleared Funds
                </Text>
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="How escrow protection works"
              style={[
                styles.escrowInfoBadge,
                { backgroundColor: theme.surfaceSubtle, borderColor: theme.borderSubtle },
              ]}
              onPress={() => setIsEscrowGuideVisible(true)}>
              <Ionicons name="help-circle-outline" size={14} color={theme.primary} />
              <Text style={[styles.escrowInfoBadgeText, { color: theme.primary }]}>Guide</Text>
            </Pressable>
          </View>

          {/* Balance figures (Clean, uncluttered display) */}
          <View style={styles.balanceSection}>
            <View style={styles.balanceMainRow}>
              <Text style={[styles.balanceSmallLabel, { color: theme.textSecondary }]}>
                AVAILABLE FOR CASH-OUT
              </Text>
              <Text style={[styles.balanceMainAmount, { color: theme.text }]}>
                ₱{wallet.availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </Text>
            </View>

            {/* In Escrow Pill */}
            <View
              style={[
                styles.inEscrowPill,
                { backgroundColor: theme.surfaceSubtle, borderColor: theme.borderSubtle },
              ]}>
              <Ionicons name="lock-closed" size={13} color={theme.gold} style={{ marginRight: 6 }} />
              <Text style={[styles.inEscrowPillText, { color: theme.textSecondary }]}>
                <Text style={{ fontWeight: '700', color: theme.text }}>
                  ₱{wallet.inEscrowBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </Text>{' '}
                pending physical meetup inspection
              </Text>
            </View>
          </View>

          {/* Primary Cash Out Button */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cash out available escrow funds to GCash or Maya"
            style={[styles.primaryCashOutBtn, { backgroundColor: theme.primary }]}
            onPress={() => {
              if (!cashOutAccount) {
                setCashOutAccount(defaultPayoutNumber);
              }
              if (!cashOutChannel) {
                setCashOutChannel(defaultPayoutChannel);
              }
              setIsCashOutModalVisible(true);
            }}>
            <Ionicons name="arrow-up-circle" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.primaryCashOutBtnText}>Cash Out to GCash / Maya</Text>
          </Pressable>

          {/* Fee Notice */}
          <View style={[styles.walletFooterNotice, { borderTopColor: theme.borderSubtle }]}>
            <Ionicons name="checkmark-done-circle" size={14} color={theme.primary} />
            <Text style={[styles.walletFooterNoticeText, { color: theme.textSecondary }]}>
              ₱0 student fee • Funds auto-release upon meetup verification
            </Text>
          </View>
        </View>

        {/* ================= 3. MARKETPLACE LISTINGS SEGMENT TABS ================= */}
        <View style={styles.segmentedTabsContainer}>
          <Pressable
            accessibilityRole="tab"
            accessibilityLabel="Active Listings"
            style={[
              styles.segmentTab,
              activeTab === 'active'
                ? [styles.segmentTabActive, { backgroundColor: theme.primary, borderColor: theme.primary }]
                : [styles.segmentTabInactive, { backgroundColor: theme.surface, borderColor: theme.border }],
            ]}
            onPress={() => setActiveTab('active')}>
            <Text
              style={[
                styles.segmentTabText,
                {
                  color: activeTab === 'active' ? '#FFFFFF' : theme.textSecondary,
                  fontWeight: activeTab === 'active' ? '700' : '600',
                },
              ]}>
              Active ({activeListings.length})
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="tab"
            accessibilityLabel="Sold Listings"
            style={[
              styles.segmentTab,
              activeTab === 'sold'
                ? [styles.segmentTabActive, { backgroundColor: theme.primary, borderColor: theme.primary }]
                : [styles.segmentTabInactive, { backgroundColor: theme.surface, borderColor: theme.border }],
            ]}
            onPress={() => setActiveTab('sold')}>
            <Text
              style={[
                styles.segmentTabText,
                {
                  color: activeTab === 'sold' ? '#FFFFFF' : theme.textSecondary,
                  fontWeight: activeTab === 'sold' ? '700' : '600',
                },
              ]}>
              Sold ({soldListings.length})
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="tab"
            accessibilityLabel="My Orders and Purchases"
            style={[
              styles.segmentTab,
              activeTab === 'purchases'
                ? [styles.segmentTabActive, { backgroundColor: theme.primary, borderColor: theme.primary }]
                : [styles.segmentTabInactive, { backgroundColor: theme.surface, borderColor: theme.border }],
            ]}
            onPress={() => setActiveTab('purchases')}>
            <Text
              style={[
                styles.segmentTabText,
                {
                  color: activeTab === 'purchases' ? '#FFFFFF' : theme.textSecondary,
                  fontWeight: activeTab === 'purchases' ? '700' : '600',
                },
              ]}>
              Orders ({studentPurchases.length})
            </Text>
          </Pressable>
        </View>

        {/* ================= 4. TAB 1: ACTIVE LISTINGS ================= */}
        {activeTab === 'active' && (
          <View style={styles.tabContentBlock}>
            {activeListings.length === 0 ? (
              <View
                style={[
                  styles.emptyStateBox,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}>
                <Ionicons name="cube-outline" size={36} color={theme.textMuted} />
                <Text style={[styles.emptyStateTitle, { color: theme.text }]}>No active listings</Text>
                <Text style={[styles.emptyStateSubtitle, { color: theme.textSecondary }]}>
                  List pre-loved uniforms, books, or tools to earn cash and reduce campus waste.
                </Text>
                <Pressable
                  style={[styles.emptyStateBtn, { backgroundColor: theme.primary }]}
                  onPress={() => router.push('/(tabs)/sell')}>
                  <Text style={styles.emptyStateBtnText}>Post a Listing</Text>
                </Pressable>
              </View>
            ) : (
              activeListings.map((item) => (
                <View
                  key={item.id}
                  style={[
                    styles.listingCard,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                  ]}>
                  <View style={styles.listingTopRow}>
                    {/* Item Thumbnail */}
                    <View style={[styles.listingThumb, { backgroundColor: theme.surfaceSubtle }]}>
                      {item.imageUrl ? (
                        <Image
                          source={{ uri: item.imageUrl }}
                          style={StyleSheet.absoluteFill}
                          contentFit="cover"
                        />
                      ) : (
                        <Ionicons
                          name={getCategoryIcon(item.category)}
                          size={28}
                          color={theme.primary}
                        />
                      )}
                    </View>

                    {/* Listing Meta */}
                    <View style={styles.listingDetails}>
                      <View style={styles.listingBadgeRow}>
                        <View
                          style={[
                            styles.pricePill,
                            {
                              backgroundColor:
                                item.tradeType === 'buy'
                                  ? theme.badgeGreenBg
                                  : item.tradeType === 'swap'
                                  ? theme.blueBg
                                  : theme.goldBg,
                            },
                          ]}>
                          <Text
                            style={[
                              styles.pricePillText,
                              {
                                color:
                                  item.tradeType === 'buy'
                                    ? theme.badgeGreenText
                                    : item.tradeType === 'swap'
                                    ? theme.blue
                                    : theme.gold,
                              },
                            ]}>
                            {item.tradeType === 'buy'
                              ? `₱${item.price}`
                              : item.tradeType === 'swap'
                              ? 'Swap'
                              : 'Free'}
                          </Text>
                        </View>

                        {/* Urgent Badge */}
                        {item.isUrgent && (
                          <View style={[styles.urgentBadgeTag, { backgroundColor: '#DC2626' }]}>
                            <Ionicons name="flash" size={10} color="#FFFFFF" style={{ marginRight: 2 }} />
                            <Text style={styles.urgentBadgeTagText}>Urgent</Text>
                          </View>
                        )}

                        {/* Reserved Badge */}
                        {(item.isReserved || item.status === 'reserved') && (
                          <View style={[styles.reservedBadgeTag, { backgroundColor: theme.textMuted }]}>
                            <Text style={styles.reservedBadgeTagText}>Reserved</Text>
                          </View>
                        )}
                      </View>

                      <Text style={[styles.listingTitle, { color: theme.text }]} numberOfLines={2}>
                        {item.title}
                      </Text>

                      <Text style={[styles.listingSubtext, { color: theme.textSecondary }]}>
                        {item.courseTag || item.category} • {item.condition}
                      </Text>

                      {/* Performance Counters */}
                      <View style={styles.listingStatsRow}>
                        <View style={styles.statMiniItem}>
                          <Ionicons name="eye-outline" size={12} color={theme.textMuted} />
                          <Text style={[styles.statMiniText, { color: theme.textMuted }]}>
                            {item.viewsCount ?? 142}
                          </Text>
                        </View>
                        <Text style={{ color: theme.border }}>•</Text>
                        <View style={styles.statMiniItem}>
                          <Ionicons name="chatbubble-outline" size={12} color={theme.textMuted} />
                          <Text style={[styles.statMiniText, { color: theme.textMuted }]}>
                            {item.inquiriesCount ?? 6}
                          </Text>
                        </View>
                        <Text style={{ color: theme.border }}>•</Text>
                        <View style={styles.statMiniItem}>
                          <Ionicons name="arrow-up-circle-outline" size={12} color={theme.primary} />
                          <Text style={[styles.statMiniText, { color: theme.primary, fontWeight: '700' }]}>
                            {item.bumpCount ?? 0} bumps
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Refactored Mobile Action Dock: 2 Ergonomic Touch Targets */}
                  <View style={[styles.ergonomicActionDock, { borderTopColor: theme.borderSubtle }]}>
                    {/* Action 1: Bump to Top */}
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Bump "${item.title}" to top of discovery feed`}
                      style={[
                        styles.bumpBtn,
                        { backgroundColor: theme.primaryLight, borderColor: theme.primary },
                      ]}
                      onPress={() => handleBump(item)}>
                      <Ionicons name="arrow-up-circle" size={16} color={theme.primary} />
                      <Text style={[styles.bumpBtnText, { color: theme.primary }]}>Bump to Top</Text>
                    </Pressable>

                    {/* Action 2: Manage Listing Modal Sheet */}
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Manage listing status and settings for "${item.title}"`}
                      style={[
                        styles.manageListingBtn,
                        { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
                      ]}
                      onPress={() => setManageItem(item)}>
                      <Ionicons name="ellipsis-horizontal" size={16} color={theme.text} />
                      <Text style={[styles.manageListingBtnText, { color: theme.text }]}>
                        Manage
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* ================= 5. TAB 2: SOLD & COMPLETED DEALS ================= */}
        {activeTab === 'sold' && (
          <View style={styles.tabContentBlock}>
            {soldListings.length === 0 ? (
              <View
                style={[
                  styles.emptyStateBox,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}>
                <Ionicons name="checkmark-circle-outline" size={36} color={theme.textMuted} />
                <Text style={[styles.emptyStateTitle, { color: theme.text }]}>No sold items yet</Text>
                <Text style={[styles.emptyStateSubtitle, { color: theme.textSecondary }]}>
                  When you complete meetups and handovers, your successfully transferred campus gear
                  will appear here.
                </Text>
              </View>
            ) : (
              soldListings.map((item) => (
                <View
                  key={item.id}
                  style={[
                    styles.soldItemCard,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                  ]}>
                  <View style={styles.soldItemTopRow}>
                    <View style={[styles.soldItemThumb, { backgroundColor: theme.surfaceSubtle }]}>
                      {item.imageUrl ? (
                        <Image
                          source={{ uri: item.imageUrl }}
                          style={StyleSheet.absoluteFill}
                          contentFit="cover"
                        />
                      ) : (
                        <Ionicons
                          name={getCategoryIcon(item.category)}
                          size={24}
                          color={theme.primary}
                        />
                      )}
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <View style={styles.soldBadgeRow}>
                        <View style={[styles.completedPill, { backgroundColor: theme.badgeGreenBg }]}>
                          <Ionicons name="checkmark-circle" size={11} color={theme.primary} />
                          <Text style={[styles.completedPillText, { color: theme.primary }]}>
                            Completed Trade
                          </Text>
                        </View>
                        <Text style={[styles.soldPriceText, { color: theme.text }]}>₱{item.price}</Text>
                      </View>
                      <Text style={[styles.soldItemTitle, { color: theme.text }]} numberOfLines={2}>
                        {item.title}
                      </Text>
                      <Text style={[styles.soldItemDate, { color: theme.textSecondary }]}>
                        Verified Meetup • {item.safeMeetupSpot}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* ================= 6. TAB 3: MY ORDERS & PURCHASES ================= */}
        {activeTab === 'purchases' && (
          <View style={styles.tabContentBlock}>
            {studentPurchases.map((p) => (
              <View
                key={p.id}
                style={[
                  styles.purchaseCard,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}>
                <View style={styles.purchaseHeader}>
                  <View style={styles.purchaseHeaderLeft}>
                    <Ionicons name="shield-checkmark" size={15} color={theme.primary} />
                    <Text style={[styles.purchaseRef, { color: theme.primary }]}>
                      {p.referenceCode}
                    </Text>
                  </View>
                  <View style={[styles.inEscrowTag, { backgroundColor: theme.goldBg }]}>
                    <Text style={[styles.inEscrowTagText, { color: theme.gold }]}>
                      Held in Escrow
                    </Text>
                  </View>
                </View>

                <Text style={[styles.purchaseTitle, { color: theme.text }]}>{p.title}</Text>
                <Text style={[styles.purchaseSeller, { color: theme.textSecondary }]}>
                  Seller: {p.sellerName} • ₱{p.price}
                </Text>

                <View
                  style={[
                    styles.purchaseSpotBox,
                    { backgroundColor: theme.surfaceSubtle, borderColor: theme.borderSubtle },
                  ]}>
                  <Ionicons name="location" size={14} color={theme.primary} />
                  <Text style={[styles.purchaseSpotText, { color: theme.text }]}>
                    Campus Meetup: {p.safeMeetupSpot}
                  </Text>
                </View>

                <Text style={[styles.purchaseDisclaimer, { color: theme.textMuted }]}>
                  Payment safely held in escrow. Inspect in person before confirmation.
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* ================= 7. COMPREHENSIVE ACCOUNT PREFERENCES & SETTINGS ================= */}
        {/* Houses transaction ledger, payout details, change password, safety & policies cleanly */}
        <View style={styles.accountSection}>
          <Text style={[styles.accountSectionHeading, { color: theme.text }]}>
            Account & Security Preferences
          </Text>

          <View
            style={[
              styles.groupedAccountCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}>
            {/* Row 1: Escrow & Payout Ledger (Moved here per user request) */}
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

            {/* Row 2: Payment & Payout Details */}
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

            {/* Row 3: Default Safe Meetup Spot */}
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

            {/* Row 4: Change Password */}
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

            <View style={[styles.rowDivider, { backgroundColor: theme.borderSubtle }]} />

            {/* Row 5: Campus Institutional Verification */}
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
              <Ionicons name="checkmark-circle" size={17} color={theme.primary} />
            </View>

            <View style={[styles.rowDivider, { backgroundColor: theme.borderSubtle }]} />

            {/* Row 6: Escrow Buyer & Seller Protection Guide */}
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

            <View style={[styles.rowDivider, { backgroundColor: theme.borderSubtle }]} />

            {/* Row 7: Notifications Toggle */}
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

            {/* Row 8: App Appearance (Light, Dark, System) */}
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

            <View style={[styles.rowDivider, { backgroundColor: theme.borderSubtle }]} />

            {/* Row 9: Log Out */}
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
      </ScrollView>

      {/* ================= 8. LISTING MANAGEMENT BOTTOM SHEET MODAL ================= */}
      <Modal
        visible={manageItem !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setManageItem(null)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setManageItem(null)} />
          <View
            style={[
              styles.modalSheet,
              { backgroundColor: theme.surface, paddingBottom: insets.bottom + 20 },
            ]}>
            <View style={styles.modalDragNotch} />

            {manageItem && (
              <View>
                {/* Modal Header */}
                <View style={styles.manageHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.manageModalTitle, { color: theme.text }]} numberOfLines={1}>
                      Manage Listing
                    </Text>
                    <Text style={[styles.manageModalSub, { color: theme.textSecondary }]} numberOfLines={1}>
                      {manageItem.title}
                    </Text>
                  </View>
                  <Pressable onPress={() => setManageItem(null)} style={styles.modalCloseBtn}>
                    <Ionicons name="close" size={22} color={theme.textMuted} />
                  </Pressable>
                </View>

                {/* Manage Options List */}
                <View style={styles.manageOptionsList}>
                  {/* Option 1: Urgent Badge Toggle */}
                  <Pressable
                    accessibilityRole="button"
                    style={[
                      styles.manageOptionCard,
                      {
                        backgroundColor: manageItem.isUrgent ? '#FEF2F2' : theme.surfaceSubtle,
                        borderColor: manageItem.isUrgent ? '#DC2626' : theme.border,
                      },
                    ]}
                    onPress={() => handleToggleUrgent(manageItem)}>
                    <View
                      style={[
                        styles.manageOptionIconCircle,
                        { backgroundColor: manageItem.isUrgent ? '#DC2626' : theme.surface },
                      ]}>
                      <Ionicons
                        name="flash"
                        size={18}
                        color={manageItem.isUrgent ? '#FFFFFF' : theme.textSecondary}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.manageOptionTitle,
                          { color: manageItem.isUrgent ? '#DC2626' : theme.text },
                        ]}>
                        {manageItem.isUrgent ? 'Urgent Selling Enabled' : 'Mark as Urgent Selling'}
                      </Text>
                      <Text style={[styles.manageOptionDesc, { color: theme.textSecondary }]}>
                        {manageItem.isUrgent
                          ? 'Item is prominently badged for fast campus sale.'
                          : 'Highlight item in red across marketplace for quick buyer response.'}
                      </Text>
                    </View>
                    <Switch
                      value={!!manageItem.isUrgent}
                      onValueChange={() => handleToggleUrgent(manageItem)}
                      trackColor={{ false: theme.border, true: '#DC2626' }}
                      thumbColor="#FFFFFF"
                    />
                  </Pressable>

                  {/* Option 2: Reserve / Unreserve */}
                  <Pressable
                    accessibilityRole="button"
                    style={[
                      styles.manageOptionCard,
                      {
                        backgroundColor: theme.surfaceSubtle,
                        borderColor: theme.border,
                      },
                    ]}
                    onPress={() => handleToggleReserved(manageItem)}>
                    <View style={[styles.manageOptionIconCircle, { backgroundColor: theme.surface }]}>
                      <Ionicons
                        name={
                          manageItem.isReserved || manageItem.status === 'reserved'
                            ? 'lock-open-outline'
                            : 'lock-closed-outline'
                        }
                        size={18}
                        color={theme.primary}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.manageOptionTitle, { color: theme.text }]}>
                        {manageItem.isReserved || manageItem.status === 'reserved'
                          ? 'Unreserve Listing'
                          : 'Hold as Reserved'}
                      </Text>
                      <Text style={[styles.manageOptionDesc, { color: theme.textSecondary }]}>
                        {manageItem.isReserved || manageItem.status === 'reserved'
                          ? 'Re-open this item for active inquiries and trade proposals.'
                          : 'Show a Reserved badge while coordinating safe campus meetup.'}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
                  </Pressable>

                  {/* Option 3: Mark as Sold */}
                  <Pressable
                    accessibilityRole="button"
                    style={[
                      styles.manageOptionCard,
                      { backgroundColor: theme.badgeGreenBg, borderColor: theme.primaryLight },
                    ]}
                    onPress={() => handleMarkSold(manageItem)}>
                    <View style={[styles.manageOptionIconCircle, { backgroundColor: theme.primary }]}>
                      <Ionicons name="checkmark-done" size={18} color="#FFFFFF" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.manageOptionTitle, { color: theme.primaryDark }]}>
                        Mark as Sold
                      </Text>
                      <Text style={[styles.manageOptionDesc, { color: theme.primaryDark }]}>
                        Complete trade and move this listing to your Sold record.
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={theme.primary} />
                  </Pressable>

                  {/* Option 4: Delete Listing */}
                  <Pressable
                    accessibilityRole="button"
                    style={[
                      styles.manageOptionCard,
                      { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
                    ]}
                    onPress={() => handleDeleteConfirm(manageItem)}>
                    <View style={[styles.manageOptionIconCircle, { backgroundColor: '#FEE2E2' }]}>
                      <Ionicons name="trash-outline" size={18} color={theme.error} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.manageOptionTitle, { color: theme.error }]}>
                        Remove Listing
                      </Text>
                      <Text style={[styles.manageOptionDesc, { color: theme.textSecondary }]}>
                        Permanently delete this item from the student marketplace.
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={theme.error} />
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* ================= 9. CASH-OUT BOTTOM SHEET MODAL ================= */}
      <Modal
        visible={isCashOutModalVisible}
        transparent
        animationType="slide"
        onRequestClose={handleCloseCashOutModal}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={handleCloseCashOutModal} />

          <View style={[styles.modalSheet, { backgroundColor: theme.surface, paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalDragNotch} />

            {cashOutSuccess ? (
              /* Success Receipt View */
              <View style={styles.cashOutSuccessContainer}>
                <View style={[styles.successShieldCircle, { backgroundColor: theme.badgeGreenBg }]}>
                  <Ionicons name="checkmark-circle" size={44} color={theme.primary} />
                </View>
                <Text style={[styles.successMainTitle, { color: theme.text }]}>
                  Disbursement Complete!
                </Text>
                <Text style={[styles.successAmountText, { color: theme.primary }]}>
                  ₱{cashOutSuccess.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </Text>
                <Text style={[styles.successDescText, { color: theme.textSecondary }]}>
                  Funds transferred instantly to your {cashOutSuccess.channel} account.
                </Text>

                <View
                  style={[
                    styles.successReceiptBox,
                    { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
                  ]}>
                  <View style={styles.receiptRow}>
                    <Text style={[styles.receiptLabel, { color: theme.textSecondary }]}>
                      Reference:
                    </Text>
                    <Text style={[styles.receiptValue, { color: theme.text }]}>
                      {cashOutSuccess.referenceCode}
                    </Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={[styles.receiptLabel, { color: theme.textSecondary }]}>Channel:</Text>
                    <Text style={[styles.receiptValue, { color: theme.text }]}>
                      {cashOutSuccess.channel} (Instant)
                    </Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={[styles.receiptLabel, { color: theme.textSecondary }]}>
                      Student Fee:
                    </Text>
                    <Text style={[styles.receiptValue, { color: theme.primary }]}>₱0.00 (Free)</Text>
                  </View>
                </View>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Done"
                  style={[styles.modalPrimaryActionBtn, { backgroundColor: theme.primary }]}
                  onPress={handleCloseCashOutModal}>
                  <Text style={styles.modalPrimaryActionText}>Done</Text>
                </Pressable>
              </View>
            ) : (
              /* Cash-Out Form View */
              <View>
                <View style={styles.modalHeaderRow}>
                  <View>
                    <Text style={[styles.modalTitle, { color: theme.text }]}>Cash Out Funds</Text>
                    <Text style={[styles.modalSub, { color: theme.textSecondary }]}>
                      Transfer cleared escrow balance to your local e-wallet
                    </Text>
                  </View>
                  <Pressable onPress={handleCloseCashOutModal} style={styles.modalCloseBtn}>
                    <Ionicons name="close" size={22} color={theme.textMuted} />
                  </Pressable>
                </View>

                {/* Available Balance Pill */}
                <View
                  style={[
                    styles.modalBalancePill,
                    { backgroundColor: theme.badgeGreenBg, borderColor: theme.primaryLight },
                  ]}>
                  <Text style={[styles.modalBalanceLabel, { color: theme.primaryDark }]}>
                    Available to Cash Out:
                  </Text>
                  <Text style={[styles.modalBalanceVal, { color: theme.primary }]}>
                    ₱{wallet.availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </Text>
                </View>

                {/* Step 1: Select Channel */}
                <Text style={[styles.modalInputLabel, { color: theme.text, marginTop: Spacing.three }]}>
                  Select E-Wallet Channel *
                </Text>
                <View style={styles.channelRow}>
                  {/* GCash */}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Select GCash for disbursement"
                    style={[
                      styles.channelCard,
                      {
                        backgroundColor:
                          cashOutChannel === 'gcash' ? theme.primaryLight : theme.surface,
                        borderColor: cashOutChannel === 'gcash' ? theme.primary : theme.border,
                      },
                    ]}
                    onPress={() => setCashOutChannel('gcash')}>
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
                          color: cashOutChannel === 'gcash' ? theme.primary : theme.text,
                          fontWeight: cashOutChannel === 'gcash' ? '700' : '600',
                        },
                      ]}>
                      GCash
                    </Text>
                    {cashOutChannel === 'gcash' && (
                      <Ionicons name="checkmark-circle" size={15} color={theme.primary} />
                    )}
                  </Pressable>

                  {/* Maya */}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Select Maya for disbursement"
                    style={[
                      styles.channelCard,
                      {
                        backgroundColor:
                          cashOutChannel === 'maya' ? theme.primaryLight : theme.surface,
                        borderColor: cashOutChannel === 'maya' ? theme.primary : theme.border,
                      },
                    ]}
                    onPress={() => setCashOutChannel('maya')}>
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
                          color: cashOutChannel === 'maya' ? theme.primary : theme.text,
                          fontWeight: cashOutChannel === 'maya' ? '700' : '600',
                        },
                      ]}>
                      Maya
                    </Text>
                    {cashOutChannel === 'maya' && (
                      <Ionicons name="checkmark-circle" size={15} color={theme.primary} />
                    )}
                  </Pressable>
                </View>

                {/* Step 2: Recipient Mobile Number */}
                <Text style={[styles.modalInputLabel, { color: theme.text, marginTop: Spacing.three }]}>
                  Recipient Mobile Number *
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
                    value={cashOutAccount}
                    onChangeText={setCashOutAccount}
                  />
                  <Pressable
                    onPress={() => setCashOutAccount(defaultPayoutNumber)}
                    style={styles.quickFillBtn}>
                    <Text style={[styles.quickFillText, { color: theme.primary }]}>Default</Text>
                  </Pressable>
                </View>

                {/* Step 3: Amount Input & Chips */}
                <Text style={[styles.modalInputLabel, { color: theme.text, marginTop: Spacing.three }]}>
                  Amount to Cash Out (₱) *
                </Text>
                <View
                  style={[
                    styles.modalInputContainer,
                    { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
                  ]}>
                  <Text style={[styles.currencyPrefix, { color: theme.text }]}>₱</Text>
                  <TextInput
                    style={[styles.modalTextInput, { color: theme.text, fontWeight: '700' }]}
                    placeholder="0.00"
                    placeholderTextColor={theme.textMuted}
                    keyboardType="numeric"
                    value={cashOutAmount}
                    onChangeText={setCashOutAmount}
                  />
                </View>

                {/* Preset Chips */}
                <View style={styles.presetChipsRow}>
                  <Pressable
                    style={[styles.presetChip, { borderColor: theme.border, backgroundColor: theme.surface }]}
                    onPress={() => handleSelectPresetAmount(500)}>
                    <Text style={[styles.presetChipText, { color: theme.text }]}>₱500</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.presetChip, { borderColor: theme.border, backgroundColor: theme.surface }]}
                    onPress={() => handleSelectPresetAmount(1000)}>
                    <Text style={[styles.presetChipText, { color: theme.text }]}>₱1,000</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.presetChip, { borderColor: theme.border, backgroundColor: theme.surface }]}
                    onPress={() => handleSelectPresetAmount(2000)}>
                    <Text style={[styles.presetChipText, { color: theme.text }]}>₱2,000</Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.presetChip,
                      { borderColor: theme.primary, backgroundColor: theme.primaryLight },
                    ]}
                    onPress={handleSelectAllAmount}>
                    <Text style={[styles.presetChipText, { color: theme.primary, fontWeight: '700' }]}>
                      All
                    </Text>
                  </Pressable>
                </View>

                {/* Fee Notice */}
                <View style={styles.feeNoticeRow}>
                  <Ionicons name="checkmark-done" size={13} color={theme.primary} />
                  <Text style={[styles.feeNoticeText, { color: theme.primaryDark }]}>
                    ₱0.00 Transfer Fee • Instant disbursement
                  </Text>
                </View>

                {/* Submit Action */}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Confirm Cash-Out"
                  style={[
                    styles.modalPrimaryActionBtn,
                    {
                      backgroundColor:
                        !cashOutChannel || !cashOutAmount || isProcessingCashOut
                          ? theme.border
                          : theme.primary,
                      marginTop: Spacing.four,
                    },
                  ]}
                  disabled={!cashOutChannel || !cashOutAmount || isProcessingCashOut}
                  onPress={handleExecuteCashOut}>
                  {isProcessingCashOut ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.modalPrimaryActionText}>Confirm Cash-Out</Text>
                  )}
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* ================= 10. ESCROW LEDGER MODAL SHEET ================= */}
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

      {/* ================= 11. ESCROW EXPLAINER MODAL ================= */}
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

      {/* ================= 12. EDIT MEETUP SPOT MODAL ================= */}
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
                placeholder="e.g. Nursing Bldg Lobby, Library Ground Floor"
                placeholderTextColor={theme.textMuted}
              />
            </View>

            <View style={styles.quickSpotChipsRow}>
              {['Nursing Bldg Lobby', 'Main Library Ground Floor', 'Gate 1 Security Post'].map((spot) => (
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

      {/* ================= 13. PAYMENT & PAYOUT DETAILS MODAL ================= */}
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

      {/* ================= 14. CHANGE PASSWORD MODAL ================= */}
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

      {/* ================= 15. APP APPEARANCE MODAL ================= */}
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

            {/* Appearance Options List */}
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

      {/* ================= 16. EDIT STUDENT PROFILE DETAILS MODAL ================= */}
      <Modal
        visible={isEditProfileModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsEditProfileModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setIsEditProfileModalVisible(false)}
          />
          <View
            style={[
              styles.modalSheet,
              { backgroundColor: theme.surface, paddingBottom: insets.bottom + 20 },
            ]}>
            <View style={styles.modalDragNotch} />
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Profile</Text>
                <Text style={[styles.modalSub, { color: theme.textSecondary }]}>
                  Update your campus identity & academic level
                </Text>
              </View>
              <Pressable
                onPress={() => setIsEditProfileModalVisible(false)}
                style={styles.modalCloseBtn}>
                <Ionicons name="close" size={22} color={theme.textMuted} />
              </Pressable>
            </View>

            {/* Avatar Preview with Change Button */}
            <View style={styles.editAvatarCenterRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Change profile picture from editor"
                style={styles.editAvatarPressable}
                onPress={() => setIsPhotoPickerModalVisible(true)}>
                <View
                  style={[
                    styles.editAvatarCircle,
                    { backgroundColor: theme.primary, borderColor: theme.border },
                  ]}>
                  {tempAvatarUri ? (
                    <Image
                      source={{ uri: tempAvatarUri }}
                      style={StyleSheet.absoluteFill}
                      contentFit="cover"
                    />
                  ) : (
                    <Text style={styles.editAvatarInitials}>
                      {tempProfileName
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .substring(0, 2) || 'MS'}
                    </Text>
                  )}
                  <View
                    style={[
                      styles.editAvatarCameraBadge,
                      { backgroundColor: theme.primary, borderColor: theme.surface },
                    ]}>
                    <Ionicons name="camera" size={12} color="#FFFFFF" />
                  </View>
                </View>
                <Text style={[styles.editAvatarHint, { color: theme.primary }]}>
                  Change Photo
                </Text>
              </Pressable>
            </View>

            {/* Student Full Name Input */}
            <Text style={[styles.modalInputLabel, { color: theme.text }]}>Student Name *</Text>
            <View
              style={[
                styles.modalInputContainer,
                { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
              ]}>
              <TextInput
                style={[styles.modalTextInput, { color: theme.text }]}
                placeholder="Full Name (e.g. Maria Santos)"
                placeholderTextColor={theme.textMuted}
                autoCapitalize="words"
                value={tempProfileName}
                onChangeText={setTempProfileName}
              />
            </View>

            {/* Degree / Program Input */}
            <Text style={[styles.modalInputLabel, { color: theme.text, marginTop: Spacing.three }]}>
              Degree / Program
            </Text>
            <View
              style={[
                styles.modalInputContainer,
                { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
              ]}>
              <TextInput
                style={[styles.modalTextInput, { color: theme.text }]}
                placeholder="e.g. BS Nursing"
                placeholderTextColor={theme.textMuted}
                autoCapitalize="words"
                value={tempProfileDegree}
                onChangeText={setTempProfileDegree}
              />
            </View>

            {/* Year Level Chips */}
            <Text style={[styles.modalInputLabel, { color: theme.text, marginTop: Spacing.three }]}>
              Year Level
            </Text>
            <View style={styles.yearLevelChipsRow}>
              {YEAR_LEVEL_OPTIONS.map((year) => {
                const isSelected = tempProfileYearLevel === year;
                return (
                  <Pressable
                    key={year}
                    accessibilityRole="button"
                    accessibilityLabel={year}
                    style={[
                      styles.yearLevelChip,
                      {
                        backgroundColor: isSelected ? theme.primary : theme.surfaceSubtle,
                        borderColor: isSelected ? theme.primary : theme.border,
                      },
                    ]}
                    onPress={() => setTempProfileYearLevel(year)}>
                    <Text
                      style={[
                        styles.yearLevelChipText,
                        {
                          color: isSelected ? '#FFFFFF' : theme.text,
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}>
                      {year}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Save profile"
              style={[
                styles.modalPrimaryActionBtn,
                { backgroundColor: theme.primary, marginTop: Spacing.four },
              ]}
              onPress={handleSaveProfile}>
              <Text style={styles.modalPrimaryActionText}>Save Profile</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ================= 17. PROFILE PHOTO PICKER MODAL ================= */}
      <Modal
        visible={isPhotoPickerModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsPhotoPickerModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setIsPhotoPickerModalVisible(false)}
          />
          <View
            style={[
              styles.modalSheet,
              { backgroundColor: theme.surface, paddingBottom: insets.bottom + 20 },
            ]}>
            <View style={styles.modalDragNotch} />
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Profile Picture</Text>
                <Text style={[styles.modalSub, { color: theme.textSecondary }]}>
                  Take a photo, pick from gallery, or select an avatar
                </Text>
              </View>
              <Pressable
                onPress={() => setIsPhotoPickerModalVisible(false)}
                style={styles.modalCloseBtn}>
                <Ionicons name="close" size={22} color={theme.textMuted} />
              </Pressable>
            </View>

            <View style={{ gap: Spacing.two, marginTop: Spacing.three }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Take a live photo"
                style={({ pressed }) => [
                  styles.photoOptionCard,
                  {
                    backgroundColor: pressed ? theme.surfaceSubtle : theme.surfaceSubtle,
                    borderColor: theme.border,
                  },
                ]}
                onPress={handleTakeAvatarPhoto}>
                <View style={[styles.photoOptionIconCircle, { backgroundColor: theme.primaryLight }]}>
                  <Ionicons name="camera-outline" size={20} color={theme.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.photoOptionTitle, { color: theme.text }]}>Take a Live Photo</Text>
                  <Text style={[styles.photoOptionDesc, { color: theme.textSecondary }]}>
                    Use your device camera for instant capture
                  </Text>
                </View>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Choose from gallery"
                style={({ pressed }) => [
                  styles.photoOptionCard,
                  {
                    backgroundColor: pressed ? theme.surfaceSubtle : theme.surfaceSubtle,
                    borderColor: theme.border,
                  },
                ]}
                onPress={handlePickAvatarFromLibrary}>
                <View style={[styles.photoOptionIconCircle, { backgroundColor: theme.badgeGreenBg }]}>
                  <Ionicons name="images-outline" size={20} color={theme.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.photoOptionTitle, { color: theme.text }]}>Choose from Gallery</Text>
                  <Text style={[styles.photoOptionDesc, { color: theme.textSecondary }]}>
                    Select a photo from your device library
                  </Text>
                </View>
              </Pressable>

              {/* Campus Avatar Presets */}
              <View style={styles.presetSection}>
                <Text style={[styles.presetSectionLabel, { color: theme.textSecondary }]}>
                  CAMPUS PRESET AVATARS
                </Text>
                <View style={styles.avatarPresetsRow}>
                  {AVATAR_PRESETS.map((preset, index) => {
                    const isSelected = (tempAvatarUri || profileAvatarUri) === preset.uri;
                    return (
                      <Pressable
                        key={`preset-${index}`}
                        accessibilityRole="button"
                        accessibilityLabel={preset.title}
                        style={[
                          styles.avatarPresetThumb,
                          {
                            borderColor: isSelected ? theme.primary : theme.border,
                          },
                        ]}
                        onPress={() => handleSelectAvatarPreset(preset.uri)}>
                        <Image
                          source={{ uri: preset.uri }}
                          style={StyleSheet.absoluteFill}
                          contentFit="cover"
                        />
                        {isSelected && (
                          <View
                            style={[
                              styles.presetSelectedBadge,
                              { backgroundColor: theme.primary },
                            ]}>
                            <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Remove Current Photo (if set) */}
              {(tempAvatarUri || profileAvatarUri) && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Remove current photo"
                  style={({ pressed }) => [
                    styles.photoOptionCard,
                    {
                      backgroundColor: pressed ? theme.surfaceSubtle : theme.surfaceSubtle,
                      borderColor: theme.border,
                    },
                  ]}
                  onPress={handleRemoveAvatarPhoto}>
                  <View style={[styles.photoOptionIconCircle, { backgroundColor: '#FEE2E2' }]}>
                    <Ionicons name="trash-outline" size={18} color="#DC2626" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.photoOptionTitle, { color: '#DC2626' }]}>
                      Remove Profile Photo
                    </Text>
                    <Text style={[styles.photoOptionDesc, { color: theme.textSecondary }]}>
                      Revert back to student initials
                    </Text>
                  </View>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },

  /* 1. Student Identity Header Card */
  studentProfileCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  studentInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarPressable: {
    position: 'relative',
  },
  avatarCircle: {
    width: 54,
    height: 54,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  avatarPenBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  editProfilePenBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  verifiedBadgeDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    backgroundColor: '#1F5C3A',
    width: 18,
    height: 18,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  studentMeta: {
    flex: 1,
    gap: 1,
  },
  nameAndStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  studentName: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  verifiedTag: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: Radius.full,
  },
  verifiedTagText: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  studentDegree: {
    fontSize: 12,
    fontWeight: '500',
  },
  studentCampus: {
    fontSize: 11,
    fontWeight: '600',
  },

  /* Metrics Matrix (Clean 3-column grid) */
  metricsMatrix: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  matrixItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  matrixVal: {
    fontSize: 15,
    fontWeight: '800',
  },
  matrixLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  matrixDivider: {
    width: 1,
    height: 20,
  },

  /* Action Feedback Toast */
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: 8,
  },
  feedbackBannerText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },

  /* 2. Escrow Wallet Card */
  escrowWalletCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  walletHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  walletTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  walletIconCircle: {
    width: 34,
    height: 34,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  walletSubtitle: {
    fontSize: 11,
  },
  escrowInfoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  escrowInfoBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  balanceSection: {
    gap: 6,
  },
  balanceMainRow: {
    gap: 2,
  },
  balanceSmallLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  balanceMainAmount: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  inEscrowPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  inEscrowPillText: {
    fontSize: 11,
    flex: 1,
  },
  primaryCashOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: Radius.md,
  },
  primaryCashOutBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  walletFooterNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: Spacing.two,
    borderTopWidth: 1,
  },
  walletFooterNoticeText: {
    fontSize: 11,
    flex: 1,
  },

  /* 3. Segmented Tabs */
  segmentedTabsContainer: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 2,
  },
  segmentTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentTabActive: {},
  segmentTabInactive: {},
  segmentTabText: {
    fontSize: 12,
  },

  /* 4. Tab Content & Listings */
  tabContentBlock: {
    gap: Spacing.three,
  },
  listingCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  listingTopRow: {
    flexDirection: 'row',
    gap: 12,
  },
  listingThumb: {
    width: 72,
    height: 72,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  listingDetails: {
    flex: 1,
    gap: 2,
  },
  listingBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pricePill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  pricePillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  urgentBadgeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  urgentBadgeTagText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  reservedBadgeTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  reservedBadgeTagText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  listingTitle: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: 1,
  },
  listingSubtext: {
    fontSize: 11,
  },
  listingStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  statMiniItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statMiniText: {
    fontSize: 11,
  },

  /* Ergonomic Action Dock (2 clean, thumb-friendly buttons) */
  ergonomicActionDock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    paddingTop: Spacing.two,
  },
  bumpBtn: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: 5,
  },
  bumpBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  manageListingBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: 5,
  },
  manageListingBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },

  /* Empty State */
  emptyStateBox: {
    padding: Spacing.six,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    gap: 6,
  },
  emptyStateTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  emptyStateSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
  },
  emptyStateBtn: {
    marginTop: 8,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: Radius.full,
  },
  emptyStateBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  /* Sold Item Card */
  soldItemCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.three,
  },
  soldItemTopRow: {
    flexDirection: 'row',
    gap: 12,
  },
  soldItemThumb: {
    width: 60,
    height: 60,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  soldBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  completedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  completedPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  soldPriceText: {
    fontSize: 13,
    fontWeight: '700',
  },
  soldItemTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  soldItemDate: {
    fontSize: 11,
  },

  /* Purchase Card */
  purchaseCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.four,
    gap: 6,
  },
  purchaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  purchaseHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  purchaseRef: {
    fontSize: 12,
    fontWeight: '700',
  },
  inEscrowTag: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: Radius.sm,
  },
  inEscrowTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  purchaseTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  purchaseSeller: {
    fontSize: 12,
  },
  purchaseSpotBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginTop: 2,
  },
  purchaseSpotText: {
    fontSize: 11,
    fontWeight: '600',
  },
  purchaseDisclaimer: {
    fontSize: 11,
    lineHeight: 15,
  },

  /* 7. Grouped Account & Safety Section */
  accountSection: {
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  accountSectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginLeft: 4,
  },
  groupedAccountCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: 12,
    gap: 12,
  },
  accountRowIconCircle: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountRowContent: {
    flex: 1,
    gap: 1,
  },
  accountRowTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  accountRowValue: {
    fontSize: 11,
  },
  rowDivider: {
    height: 1,
    marginLeft: 58,
  },

  /* Modals Common */
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalSheet: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
  },
  modalDragNotch: {
    width: 36,
    height: 4,
    borderRadius: Radius.full,
    backgroundColor: '#CCCCCC',
    alignSelf: 'center',
    marginBottom: Spacing.three,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  modalSub: {
    fontSize: 12,
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
  },

  /* Manage Listing Modal Sheet */
  manageHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  manageModalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  manageModalSub: {
    fontSize: 12,
    marginTop: 1,
  },
  manageOptionsList: {
    gap: 8,
  },
  manageOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: 10,
  },
  manageOptionIconCircle: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manageOptionTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  manageOptionDesc: {
    fontSize: 11,
    marginTop: 1,
    lineHeight: 15,
  },

  /* Cash Out & Form Styles */
  modalBalancePill: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginTop: Spacing.two,
  },
  modalBalanceLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  modalBalanceVal: {
    fontSize: 14,
    fontWeight: '800',
  },
  modalInputLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  channelRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  channelCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    gap: 6,
  },
  channelName: {
    fontSize: 13,
  },
  modalInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 9 : 5,
    marginTop: 6,
  },
  countryCode: {
    fontSize: 14,
    fontWeight: '700',
    marginRight: 6,
  },
  currencyPrefix: {
    fontSize: 15,
    fontWeight: '800',
    marginRight: 6,
  },
  modalTextInput: {
    flex: 1,
    fontSize: 14,
  },
  quickFillBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  quickFillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  presetChipsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  presetChip: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  feeNoticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.two,
  },
  feeNoticeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  modalPrimaryActionBtn: {
    paddingVertical: 12,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPrimaryActionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  /* Success View */
  cashOutSuccessContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.three,
    gap: 6,
  },
  successShieldCircle: {
    width: 64,
    height: 64,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  successMainTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  successAmountText: {
    fontSize: 24,
    fontWeight: '800',
  },
  successDescText: {
    fontSize: 12,
    textAlign: 'center',
  },
  successReceiptBox: {
    width: '100%',
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.three,
    gap: 6,
    marginVertical: Spacing.two,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  receiptLabel: {
    fontSize: 11,
  },
  receiptValue: {
    fontSize: 12,
    fontWeight: '700',
  },

  /* Ledger Modal */
  ledgerTxCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginBottom: 8,
  },
  ledgerIconCircle: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ledgerTxTitle: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  ledgerTxAmount: {
    fontSize: 13,
    fontWeight: '800',
  },
  ledgerTxSub: {
    fontSize: 10,
  },
  ledgerTxStatus: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  ledgerTxNotes: {
    fontSize: 10,
    marginTop: 2,
  },

  /* Center Dialog Box */
  centerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  dialogBox: {
    width: '100%',
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.four,
    alignItems: 'center',
    gap: 10,
  },
  dialogIconBox: {
    width: 52,
    height: 52,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogTitle: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  dialogBody: {
    fontSize: 12,
    lineHeight: 17,
  },
  dialogBtn: {
    width: '100%',
    paddingVertical: 11,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  dialogBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  /* Quick Spot Chips */
  quickSpotChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: Spacing.two,
  },
  quickSpotChip: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  quickSpotChipText: {
    fontSize: 11,
    fontWeight: '600',
  },

  /* App Appearance Option Card */
  appearanceOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.three,
  },
  appearanceOptionTitle: {
    fontSize: 14,
    marginBottom: 2,
  },
  appearanceOptionDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  radioIndicator: {
    width: 22,
    height: 22,
    borderRadius: Radius.full,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* E-Wallet Channel Logos */
  rowGcashLogo: {
    width: 20,
    height: 18,
  },
  rowMayaLogo: {
    width: 22,
    height: 11,
  },
  rowChannelBadge: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeGcashLogo: {
    width: 24,
    height: 11,
  },
  badgeMayaLogo: {
    width: 26,
    height: 9,
  },
  channelLogoBoxGcash: {
    width: 26,
    height: 22,
    borderRadius: Radius.sm,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelLogoImgGcash: {
    width: 18,
    height: 16,
  },
  channelLogoBoxMaya: {
    width: 28,
    height: 22,
    borderRadius: Radius.sm,
    backgroundColor: '#0A1810',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  channelLogoImgMaya: {
    width: 22,
    height: 10,
  },

  /* Profile Photo Picker & Profile Editing Sheet Styles */
  photoOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  photoOptionIconCircle: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoOptionTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  photoOptionDesc: {
    fontSize: 12,
    fontWeight: '400',
    marginTop: 1,
  },
  presetSection: {
    marginTop: 6,
    gap: 8,
  },
  presetSectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  avatarPresetsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarPresetThumb: {
    width: 52,
    height: 52,
    borderRadius: Radius.full,
    overflow: 'hidden',
    borderWidth: 2,
    position: 'relative',
  },
  presetSelectedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  editAvatarCenterRow: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  editAvatarPressable: {
    alignItems: 'center',
    gap: 6,
  },
  editAvatarCircle: {
    width: 68,
    height: 68,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 2,
  },
  editAvatarInitials: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },
  editAvatarCameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  editAvatarHint: {
    fontSize: 12,
    fontWeight: '600',
  },
  yearLevelChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  yearLevelChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  yearLevelChipText: {
    fontSize: 12,
  },
});
