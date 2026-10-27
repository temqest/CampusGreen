import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { MOCK_ITEMS } from '@/data/mock-items';

type PaymentMethod = 'gcash' | 'maya' | 'qrph';

const GCASH_LOGO = require('@/assets/gcash.svg');
const MAYA_LOGO = require('@/assets/maya.svg');
const QRPH_LOGO = require('@/assets/qr-ph.svg');

export default function PaymentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const item = MOCK_ITEMS.find((i) => i.id === id) || MOCK_ITEMS[0];
  const itemPrice = item.price ?? 0;

  // Zero Pre-Selection Invariant: Options must start unselected (null)
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [mobileNumber, setMobileNumber] = useState('');
  const [paymentState, setPaymentState] = useState<'idle' | 'processing' | 'success'>('idle');
  const [referenceCode, setReferenceCode] = useState('');

  const handleSelectMethod = (method: PaymentMethod) => {
    setSelectedMethod(method);
  };

  const handleUseMyNumber = () => {
    setMobileNumber('0917 824 5519');
  };

  const handlePay = () => {
    if (!selectedMethod || paymentState === 'processing') return;

    setPaymentState('processing');

    setTimeout(() => {
      const code = 'CG-ESC-' + Math.floor(100000 + Math.random() * 900000);
      setReferenceCode(code);
      setPaymentState('success');
    }, 1200);
  };

  const getMethodDisplayName = (method: PaymentMethod | null) => {
    switch (method) {
      case 'gcash':
        return 'GCash';
      case 'maya':
        return 'Maya';
      case 'qrph':
        return 'QR Ph';
      default:
        return '';
    }
  };

  // SUCCESS / ESCROW RECEIPT VIEW
  if (paymentState === 'success') {
    return (
      <View style={[styles.screen, { backgroundColor: theme.background }]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: insets.top + Spacing.five,
              paddingBottom: insets.bottom + 170,
            },
          ]}>
          {/* Escrow Shield Success Hero */}
          <View style={styles.successHero}>
            <View
              style={[
                styles.successIconOuter,
                { backgroundColor: theme.badgeGreenBg },
              ]}>
              <View
                style={[
                  styles.successIconInner,
                  { backgroundColor: theme.primary },
                ]}>
                <Ionicons name="shield-checkmark" size={40} color="#FFFFFF" />
              </View>
            </View>

            <Text style={[styles.successTitle, { color: theme.text }]}>
              Payment Secured in Escrow
            </Text>
            <Text
              style={[styles.successSubtitle, { color: theme.textSecondary }]}>
              ₱{itemPrice.toLocaleString()} is safely held by CampusGreen until
              you meet {item.sellerName} and confirm item inspection.
            </Text>
          </View>

          {/* Receipt Card */}
          <View
            style={[
              styles.receiptCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}>
            <View style={styles.receiptRow}>
              <Text style={[styles.receiptLabel, { color: theme.textSecondary }]}>
                Reference Code
              </Text>
              <Text style={[styles.receiptValueMono, { color: theme.primaryDark }]}>
                {referenceCode}
              </Text>
            </View>

            <View style={[styles.receiptDivider, { backgroundColor: theme.borderSubtle }]} />

            <View style={styles.receiptRow}>
              <Text style={[styles.receiptLabel, { color: theme.textSecondary }]}>
                Item Purchased
              </Text>
              <Text
                numberOfLines={1}
                style={[styles.receiptValue, { color: theme.text, flex: 1, textAlign: 'right' }]}>
                {item.title}
              </Text>
            </View>

            <View style={[styles.receiptDivider, { backgroundColor: theme.borderSubtle }]} />

            <View style={styles.receiptRow}>
              <Text style={[styles.receiptLabel, { color: theme.textSecondary }]}>
                Student Seller
              </Text>
              <Text style={[styles.receiptValue, { color: theme.text }]}>
                {item.sellerName} • {item.sellerYear}
              </Text>
            </View>

            <View style={[styles.receiptDivider, { backgroundColor: theme.borderSubtle }]} />

            <View style={styles.receiptRow}>
              <Text style={[styles.receiptLabel, { color: theme.textSecondary }]}>
                Payment Channel
              </Text>
              <Text style={[styles.receiptValue, { color: theme.text }]}>
                {getMethodDisplayName(selectedMethod)}
              </Text>
            </View>

            <View style={[styles.receiptDivider, { backgroundColor: theme.borderSubtle }]} />

            <View style={styles.receiptRow}>
              <Text style={[styles.receiptLabelBold, { color: theme.text }]}>
                Total Held in Escrow
              </Text>
              <Text style={[styles.receiptTotalValue, { color: theme.primary }]}>
                ₱{itemPrice.toLocaleString()}
              </Text>
            </View>
          </View>

          {/* Next Steps Meetup Guide */}
          <View
            style={[
              styles.meetupStepCard,
              {
                backgroundColor: theme.surfaceSubtle,
                borderColor: theme.border,
              },
            ]}>
            <View style={styles.meetupStepHeader}>
              <Ionicons name="location" size={20} color={theme.primary} />
              <Text style={[styles.meetupStepTitle, { color: theme.text }]}>
                Designated Safe Meetup Spot
              </Text>
            </View>

            <Text style={[styles.meetupSpotHighlight, { color: theme.primaryDark }]}>
              {item.safeMeetupSpot}
            </Text>
            <Text style={[styles.meetupStepDescription, { color: theme.textSecondary }]}>
              Campus security monitored zone. Message {item.sellerName} to agree
              on a meetup time. After checking the item, tap {`'Release Funds'`} in
              your chat.
            </Text>
          </View>

          {/* 72-Hour Auto-Completion Disclaimer Card */}
          <View
            style={[
              styles.disclaimerCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}>
            <View style={styles.disclaimerHeader}>
              <View
                style={[
                  styles.disclaimerIconBox,
                  { backgroundColor: theme.goldBg },
                ]}>
                <Ionicons name="time-outline" size={16} color={theme.gold} />
              </View>
              <Text style={[styles.disclaimerTitle, { color: theme.text }]}>
                72-Hour Auto-Completion Policy
              </Text>
            </View>
            <Text
              style={[styles.disclaimerBody, { color: theme.textSecondary }]}>
              Once the item is handed over by {item.sellerName}, you have 72
              hours to inspect it and raise any concern. If you do not respond
              or report an issue within 72 hours, CampusGreen will automatically
              mark the transaction as completed without issue and release the
              payment to the seller.
            </Text>
          </View>
        </ScrollView>

        {/* Pinned Bottom Actions */}
        <View
          style={[
            styles.bottomDock,
            {
              backgroundColor: theme.surface,
              borderTopColor: theme.border,
              paddingBottom: Math.max(insets.bottom, 12),
            },
          ]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Message ${item.sellerName} on chat`}
            style={({ pressed }) => [
              styles.primaryBtn,
              {
                backgroundColor: theme.primary,
                opacity: pressed ? 0.88 : 1,
              },
            ]}
            onPress={() =>
              router.replace({
                pathname: '/chat/[id]',
                params: { id: item.id },
              })
            }>
            <Ionicons name="chatbubbles" size={18} color="#FFFFFF" />
            <Text style={[styles.primaryBtnText, { color: '#FFFFFF' }]}>
              Message {item.sellerName} on Chat
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to Marketplace"
            style={({ pressed }) => [
              styles.secondaryBtn,
              {
                borderColor: theme.border,
                backgroundColor: theme.surface,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
            onPress={() => router.replace('/marketplace')}>
            <Ionicons name="arrow-back-outline" size={16} color={theme.text} />
            <Text style={[styles.secondaryBtnText, { color: theme.text }]}>
              Back to Marketplace
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // STANDARD CHECKOUT & PAYMENT SELECTION VIEW
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.screen, { backgroundColor: theme.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + Spacing.two,
            paddingBottom: insets.bottom + 120,
          },
        ]}>
        {/* Header Row: Non-sticky Back Arrow + Checkout Title on same row */}
        <View style={styles.headerRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={({ pressed }) => [
              styles.backBtn,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                opacity: pressed ? 0.75 : 1,
              },
            ]}
            onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color={theme.text} />
          </Pressable>

          <Text style={[styles.pageHeading, { color: theme.text }]}>
            Checkout
          </Text>
        </View>
        {/* Item Summary Card */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}>
          <View style={styles.itemSummaryRow}>
            <View
              style={[
                styles.itemIconBox,
                { backgroundColor: theme.surfaceSubtle },
              ]}>
              <Ionicons name="cube-outline" size={26} color={theme.primary} />
            </View>

            <View style={styles.itemSummaryText}>
              <Text
                numberOfLines={1}
                style={[styles.itemSummaryTitle, { color: theme.text }]}>
                {item.title}
              </Text>
              <Text style={[styles.itemSummaryCampus, { color: theme.textSecondary }]}>
                {item.campus}
              </Text>
              <Text style={[styles.itemSummarySeller, { color: theme.textMuted }]}>
                Seller: {item.sellerName}
              </Text>
            </View>
          </View>

          {/* Safe Meetup Spot Strip */}
          <View
            style={[
              styles.meetupStrip,
              { backgroundColor: theme.surfaceSubtle },
            ]}>
            <Ionicons name="location-outline" size={15} color={theme.primary} />
            <Text
              numberOfLines={1}
              style={[styles.meetupStripText, { color: theme.textSecondary }]}>
              Pickup Zone: {item.safeMeetupSpot}
            </Text>
          </View>
        </View>

        {/* Escrow Protection Reassurance Card */}
        <View
          style={[
            styles.escrowBanner,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}>
          <View
            style={[
              styles.escrowIconBadge,
              { backgroundColor: theme.primaryLight },
            ]}>
            <Ionicons name="shield-checkmark" size={16} color={theme.primary} />
          </View>
          <View style={styles.escrowBannerContent}>
            <Text
              style={[
                styles.escrowBannerTitle,
                { color: theme.text },
              ]}>
              CampusGreen Student Escrow Protection
            </Text>
            <Text
              style={[
                styles.escrowBannerBody,
                { color: theme.textSecondary },
              ]}>
              Payment is held safely in escrow. Funds are transferred to the
              seller only when both of you meet on campus and verify the item.
            </Text>
          </View>
        </View>

        {/* Payment Amount Breakdown */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Payment Summary
          </Text>

          <View style={styles.breakdownRow}>
            <Text style={[styles.breakdownLabel, { color: theme.textSecondary }]}>
              Item Subtotal
            </Text>
            <Text style={[styles.breakdownValue, { color: theme.text }]}>
              ₱{itemPrice.toLocaleString()}
            </Text>
          </View>

          <View style={styles.breakdownRow}>
            <Text style={[styles.breakdownLabel, { color: theme.textSecondary }]}>
              Safe Campus Escrow Fee
            </Text>
            <Text style={[styles.breakdownFree, { color: theme.primary }]}>
              ₱0.00 (Free for Students)
            </Text>
          </View>

          <View
            style={[
              styles.divider,
              { backgroundColor: theme.borderSubtle },
            ]}
          />

          <View style={styles.breakdownRow}>
            <Text style={[styles.totalLabel, { color: theme.text }]}>
              Total Amount
            </Text>
            <Text style={[styles.totalAmount, { color: theme.primary }]}>
              ₱{itemPrice.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Payment Channel Selection */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Select Payment Option
          </Text>
          <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
            Tap your preferred Philippine e-wallet or banking method
          </Text>
        </View>

        {/* OPTION 1: GCash */}
        <Pressable
          accessibilityRole="radio"
          accessibilityLabel="Pay with GCash"
          accessibilityState={{ checked: selectedMethod === 'gcash' }}
          style={({ pressed }) => [
            styles.paymentOptionCard,
            {
              backgroundColor: theme.surface,
              borderColor:
                selectedMethod === 'gcash'
                  ? theme.primary
                  : theme.border,
              borderWidth: selectedMethod === 'gcash' ? 2 : 1,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
          onPress={() => handleSelectMethod('gcash')}>
          <View style={styles.optionHeaderRow}>
            <View style={styles.gcashLogoWrapper}>
              <Image
                source={GCASH_LOGO}
                style={styles.gcashLogoImage}
                contentFit="contain"
              />
            </View>

            <View style={styles.optionTextColumn}>
              <View style={styles.optionTitleRow}>
                <Text style={[styles.optionTitle, { color: theme.text }]}>
                  GCash
                </Text>
              </View>
              <Text
                style={[
                  styles.optionSubtitle,
                  { color: theme.textSecondary },
                ]}>
                Instant pay via GCash mobile number
              </Text>
            </View>

            {/* Custom Radio Button */}
            <View
              style={[
                styles.radioOuter,
                {
                  borderColor:
                    selectedMethod === 'gcash'
                      ? theme.primary
                      : theme.border,
                },
              ]}>
              {selectedMethod === 'gcash' && (
                <View
                  style={[
                    styles.radioInner,
                    { backgroundColor: theme.primary },
                  ]}
                />
              )}
            </View>
          </View>

          {/* GCash Sub-Form */}
          {selectedMethod === 'gcash' && (
            <View style={styles.methodFormExpanded}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                Registered GCash Mobile Number
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: theme.surfaceSubtle,
                    borderColor: theme.border,
                  },
                ]}>
                <Ionicons
                  name="phone-portrait-outline"
                  size={18}
                  color={theme.primary}
                />
                <TextInput
                  value={mobileNumber}
                  onChangeText={setMobileNumber}
                  placeholder="09XX XXX XXXX"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="phone-pad"
                  maxLength={13}
                  style={[styles.textInput, { color: theme.text }]}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Auto-fill student number"
                  onPress={handleUseMyNumber}
                  style={[
                    styles.autoFillBtn,
                    { backgroundColor: theme.badgeGreenBg },
                  ]}>
                  <Text
                    style={[styles.autoFillBtnText, { color: theme.primary }]}>
                    Fill My No.
                  </Text>
                </Pressable>
              </View>
              <Text style={[styles.formHelperText, { color: theme.textMuted }]}>
                You will authorize ₱{itemPrice.toLocaleString()} via secure
                GCash MPIN. Funds are held safely until pickup.
              </Text>
            </View>
          )}
        </Pressable>

        {/* OPTION 2: Maya */}
        <Pressable
          accessibilityRole="radio"
          accessibilityLabel="Pay with Maya"
          accessibilityState={{ checked: selectedMethod === 'maya' }}
          style={({ pressed }) => [
            styles.paymentOptionCard,
            {
              backgroundColor: theme.surface,
              borderColor:
                selectedMethod === 'maya'
                  ? theme.primary
                  : theme.border,
              borderWidth: selectedMethod === 'maya' ? 2 : 1,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
          onPress={() => handleSelectMethod('maya')}>
          <View style={styles.optionHeaderRow}>
            {/* Sleek Maya Dark container to give neon #2FF19E logo authentic contrast */}
            <View style={styles.mayaLogoWrapper}>
              <Image
                source={MAYA_LOGO}
                style={styles.mayaLogoImage}
                contentFit="contain"
              />
            </View>

            <View style={styles.optionTextColumn}>
              <View style={styles.optionTitleRow}>
                <Text style={[styles.optionTitle, { color: theme.text }]}>
                  Maya
                </Text>
              </View>
              <Text
                style={[
                  styles.optionSubtitle,
                  { color: theme.textSecondary },
                ]}>
                Digital bank & wallet checkout
              </Text>
            </View>

            {/* Custom Radio Button */}
            <View
              style={[
                styles.radioOuter,
                {
                  borderColor:
                    selectedMethod === 'maya'
                      ? theme.primary
                      : theme.border,
                },
              ]}>
              {selectedMethod === 'maya' && (
                <View
                  style={[
                    styles.radioInner,
                    { backgroundColor: theme.primary },
                  ]}
                />
              )}
            </View>
          </View>

          {/* Maya Sub-Form */}
          {selectedMethod === 'maya' && (
            <View style={styles.methodFormExpanded}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                Maya Mobile / Account Number
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: theme.surfaceSubtle,
                    borderColor: theme.border,
                  },
                ]}>
                <Ionicons
                  name="wallet-outline"
                  size={18}
                  color={theme.primary}
                />
                <TextInput
                  value={mobileNumber}
                  onChangeText={setMobileNumber}
                  placeholder="09XX XXX XXXX"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="phone-pad"
                  maxLength={13}
                  style={[styles.textInput, { color: theme.text }]}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Auto-fill student number"
                  onPress={handleUseMyNumber}
                  style={[
                    styles.autoFillBtn,
                    { backgroundColor: theme.badgeGreenBg },
                  ]}>
                  <Text
                    style={[styles.autoFillBtnText, { color: theme.primary }]}>
                    Fill My No.
                  </Text>
                </Pressable>
              </View>
              <Text style={[styles.formHelperText, { color: theme.textMuted }]}>
                Protected by BSP escrow. Authorize in Maya app with face ID or
                password.
              </Text>
            </View>
          )}
        </Pressable>

        {/* OPTION 3: QR Ph */}
        <Pressable
          accessibilityRole="radio"
          accessibilityLabel="Pay with QR Ph"
          accessibilityState={{ checked: selectedMethod === 'qrph' }}
          style={({ pressed }) => [
            styles.paymentOptionCard,
            {
              backgroundColor: theme.surface,
              borderColor:
                selectedMethod === 'qrph'
                  ? theme.primary
                  : theme.border,
              borderWidth: selectedMethod === 'qrph' ? 2 : 1,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
          onPress={() => handleSelectMethod('qrph')}>
          <View style={styles.optionHeaderRow}>
            <View style={styles.qrphLogoWrapper}>
              <Image
                source={QRPH_LOGO}
                style={styles.qrphLogoImage}
                contentFit="contain"
              />
            </View>

            <View style={styles.optionTextColumn}>
              <View style={styles.optionTitleRow}>
                <Text style={[styles.optionTitle, { color: theme.text }]}>
                  QR Ph National Standard
                </Text>
              </View>
              <Text
                style={[
                  styles.optionSubtitle,
                  { color: theme.textSecondary },
                ]}>
                Scan with ANY Philippine banking or e-wallet app
              </Text>
            </View>

            {/* Custom Radio Button */}
            <View
              style={[
                styles.radioOuter,
                {
                  borderColor:
                    selectedMethod === 'qrph'
                      ? theme.primary
                      : theme.border,
                },
              ]}>
              {selectedMethod === 'qrph' && (
                <View
                  style={[
                    styles.radioInner,
                    { backgroundColor: theme.primary },
                  ]}
                />
              )}
            </View>
          </View>

          {/* QR Ph Expanded Vector QR Container */}
          {selectedMethod === 'qrph' && (
            <View style={styles.qrExpandedContainer}>
              <Text style={[styles.qrInstructionHeading, { color: theme.text }]}>
                Campus Escrow QR Code
              </Text>
              <Text
                style={[styles.qrInstructionSub, { color: theme.textSecondary }]}>
                Open GCash, Maya, BDO, BPI, UnionBank, RCBC, GoTyme or SeaBank
                and scan below.
              </Text>

              {/* Dynamic Real QR Code Frame */}
              <View
                style={[
                  styles.qrCodeFrame,
                  {
                    backgroundColor: '#FFFFFF',
                    borderColor: theme.border,
                  },
                ]}>
                <View style={styles.qrHeaderRow}>
                  <Image
                    source={QRPH_LOGO}
                    style={styles.qrTopLogo}
                    contentFit="contain"
                  />
                  <View style={styles.qrStandardBadge}>
                    <Text style={styles.qrStandardBadgeText}>BSP COMPLIANT</Text>
                  </View>
                </View>

                {/* Real QR Code Maker Component */}
                <View style={styles.realQrBox}>
                  <QRCode
                    value={`https://pay.campusgreen.ph/escrow?ref=CG-QRPH-${item.id}-${itemPrice}&merchant=CampusGreen&amt=${itemPrice}`}
                    size={176}
                    color="#0F172A"
                    backgroundColor="#FFFFFF"
                    ecl="M"
                  />
                </View>

                {/* QR Metadata */}
                <View style={styles.qrMetadataRow}>
                  <Text style={styles.qrMerchantText}>
                    CAMPUSGREEN • {item.sellerName.toUpperCase()}
                  </Text>
                  <Text style={styles.qrAmountText}>
                    ₱{itemPrice.toLocaleString()}
                  </Text>
                </View>
              </View>

              <Text style={[styles.qrExpiryNote, { color: theme.textMuted }]}>
                Valid for 15 minutes • Single-use secure student transaction
              </Text>
            </View>
          )}
        </Pressable>
      </ScrollView>

      {/* Pinned Bottom Thumb Dock */}
      <View
        style={[
          styles.bottomDock,
          {
            backgroundColor: theme.surface,
            borderTopColor: theme.border,
            paddingBottom: Math.max(insets.bottom, 12),
          },
        ]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            selectedMethod
              ? `Pay ₱${itemPrice.toLocaleString()} with ${getMethodDisplayName(selectedMethod)}`
              : 'Select a payment method'
          }
          disabled={!selectedMethod || paymentState === 'processing'}
          style={({ pressed }) => [
            styles.primaryBtn,
            {
              backgroundColor: selectedMethod ? theme.primary : theme.border,
              opacity:
                !selectedMethod || paymentState === 'processing'
                  ? 0.65
                  : pressed
                  ? 0.88
                  : 1,
            },
          ]}
          onPress={handlePay}>
          {paymentState === 'processing' ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons
              name={selectedMethod ? 'shield-checkmark' : 'lock-closed-outline'}
              size={18}
              color={selectedMethod ? '#FFFFFF' : theme.textMuted}
            />
          )}
          <Text
            style={[
              styles.primaryBtnText,
              { color: selectedMethod ? '#FFFFFF' : theme.textMuted },
            ]}>
            {paymentState === 'processing'
              ? 'Securing Escrow Payment...'
              : selectedMethod
              ? `Pay ₱${itemPrice.toLocaleString()} with ${getMethodDisplayName(selectedMethod)}`
              : 'Select a Payment Method'}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingBottom: Spacing.one,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageHeading: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  scrollContent: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  itemSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  itemIconBox: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemSummaryText: {
    flex: 1,
    gap: 2,
  },
  itemSummaryTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  itemSummaryCampus: {
    fontSize: 12,
  },
  itemSummarySeller: {
    fontSize: 11,
  },
  meetupStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.md,
  },
  meetupStripText: {
    fontSize: 12,
    flex: 1,
  },
  escrowBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  escrowIconBadge: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  escrowBannerContent: {
    flex: 1,
    gap: 2,
  },
  escrowBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  escrowBannerBody: {
    fontSize: 12,
    lineHeight: 16,
  },
  sectionHeader: {
    marginTop: Spacing.two,
    gap: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  sectionSubtitle: {
    fontSize: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: 13,
  },
  breakdownValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  breakdownFree: {
    fontSize: 12,
    fontWeight: '700',
  },
  divider: {
    height: 1,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '800',
  },
  paymentOptionCard: {
    borderRadius: Radius.lg,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  optionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  gcashLogoWrapper: {
    width: 52,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  gcashLogoImage: {
    width: 40,
    height: 32,
  },
  mayaLogoWrapper: {
    width: 52,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: '#0A1810',
    borderWidth: 1,
    borderColor: '#183824',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    paddingHorizontal: 4,
  },
  mayaLogoImage: {
    width: 44,
    height: 18,
  },
  qrphLogoWrapper: {
    width: 52,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    paddingHorizontal: 4,
  },
  qrphLogoImage: {
    width: 44,
    height: 18,
  },
  optionTextColumn: {
    flex: 1,
    gap: 2,
  },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  methodBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  methodBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  optionSubtitle: {
    fontSize: 11,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: Radius.full,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: Radius.full,
  },
  methodFormExpanded: {
    paddingTop: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
    gap: Spacing.two,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  autoFillBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  autoFillBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  formHelperText: {
    fontSize: 11,
    lineHeight: 15,
  },
  qrExpandedContainer: {
    paddingTop: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
    alignItems: 'center',
    gap: Spacing.two,
  },
  qrInstructionHeading: {
    fontSize: 13,
    fontWeight: '700',
  },
  qrInstructionSub: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 15,
  },
  qrCodeFrame: {
    width: 236,
    padding: Spacing.four,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    gap: Spacing.three,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  qrHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingBottom: Spacing.one,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  qrTopLogo: {
    width: 68,
    height: 18,
  },
  qrStandardBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  qrStandardBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#1D4ED8',
    letterSpacing: 0.3,
  },
  realQrBox: {
    padding: Spacing.two,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrMetadataRow: {
    alignItems: 'center',
    gap: 2,
    width: '100%',
    paddingTop: Spacing.one,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  qrMerchantText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.5,
  },
  qrAmountText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  qrExpiryNote: {
    fontSize: 10,
  },
  bottomDock: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    gap: Spacing.two,
  },
  primaryBtn: {
    height: 48,
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryBtn: {
    height: 46,
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  successHero: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
  },
  successIconOuter: {
    width: 80,
    height: 80,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIconInner: {
    width: 56,
    height: 56,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: Spacing.four,
  },
  receiptCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  receiptLabel: {
    fontSize: 12,
  },
  receiptLabelBold: {
    fontSize: 13,
    fontWeight: '700',
  },
  receiptValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  receiptValueMono: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  receiptTotalValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  receiptDivider: {
    height: 1,
    marginVertical: 4,
  },
  meetupStepCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  meetupStepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  meetupStepTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  meetupSpotHighlight: {
    fontSize: 15,
    fontWeight: '800',
  },
  meetupStepDescription: {
    fontSize: 12,
    lineHeight: 17,
  },
  disclaimerCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  disclaimerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  disclaimerIconBox: {
    width: 28,
    height: 28,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disclaimerTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  disclaimerBody: {
    fontSize: 12,
    lineHeight: 17,
  },
});
