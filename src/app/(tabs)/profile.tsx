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
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useItems } from '@/context/items-context';
import { INITIAL_GREEN_IMPACT } from '@/data/mock-items';
import { EscrowTransaction, MarketplaceItem } from '@/types/item';

type ListingTab = 'active' | 'sold' | 'purchases';
type CashOutChannel = 'gcash' | 'maya';

export default function ProfileScreen() {
  const theme = useTheme();
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

  // Content tab: Active Listings, Sold, Purchases (Mental model of marketplace items)
  const [activeTab, setActiveTab] = useState<ListingTab>('active');

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

  // Escrow Ledger Modal
  const [isLedgerModalVisible, setIsLedgerModalVisible] = useState(false);

  // Escrow Explainer Modal
  const [isEscrowGuideVisible, setIsEscrowGuideVisible] = useState(false);

  // Edit Meetup Spot Modal
  const [isEditSpotModalVisible, setIsEditSpotModalVisible] = useState(false);
  const [preferredSpot, setPreferredSpot] = useState('Nursing Bldg Lobby (Burns Hall)');
  const [tempSpot, setTempSpot] = useState(preferredSpot);

  // Settings toggles
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Action feedback toast
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Filter items owned by current student ('Maria Santos' or 'You')
  const userItems = items.filter(
    (item) => item.sellerName === 'Maria Santos' || item.sellerName === 'You'
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

  // Handle Listing Bump (Goal #6)
  const handleBump = (item: MarketplaceItem) => {
    bumpItem(item.id);
    setActionFeedback(`"${item.title.substring(0, 22)}..." bumped to top of feed!`);
    setTimeout(() => setActionFeedback(null), 3500);
  };

  // Handle Urgent Selling Badge Toggle (Goal #6)
  const handleToggleUrgent = (item: MarketplaceItem) => {
    toggleUrgent(item.id);
    const newState = !item.isUrgent;
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
    setActionFeedback(`"${item.title.substring(0, 22)}..." marked as Sold!`);
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

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + Spacing.four,
            paddingBottom: insets.bottom + 110,
          },
        ]}>
        {/* ================= TOP HEADER (TITLE + SETTINGS SHORTCUT) ================= */}
        <View style={styles.topHeaderBar}>
          <View>
            <Text style={[styles.largeTitle, { color: theme.text }]}>Profile</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Verified Campus Student Hub
            </Text>
          </View>

          {/* Quick Settings Icon Button */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open Account Settings"
            style={[
              styles.settingsIconBtn,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
            onPress={() => {
              // Scrolls smoothly to the settings section at the bottom
              Alert.alert(
                'CampusGreen Settings',
                `Institutional Account: msantos@gbox.adnu.edu.ph\nCampus: Ateneo de Naga University\nStatus: Verified Student`,
                [{ text: 'OK' }]
              );
            }}>
            <Ionicons name="settings-outline" size={20} color={theme.text} />
          </Pressable>
        </View>

        {/* Action Feedback Banner */}
        {actionFeedback && (
          <View
            style={[
              styles.feedbackBanner,
              { backgroundColor: theme.badgeGreenBg, borderColor: theme.primary },
            ]}>
            <Ionicons name="checkmark-circle" size={18} color={theme.primary} />
            <Text style={[styles.feedbackBannerText, { color: theme.primaryDark }]}>
              {actionFeedback}
            </Text>
          </View>
        )}

        {/* ================= 1. STUDENT IDENTITY & REPUTATION CARD ================= */}
        <View
          style={[
            styles.identityCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}>
          <View style={styles.identityTopRow}>
            {/* Student Avatar */}
            <View style={[styles.avatarCircle, { backgroundColor: theme.primary }]}>
              <Text style={styles.avatarInitials}>MS</Text>
              <View style={styles.verifiedShieldBadge}>
                <Ionicons name="shield-checkmark" size={13} color="#FFFFFF" />
              </View>
            </View>

            {/* Student Details */}
            <View style={styles.identityDetails}>
              <View style={styles.nameRow}>
                <Text style={[styles.studentName, { color: theme.text }]}>Maria Santos</Text>
                <View style={[styles.verifiedTag, { backgroundColor: theme.badgeGreenBg }]}>
                  <Text style={[styles.verifiedTagText, { color: theme.badgeGreenText }]}>
                    Verified Student
                  </Text>
                </View>
              </View>

              <Text style={[styles.degreeProgram, { color: theme.textSecondary }]}>
                BS Nursing • 3rd Year
              </Text>
              <Text style={[styles.campusText, { color: theme.primary }]}>
                Ateneo de Naga University
              </Text>
            </View>
          </View>

          {/* Trust & Reputation Metrics */}
          <View
            style={[
              styles.reputationMetricsRow,
              { backgroundColor: theme.surfaceSubtle, borderColor: theme.borderSubtle },
            ]}>
            <View style={styles.reputationMetricItem}>
              <View style={styles.metricValRow}>
                <Ionicons name="star" size={15} color={theme.gold} style={{ marginRight: 3 }} />
                <Text style={[styles.metricValText, { color: theme.text }]}>4.9</Text>
              </View>
              <Text style={[styles.metricLabelText, { color: theme.textSecondary }]}>
                24 Reviews
              </Text>
            </View>

            <View style={[styles.metricDivider, { backgroundColor: theme.border }]} />

            <View style={styles.reputationMetricItem}>
              <Text style={[styles.metricValText, { color: theme.primary }]}>100%</Text>
              <Text style={[styles.metricLabelText, { color: theme.textSecondary }]}>
                Meetup Rate
              </Text>
            </View>

            <View style={[styles.metricDivider, { backgroundColor: theme.border }]} />

            <View style={styles.reputationMetricItem}>
              <Text style={[styles.metricValText, { color: theme.text }]}>0</Text>
              <Text style={[styles.metricLabelText, { color: theme.textSecondary }]}>
                Disputes
              </Text>
            </View>
          </View>

          {/* Personal Green Impact Mini-Strip */}
          <View style={styles.greenImpactStrip}>
            <View style={styles.greenImpactItem}>
              <Ionicons name="leaf-outline" size={14} color={theme.primary} />
              <Text style={[styles.greenImpactLabel, { color: theme.textSecondary }]}>
                {INITIAL_GREEN_IMPACT.userCo2SavedKg} kg CO₂ saved
              </Text>
            </View>
            <Text style={{ color: theme.textMuted }}>•</Text>
            <View style={styles.greenImpactItem}>
              <Ionicons name="repeat-outline" size={14} color={theme.primary} />
              <Text style={[styles.greenImpactLabel, { color: theme.textSecondary }]}>
                {INITIAL_GREEN_IMPACT.userItemsReused} items reused
              </Text>
            </View>
            <Text style={{ color: theme.textMuted }}>•</Text>
            <View style={styles.greenImpactItem}>
              <Ionicons name="wallet-outline" size={14} color={theme.primary} />
              <Text style={[styles.greenImpactLabel, { color: theme.textSecondary }]}>
                ₱{INITIAL_GREEN_IMPACT.userMoneySavedPhp} saved
              </Text>
            </View>
          </View>
        </View>

        {/* ================= 2. REDESIGNED ESCROW WALLET CARD ================= */}
        <View
          style={[
            styles.escrowWalletCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}>
          {/* Wallet Card Header */}
          <View style={styles.walletHeaderRow}>
            <View style={styles.walletTitleGroup}>
              <View style={[styles.walletIconCircle, { backgroundColor: theme.badgeGreenBg }]}>
                <Ionicons name="shield-checkmark" size={20} color={theme.primary} />
              </View>
              <View>
                <Text style={[styles.walletTitle, { color: theme.text }]}>Campus Escrow Wallet</Text>
                <Text style={[styles.walletSubtitle, { color: theme.textSecondary }]}>
                  Buyer Protection & Cleared Funds
                </Text>
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="How Escrow Protection Works"
              style={styles.escrowInfoBadge}
              onPress={() => setIsEscrowGuideVisible(true)}>
              <Ionicons name="help-circle-outline" size={16} color={theme.primary} />
              <Text style={[styles.escrowInfoBadgeText, { color: theme.primary }]}>How it works</Text>
            </Pressable>
          </View>

          {/* Main Balance Display */}
          <View style={styles.mainBalanceSection}>
            <Text style={[styles.mainBalanceLabel, { color: theme.textSecondary }]}>
              AVAILABLE FOR CASH-OUT
            </Text>
            <Text style={[styles.mainBalanceFigure, { color: theme.text }]}>
              ₱{wallet.availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </Text>

            {/* In Escrow Pill (Funds pending physical handover inspection) */}
            <View
              style={[
                styles.inEscrowPill,
                { backgroundColor: theme.surfaceSubtle, borderColor: theme.borderSubtle },
              ]}>
              <Ionicons name="lock-closed" size={14} color={theme.gold} style={{ marginRight: 6 }} />
              <Text style={[styles.inEscrowPillText, { color: theme.textSecondary }]}>
                <Text style={{ fontWeight: '700', color: theme.text }}>
                  ₱{wallet.inEscrowBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </Text>{' '}
                locked in escrow (pending meetup inspection)
              </Text>
            </View>
          </View>

          {/* Generously Spaced Action Dock */}
          <View style={styles.walletActionDock}>
            {/* Primary Cash Out Button */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cash out available escrow funds"
              style={[styles.primaryCashOutBtn, { backgroundColor: theme.primary }]}
              onPress={() => setIsCashOutModalVisible(true)}>
              <Ionicons name="arrow-up-circle" size={19} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.primaryCashOutBtnText}>Cash Out Funds</Text>
            </Pressable>

            {/* Secondary Escrow Ledger Button */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="View escrow transactions ledger"
              style={[
                styles.secondaryLedgerBtn,
                { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
              ]}
              onPress={() => setIsLedgerModalVisible(true)}>
              <Ionicons name="receipt-outline" size={17} color={theme.text} style={{ marginRight: 5 }} />
              <Text style={[styles.secondaryLedgerBtnText, { color: theme.text }]}>
                Transaction Ledger
              </Text>
            </Pressable>
          </View>

          {/* Fee Notice */}
          <View style={[styles.walletFooterNotice, { borderTopColor: theme.borderSubtle }]}>
            <Ionicons name="checkmark-done-circle" size={15} color={theme.primary} />
            <Text style={[styles.walletFooterNoticeText, { color: theme.textSecondary }]}>
              ₱0 student fee to GCash & Maya • Funds auto-release upon meetup verification
            </Text>
          </View>
        </View>

        {/* ================= 3. MARKETPLACE LISTINGS SEGMENT TABS ================= */}
        {/* Adheres to standard mental models: Active, Sold, Purchases */}
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
                  fontWeight: activeTab === 'active' ? '700' : '500',
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
                  fontWeight: activeTab === 'sold' ? '700' : '500',
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
                  fontWeight: activeTab === 'purchases' ? '700' : '500',
                },
              ]}>
              My Orders ({studentPurchases.length})
            </Text>
          </Pressable>
        </View>

        {/* ================= 4. TAB 1: ACTIVE LISTINGS & GROWTH TOOLS (GOAL #6) ================= */}
        {activeTab === 'active' && (
          <View style={styles.tabContentBlock}>
            {/* Seller Success Growth Banner */}
            <View
              style={[
                styles.growthPromoCard,
                { backgroundColor: theme.badgeGreenBg, borderColor: theme.primaryLight },
              ]}>
              <View style={styles.growthPromoHeader}>
                <Ionicons name="rocket" size={17} color={theme.primary} />
                <Text style={[styles.growthPromoTitle, { color: theme.primaryDark }]}>
                  Seller Success Growth Tools
                </Text>
              </View>
              <Text style={[styles.growthPromoBody, { color: theme.primaryDark }]}>
                Need to sell fast before exam week or dorm move-out? Use{' '}
                <Text style={{ fontWeight: '700' }}>Listing Bumps</Text> to jump to the top of the feed
                and toggle <Text style={{ fontWeight: '700' }}>Urgent Selling Badges</Text> for 3x higher
                campus visibility.
              </Text>
            </View>

            {/* Active Items List */}
            {activeListings.length === 0 ? (
              <View
                style={[
                  styles.emptyStateBox,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}>
                <Ionicons name="cube-outline" size={38} color={theme.textMuted} />
                <Text style={[styles.emptyStateTitle, { color: theme.text }]}>No active items</Text>
                <Text style={[styles.emptyStateSubtitle, { color: theme.textSecondary }]}>
                  List pre-loved uniforms, books, or gear to earn cash and reduce campus waste.
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
                          name={
                            item.category === 'Uniforms & Scrubs'
                              ? 'shirt-outline'
                              : item.category === 'Textbooks & Reviewers'
                              ? 'book-outline'
                              : 'cube-outline'
                          }
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

                        {/* Actionable Urgent Badge */}
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
                          <Ionicons name="eye-outline" size={13} color={theme.textMuted} />
                          <Text style={[styles.statMiniText, { color: theme.textMuted }]}>
                            {item.viewsCount ?? 142} views
                          </Text>
                        </View>
                        <Text style={{ color: theme.border }}>•</Text>
                        <View style={styles.statMiniItem}>
                          <Ionicons name="chatbubble-outline" size={13} color={theme.textMuted} />
                          <Text style={[styles.statMiniText, { color: theme.textMuted }]}>
                            {item.inquiriesCount ?? 6} inquiries
                          </Text>
                        </View>
                        <Text style={{ color: theme.border }}>•</Text>
                        <View style={styles.statMiniItem}>
                          <Ionicons name="arrow-up-circle-outline" size={13} color={theme.primary} />
                          <Text style={[styles.statMiniText, { color: theme.primary, fontWeight: '700' }]}>
                            {item.bumpCount ?? 0} bumps
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Growth Tools & Action Dock */}
                  <View style={[styles.growthToolsDock, { borderTopColor: theme.borderSubtle }]}>
                    {/* Tool 1: Listing Bump */}
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Bump listing to top of discovery feed"
                      style={[
                        styles.growthToolBtn,
                        { backgroundColor: theme.primaryLight, borderColor: theme.primary },
                      ]}
                      onPress={() => handleBump(item)}>
                      <Ionicons name="arrow-up" size={15} color={theme.primary} />
                      <Text style={[styles.growthToolBtnText, { color: theme.primary }]}>Bump to Top</Text>
                    </Pressable>

                    {/* Tool 2: Urgent Selling Badge Toggle */}
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Toggle urgent selling badge"
                      style={[
                        styles.growthToolBtn,
                        {
                          backgroundColor: item.isUrgent ? '#FEE2E2' : theme.surfaceSubtle,
                          borderColor: item.isUrgent ? '#DC2626' : theme.border,
                        },
                      ]}
                      onPress={() => handleToggleUrgent(item)}>
                      <Ionicons
                        name="flash-outline"
                        size={15}
                        color={item.isUrgent ? '#DC2626' : theme.textSecondary}
                      />
                      <Text
                        style={[
                          styles.growthToolBtnText,
                          { color: item.isUrgent ? '#DC2626' : theme.textSecondary },
                        ]}>
                        {item.isUrgent ? 'Urgent On' : 'Set Urgent'}
                      </Text>
                    </Pressable>

                    {/* Action 3: Mark Reserved */}
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Toggle reserved status"
                      style={[
                        styles.growthToolBtn,
                        {
                          backgroundColor: item.isReserved ? theme.border : theme.surfaceSubtle,
                          borderColor: theme.border,
                        },
                      ]}
                      onPress={() => handleToggleReserved(item)}>
                      <Ionicons
                        name={item.isReserved ? 'lock-open-outline' : 'lock-closed-outline'}
                        size={14}
                        color={theme.textSecondary}
                      />
                      <Text style={[styles.growthToolBtnText, { color: theme.textSecondary }]}>
                        {item.isReserved ? 'Unreserve' : 'Reserve'}
                      </Text>
                    </Pressable>

                    {/* Action 4: Mark Sold */}
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Mark item as sold"
                      style={[
                        styles.growthToolBtn,
                        { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
                      ]}
                      onPress={() => handleMarkSold(item)}>
                      <Ionicons name="checkmark-done" size={15} color={theme.primary} />
                      <Text style={[styles.growthToolBtnText, { color: theme.primary }]}>Sold</Text>
                    </Pressable>

                    {/* Action 5: Delete */}
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Delete listing"
                      style={styles.deleteListingBtn}
                      onPress={() => handleDeleteConfirm(item)}>
                      <Ionicons name="trash-outline" size={16} color={theme.error} />
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
                <Ionicons name="checkmark-circle-outline" size={38} color={theme.textMuted} />
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
                      <Ionicons name="medkit-outline" size={26} color={theme.textMuted} />
                    </View>
                    <View style={{ flex: 1, gap: 3 }}>
                      <View style={styles.soldBadgeRow}>
                        <View style={[styles.completedPill, { backgroundColor: theme.badgeGreenBg }]}>
                          <Ionicons name="checkmark-circle" size={12} color={theme.primary} />
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
                        Verified Meetup at {item.safeMeetupSpot}
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
                    <Ionicons name="shield-checkmark" size={16} color={theme.primary} />
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
                  <Ionicons name="location" size={15} color={theme.primary} />
                  <Text style={[styles.purchaseSpotText, { color: theme.text }]}>
                    Campus Safe Meetup: {p.safeMeetupSpot}
                  </Text>
                </View>

                <Text style={[styles.purchaseDisclaimer, { color: theme.textMuted }]}>
                  Your payment is locked safely in escrow. Inspect the item in person before confirming
                  receipt. 72-hour auto-completion applies following meetup.
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* ================= 7. ACCOUNT PREFERENCES & CAMPUS SAFETY ================= */}
        {/* Replaces the awkward "Settings as a tab" mental model with native grouped rows */}
        <View style={styles.accountSection}>
          <Text style={[styles.accountSectionHeading, { color: theme.text }]}>
            Campus Safety & Account Preferences
          </Text>

          <View
            style={[
              styles.groupedAccountCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}>
            {/* Row 1: Default Safe Meetup Spot */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Edit preferred campus safe meetup spot"
              style={styles.accountRow}
              onPress={() => {
                setTempSpot(preferredSpot);
                setIsEditSpotModalVisible(true);
              }}>
              <View style={[styles.accountRowIconCircle, { backgroundColor: theme.badgeGreenBg }]}>
                <Ionicons name="location-outline" size={18} color={theme.primary} />
              </View>
              <View style={styles.accountRowContent}>
                <Text style={[styles.accountRowTitle, { color: theme.text }]}>
                  Preferred Safe Meetup Spot
                </Text>
                <Text style={[styles.accountRowValue, { color: theme.textSecondary }]} numberOfLines={1}>
                  {preferredSpot}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
            </Pressable>

            <View style={[styles.rowDivider, { backgroundColor: theme.borderSubtle }]} />

            {/* Row 2: Campus Institutional Verification */}
            <View style={styles.accountRow}>
              <View style={[styles.accountRowIconCircle, { backgroundColor: theme.badgeGreenBg }]}>
                <Ionicons name="school-outline" size={18} color={theme.primary} />
              </View>
              <View style={styles.accountRowContent}>
                <Text style={[styles.accountRowTitle, { color: theme.text }]}>
                  Student Verification
                </Text>
                <Text style={[styles.accountRowValue, { color: theme.primary }]}>
                  Active • Ateneo de Naga (.edu.ph)
                </Text>
              </View>
              <Ionicons name="checkmark-circle" size={18} color={theme.primary} />
            </View>

            <View style={[styles.rowDivider, { backgroundColor: theme.borderSubtle }]} />

            {/* Row 3: Escrow Buyer & Seller Protection Guide */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="View Escrow Protection Guide"
              style={styles.accountRow}
              onPress={() => setIsEscrowGuideVisible(true)}>
              <View style={[styles.accountRowIconCircle, { backgroundColor: theme.surfaceSubtle }]}>
                <Ionicons name="lock-closed-outline" size={18} color={theme.text} />
              </View>
              <View style={styles.accountRowContent}>
                <Text style={[styles.accountRowTitle, { color: theme.text }]}>
                  Escrow Protection & 72h Guarantee
                </Text>
                <Text style={[styles.accountRowValue, { color: theme.textSecondary }]}>
                  How your payments and sales are safeguarded
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
            </Pressable>

            <View style={[styles.rowDivider, { backgroundColor: theme.borderSubtle }]} />

            {/* Row 4: Notifications Toggle */}
            <View style={styles.accountRow}>
              <View style={[styles.accountRowIconCircle, { backgroundColor: theme.surfaceSubtle }]}>
                <Ionicons name="notifications-outline" size={18} color={theme.text} />
              </View>
              <View style={styles.accountRowContent}>
                <Text style={[styles.accountRowTitle, { color: theme.text }]}>
                  Escrow & Handover Alerts
                </Text>
                <Text style={[styles.accountRowValue, { color: theme.textSecondary }]}>
                  Instant push notices on payouts and meetup arrivals
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

            {/* Row 5: Log Out */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Log out of student account"
              style={styles.accountRow}
              onPress={handleSignOut}>
              <View style={[styles.accountRowIconCircle, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="log-out-outline" size={18} color={theme.error} />
              </View>
              <View style={styles.accountRowContent}>
                <Text style={[styles.accountRowTitle, { color: theme.error, fontWeight: '700' }]}>
                  Log Out
                </Text>
                <Text style={[styles.accountRowValue, { color: theme.textSecondary }]}>
                  Signed in as msantos@gbox.adnu.edu.ph
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* ================= 8. CASH-OUT BOTTOM SHEET MODAL ================= */}
      <Modal
        visible={isCashOutModalVisible}
        transparent
        animationType="slide"
        onRequestClose={handleCloseCashOutModal}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={handleCloseCashOutModal} />

          <View style={[styles.modalSheet, { backgroundColor: theme.surface, paddingBottom: insets.bottom + 24 }]}>
            <View style={styles.modalDragNotch} />

            {cashOutSuccess ? (
              /* Success Receipt View */
              <View style={styles.cashOutSuccessContainer}>
                <View style={[styles.successShieldCircle, { backgroundColor: theme.badgeGreenBg }]}>
                  <Ionicons name="checkmark-circle" size={48} color={theme.primary} />
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
                      Reference Code:
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

                {/* Step 1: Select Channel (Clean Slate Invariant: starts null) */}
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
                    <Ionicons
                      name="wallet-outline"
                      size={20}
                      color={cashOutChannel === 'gcash' ? theme.primary : theme.textSecondary}
                    />
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
                      <Ionicons name="checkmark-circle" size={16} color={theme.primary} />
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
                    <Ionicons
                      name="card-outline"
                      size={20}
                      color={cashOutChannel === 'maya' ? theme.primary : theme.textSecondary}
                    />
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
                      <Ionicons name="checkmark-circle" size={16} color={theme.primary} />
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
                    onPress={() => setCashOutAccount('0917 824 5519')}
                    style={styles.quickFillBtn}>
                    <Text style={[styles.quickFillText, { color: theme.primary }]}>Registered</Text>
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
                  <Ionicons name="checkmark-done" size={14} color={theme.primary} />
                  <Text style={[styles.feeNoticeText, { color: theme.primaryDark }]}>
                    ₱0.00 Student Transfer Fee • Instant disbursement
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

      {/* ================= 9. ESCROW LEDGER MODAL SHEET ================= */}
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
                <Text style={[styles.modalTitle, { color: theme.text }]}>Escrow & Payout Ledger</Text>
                <Text style={[styles.modalSub, { color: theme.textSecondary }]}>
                  Record of escrow locks, completed releases, and disbursements
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
                        size={17}
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

      {/* ================= 10. ESCROW EXPLAINER MODAL ================= */}
      <Modal
        visible={isEscrowGuideVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsEscrowGuideVisible(false)}>
        <View style={styles.centerModalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setIsEscrowGuideVisible(false)} />
          <View style={[styles.dialogBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.dialogIconBox, { backgroundColor: theme.badgeGreenBg }]}>
              <Ionicons name="shield-checkmark" size={32} color={theme.primary} />
            </View>
            <Text style={[styles.dialogTitle, { color: theme.text }]}>
              CampusGreen Escrow Protection
            </Text>
            <Text style={[styles.dialogBody, { color: theme.textSecondary }]}>
              1. <Text style={{ fontWeight: '700', color: theme.text }}>Lock in Escrow:</Text> When a
              buyer pays digitally via GCash or Maya, payment is locked safely in platform escrow.
              {'\n\n'}
              2. <Text style={{ fontWeight: '700', color: theme.text }}>Safe Meetup Inspection:</Text>{' '}
              Buyer and seller meet at the designated on-campus safe meetup spot (library, guard post).
              Buyer inspects the textbook, scrubs, or gadget.
              {'\n\n'}
              3. <Text style={{ fontWeight: '700', color: theme.text }}>Instant Release:</Text> Once
              handed over, buyer taps confirm, or the 72-hour auto-completion window finishes without dispute.
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

      {/* ================= 11. EDIT MEETUP SPOT MODAL ================= */}
      <Modal
        visible={isEditSpotModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsEditSpotModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setIsEditSpotModalVisible(false)} />
          <View style={[styles.modalSheet, { backgroundColor: theme.surface, paddingBottom: insets.bottom + 24 }]}>
            <View style={styles.modalDragNotch} />
            <Text style={[styles.modalTitle, { color: theme.text }]}>Update Preferred Meetup Spot</Text>
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

  /* Top Header Bar */
  topHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
  },
  largeTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  settingsIconBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: 8,
  },
  feedbackBannerText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },

  /* 1. Student Identity Card */
  identityCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  identityTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarCircle: {
    width: 62,
    height: 62,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  verifiedShieldBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#1F5C3A',
    width: 20,
    height: 20,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  identityDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  studentName: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  verifiedTag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  verifiedTagText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  degreeProgram: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  campusText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 1,
  },
  reputationMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  reputationMetricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricValRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricValText: {
    fontSize: 16,
    fontWeight: '800',
  },
  metricLabelText: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 24,
  },
  greenImpactStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 4,
  },
  greenImpactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  greenImpactLabel: {
    fontSize: 11,
    fontWeight: '600',
  },

  /* 2. Redesigned Escrow Wallet Card */
  escrowWalletCard: {
    borderRadius: Radius.xl,
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
    gap: 10,
  },
  walletIconCircle: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  walletSubtitle: {
    fontSize: 11,
  },
  escrowInfoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  escrowInfoBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  mainBalanceSection: {
    gap: 4,
    marginTop: 2,
  },
  mainBalanceLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  mainBalanceFigure: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  inEscrowPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginTop: 4,
  },
  inEscrowPillText: {
    fontSize: 12,
    flex: 1,
  },
  walletActionDock: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  primaryCashOutBtn: {
    flex: 1.2,
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
  secondaryLedgerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  secondaryLedgerBtnText: {
    fontSize: 13,
    fontWeight: '600',
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

  /* 3. Marketplace Segment Tabs */
  segmentedTabsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
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

  /* 4. Tab Content Block */
  tabContentBlock: {
    gap: Spacing.three,
  },
  growthPromoCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.three,
    gap: 4,
  },
  growthPromoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  growthPromoTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  growthPromoBody: {
    fontSize: 12,
    lineHeight: 17,
  },

  /* Listing Card */
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
    width: 76,
    height: 76,
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
    marginTop: 2,
  },
  listingSubtext: {
    fontSize: 11,
  },
  listingStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  statMiniItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statMiniText: {
    fontSize: 11,
  },
  growthToolsDock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderTopWidth: 1,
    paddingTop: Spacing.two,
  },
  growthToolBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: Radius.sm,
    borderWidth: 1,
    gap: 3,
  },
  growthToolBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  deleteListingBtn: {
    padding: 7,
    borderRadius: Radius.sm,
  },

  /* Empty state */
  emptyStateBox: {
    padding: Spacing.six,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
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

  /* Sold card */
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
    width: 64,
    height: 64,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
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

  /* Purchase card */
  purchaseCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.four,
    gap: 8,
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
    paddingHorizontal: 8,
    paddingVertical: 3,
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
    paddingVertical: 7,
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

  /* 7. Grouped Account & Campus Safety Section */
  accountSection: {
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  accountSectionHeading: {
    fontSize: 15,
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
    paddingVertical: 13,
    gap: 12,
  },
  accountRowIconCircle: {
    width: 34,
    height: 34,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountRowContent: {
    flex: 1,
    gap: 2,
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
    marginLeft: 60,
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
    paddingHorizontal: Spacing.five,
    paddingTop: Spacing.three,
  },
  modalDragNotch: {
    width: 38,
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
    fontSize: 18,
    fontWeight: '800',
  },
  modalSub: {
    fontSize: 12,
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalBalancePill: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginTop: Spacing.three,
  },
  modalBalanceLabel: {
    fontSize: 12,
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
    gap: 10,
    marginTop: 6,
  },
  channelCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    gap: 8,
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
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    marginTop: 6,
  },
  countryCode: {
    fontSize: 14,
    fontWeight: '700',
    marginRight: 6,
  },
  currencyPrefix: {
    fontSize: 16,
    fontWeight: '800',
    marginRight: 6,
  },
  modalTextInput: {
    flex: 1,
    fontSize: 14,
  },
  quickFillBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  quickFillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  presetChipsRow: {
    flexDirection: 'row',
    gap: 8,
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
    marginTop: Spacing.three,
  },
  feeNoticeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  modalPrimaryActionBtn: {
    paddingVertical: 13,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPrimaryActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  /* Success View */
  cashOutSuccessContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.four,
    gap: 8,
  },
  successShieldCircle: {
    width: 70,
    height: 70,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  successMainTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  successAmountText: {
    fontSize: 26,
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
    marginVertical: Spacing.three,
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

  /* Ledger modal styles */
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
    padding: Spacing.five,
  },
  dialogBox: {
    width: '100%',
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.five,
    alignItems: 'center',
    gap: 12,
  },
  dialogIconBox: {
    width: 56,
    height: 56,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogTitle: {
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  dialogBody: {
    fontSize: 12,
    lineHeight: 18,
  },
  dialogBtn: {
    width: '100%',
    paddingVertical: 12,
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
    marginTop: Spacing.three,
  },
  quickSpotChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  quickSpotChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
