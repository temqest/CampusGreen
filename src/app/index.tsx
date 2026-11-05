import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  AppState,
  AppStateStatus,
  Dimensions,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { Spacing, Radius } from '@/constants/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const IS_COMPACT = SCREEN_HEIGHT < 700;

// Signature sleek dark palette
const CANVAS_BG = '#0A0F0D'; // Deep tinted charcoal/slate

export default function MobileWelcomeScreen() {
  const router = useRouter();
  const [helpModalVisible, setHelpModalVisible] = useState(false);

  // Entrance choreography
  const [heroFade] = useState(() => new Animated.Value(0));
  const [heroScale] = useState(() => new Animated.Value(0.92));
  const [textFade] = useState(() => new Animated.Value(0));
  const [textSlide] = useState(() => new Animated.Value(14));
  const [buttonFade] = useState(() => new Animated.Value(0));

  // Single unified linear loop driver (0 -> 1)
  // Eliminates loop stutter, phase drift, and boundary discontinuity
  const [loopDriver] = useState(() => new Animated.Value(0));
  const loopAnimRef = useRef<Animated.CompositeAnimation | null>(null);
  const isFirstMount = useRef(true);

  // 1. Entrance animation (runs once on first load)
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      Animated.sequence([
        Animated.parallel([
          Animated.timing(heroFade, {
            toValue: 1,
            duration: 500,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.spring(heroScale, {
            toValue: 1,
            friction: 7,
            tension: 45,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(textFade, {
            toValue: 1,
            duration: 450,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(textSlide, {
            toValue: 0,
            duration: 450,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(buttonFade, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [buttonFade, heroFade, heroScale, textFade, textSlide]);

  // 2. Seamless, stutter-free continuous float loop
  // Bound to screen focus: automatically resumes when returning from auth screens
  useFocusEffect(
    useCallback(() => {
      let isFocused = true;

      // Ensure entrance values are fully settled when returning
      if (!isFirstMount.current) {
        heroFade.setValue(1);
        heroScale.setValue(1);
        textFade.setValue(1);
        textSlide.setValue(0);
        buttonFade.setValue(1);
      }

      const startLoop = () => {
        if (!isFocused) return;
        if (loopAnimRef.current) {
          loopAnimRef.current.stop();
        }
        loopDriver.setValue(0);
        const continuousLoop = Animated.loop(
          Animated.timing(loopDriver, {
            toValue: 1,
            duration: 4000,
            easing: Easing.linear,
            useNativeDriver: true,
          })
        );
        loopAnimRef.current = continuousLoop;
        continuousLoop.start();
      };

      startLoop();

      const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
        if (nextState === 'active' && isFocused) {
          startLoop();
        }
      });

      return () => {
        isFocused = false;
        subscription.remove();
        if (loopAnimRef.current) {
          loopAnimRef.current.stop();
          loopAnimRef.current = null;
        }
      };
    }, [buttonFade, heroFade, heroScale, loopDriver, textFade, textSlide])
  );

  // Interpolate smooth closed-cycle sine wave transforms
  const centerTranslateY = loopDriver.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [0, -6, 0, 6, 0],
  });

  const leftTranslateY = loopDriver.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [0, 5, 0, -5, 0],
  });

  const rightTranslateY = loopDriver.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [0, -5, 0, 5, 0],
  });

  const glowScale = loopDriver.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.08, 1],
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* Clean Top Bar (no settings gear; subtle Help link) */}
      <View style={styles.topBar}>
        <View style={styles.topBarSpacer} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="About UniSwap"
          onPress={() => setHelpModalVisible(true)}
          hitSlop={12}
          style={({ pressed }) => [
            styles.helpButton,
            pressed && styles.helpButtonPressed,
          ]}>
          <Ionicons name="help-circle-outline" size={16} color="#94A3B8" />
          <Text style={styles.helpButtonText}>Help</Text>
        </Pressable>
      </View>

      {/* Centered Hero Content Block */}
      <View style={styles.heroSection}>
        {/* Motif Container with entrance animation */}
        <Animated.View
          style={[
            styles.motifContainer,
            {
              opacity: heroFade,
              transform: [{ scale: heroScale }],
            },
          ]}>
          {/* Subtle Emerald / Mint Radial Ambient Backlight */}
          <Animated.View
            style={[
              styles.ambientGlowWrapper,
              {
                transform: [{ scale: glowScale }],
              },
            ]}
            pointerEvents="none">
            <Svg height="260" width="260" viewBox="0 0 260 260">
              <Defs>
                <RadialGradient id="emeraldBacklight" cx="50%" cy="50%" rx="50%" ry="50%">
                  <Stop offset="0%" stopColor="#10B981" stopOpacity="0.22" />
                  <Stop offset="55%" stopColor="#059669" stopOpacity="0.08" />
                  <Stop offset="100%" stopColor="#0A0F0D" stopOpacity="0" />
                </RadialGradient>
              </Defs>
              <Rect x="0" y="0" width="260" height="260" fill="url(#emeraldBacklight)" />
            </Svg>
          </Animated.View>

          {/* Frosted ambient backing card (replaces muddy dark green blob) */}
          <View style={styles.frostedBackdropCard} />

          {/* Left Circle: Book (Crisp white glyph, frosted dark-emerald disc) */}
          <Animated.View
            style={[
              styles.floatingCircle,
              styles.circleLeft,
              {
                transform: [{ translateY: leftTranslateY }],
              },
            ]}>
            <Ionicons name="book" size={22} color="#FFFFFF" />
          </Animated.View>

          {/* Center Circle: Leaf (Crisp white glyph, vibrant emerald core) */}
          <Animated.View
            style={[
              styles.floatingCircle,
              styles.circleCenter,
              {
                transform: [{ translateY: centerTranslateY }],
              },
            ]}>
            <Ionicons name="leaf" size={32} color="#FFFFFF" />
          </Animated.View>

          {/* Right Circle: Trade (Crisp white glyph, frosted dark-emerald disc; yellow accent removed) */}
          <Animated.View
            style={[
              styles.floatingCircle,
              styles.circleRight,
              {
                transform: [{ translateY: rightTranslateY }],
              },
            ]}>
            <Ionicons name="swap-horizontal" size={24} color="#FFFFFF" />
          </Animated.View>
        </Animated.View>

        {/* Text Container with smooth entrance */}
        <Animated.View
          style={[
            styles.textContainer,
            {
              opacity: textFade,
              transform: [{ translateY: textSlide }],
            },
          ]}>
          {/* Sleek Brand Eyebrow (Clean text, no decorative pill) */}
          <Text style={styles.brandEyebrow}>UNISWAP</Text>

          {/* High-Contrast Bold Headline */}
          <Text style={styles.headline}>
            Where campus gear{'\n'}finds a second life.
          </Text>

          {/* Muted Slate Body Copy for Effortless Readability */}
          <Text style={styles.subtitle}>
            Buy affordable textbooks, swap class tools, and share dorm essentials with students
            right at your school.
          </Text>
        </Animated.View>
      </View>

      {/* Bottom Action Area (Clear Visual Hierarchy) */}
      <Animated.View style={[styles.bottomSection, { opacity: buttonFade }]}>
        {/* Primary CTA: Vibrant Emerald Pill Button */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Get Started"
          onPress={() => router.push('/(auth)/register')}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.primaryButtonPressed,
          ]}>
          <Text style={styles.primaryButtonText}>Get Started</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={styles.buttonArrow} />
        </Pressable>

        {/* Secondary CTA: De-emphasized Sleek Ghost Button */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Log In"
          onPress={() => router.push('/(auth)/login')}
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.secondaryButtonPressed,
          ]}>
          <Text style={styles.secondaryButtonText}>Log In</Text>
        </Pressable>
      </Animated.View>

      {/* Lightweight Info Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={helpModalVisible}
        onRequestClose={() => setHelpModalVisible(false)}>
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setHelpModalVisible(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <View style={styles.modalBadge}>
                <Ionicons name="leaf" size={14} color="#34D399" />
                <Text style={styles.modalBadgeText}>About UniSwap</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close help modal"
                hitSlop={10}
                onPress={() => setHelpModalVisible(false)}
                style={styles.modalCloseButton}>
                <Ionicons name="close" size={20} color="#94A3B8" />
              </Pressable>
            </View>

            <Text style={styles.modalTitle}>Verified Student Marketplace</Text>
            <Text style={styles.modalDescription}>
              UniSwap connects verified college peers to buy, swap, and share dorm goods,
              uniforms, textbooks, and gear safely within campus boundaries.
            </Text>

            <View style={styles.modalFeatures}>
              <View style={styles.featureRow}>
                <Ionicons name="shield-checkmark-outline" size={18} color="#34D399" />
                <Text style={styles.featureText}>Verified student-only community</Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="location-outline" size={18} color="#34D399" />
                <Text style={styles.featureText}>Official safe campus meetup hubs</Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="repeat-outline" size={18} color="#34D399" />
                <Text style={styles.featureText}>Cash purchases, barter swaps, or free items</Text>
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Got it"
              onPress={() => setHelpModalVisible(false)}
              style={({ pressed }) => [
                styles.modalActionButton,
                pressed && styles.modalActionButtonPressed,
              ]}>
              <Text style={styles.modalActionText}>Got it</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CANVAS_BG,
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.five,
    paddingTop: IS_COMPACT ? Spacing.two : Spacing.three,
    paddingBottom: Spacing.five,
  },

  /* Top Navigation Bar */
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    height: 40,
    paddingHorizontal: Spacing.one,
  },
  topBarSpacer: {
    width: 40,
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  helpButtonPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  helpButtonText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '500',
  },

  /* Hero Section */
  heroSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: Spacing.three,
  },

  /* Visual Motif (3 connected community circles) */
  motifContainer: {
    width: 240,
    height: 150,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: IS_COMPACT ? Spacing.four : Spacing.six,
  },
  ambientGlowWrapper: {
    position: 'absolute',
    width: 260,
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  frostedBackdropCard: {
    position: 'absolute',
    width: 190,
    height: 120,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.12)',
    zIndex: 2,
  },
  floatingCircle: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleCenter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    top: 10,
    zIndex: 5,
    backgroundColor: '#16A34A',
    borderWidth: 1.5,
    borderColor: 'rgba(74, 222, 128, 0.5)',
    elevation: 6,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  circleLeft: {
    width: 58,
    height: 58,
    borderRadius: 29,
    left: 20,
    bottom: 14,
    zIndex: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    elevation: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  circleRight: {
    width: 58,
    height: 58,
    borderRadius: 29,
    right: 20,
    bottom: 14,
    zIndex: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    elevation: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },

  /* Copy block */
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: Spacing.two,
  },
  brandEyebrow: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2.2,
    color: '#34D399',
    textTransform: 'uppercase',
    marginBottom: Spacing.two,
  },
  headline: {
    fontSize: IS_COMPACT ? 28 : 34,
    lineHeight: IS_COMPACT ? 34 : 41,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.8,
    color: '#F8FAFC',
    marginBottom: Spacing.three,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    color: '#94A3B8',
    maxWidth: 320,
  },

  /* Bottom Actions */
  bottomSection: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
    paddingBottom: Spacing.two,
  },
  primaryButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: Radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16A34A',
    elevation: 4,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
  },
  primaryButtonPressed: {
    backgroundColor: '#15803D',
    transform: [{ scale: 0.99 }],
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  buttonArrow: {
    marginLeft: 8,
  },
  secondaryButton: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  secondaryButtonPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  secondaryButtonText: {
    color: '#E2E8F0',
    fontSize: 15,
    fontWeight: '600',
  },

  /* Modal Sheet */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.five,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    backgroundColor: '#111814',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.2)',
    padding: Spacing.five,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.three,
  },
  modalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.25)',
  },
  modalBadgeText: {
    color: '#34D399',
    fontSize: 12,
    fontWeight: '600',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: Spacing.two,
  },
  modalDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: '#94A3B8',
    marginBottom: Spacing.four,
  },
  modalFeatures: {
    gap: 12,
    marginBottom: Spacing.five,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    fontSize: 13,
    color: '#E2E8F0',
    fontWeight: '500',
    flexShrink: 1,
  },
  modalActionButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: Radius.xl,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalActionButtonPressed: {
    backgroundColor: '#15803D',
  },
  modalActionText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
