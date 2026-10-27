import React, { useEffect, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Spacing, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const IS_COMPACT = SCREEN_HEIGHT < 700;

export default function MobileWelcomeScreen() {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const router = useRouter();

  // Entrance choreography
  const [heroFade] = useState(() => new Animated.Value(0));
  const [heroScale] = useState(() => new Animated.Value(0.9));
  const [textFade] = useState(() => new Animated.Value(0));
  const [textSlide] = useState(() => new Animated.Value(12));
  const [buttonFade] = useState(() => new Animated.Value(0));

  // Single unified linear loop driver (0 -> 1)
  // Eliminates loop stutter, phase drift, and boundary discontinuity
  const [loopDriver] = useState(() => new Animated.Value(0));

  useEffect(() => {
    // 1. Entrance animation
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

    // 2. Perfectly seamless, stutter-free continuous float loop
    const continuousLoop = Animated.loop(
      Animated.timing(loopDriver, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    continuousLoop.start();

    return () => {
      continuousLoop.stop();
    };
  }, [buttonFade, heroFade, heroScale, loopDriver, textFade, textSlide]);

  // Interpolate smooth closed-cycle sine wave transforms
  // Every curve starts and ends at the exact same value (0 -> 0 or 1 -> 1), preventing any stutter
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
    outputRange: [1, 1.06, 1],
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />

      {/* Hero Section */}
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
          {/* Seamless pulsing backdrop */}
          <Animated.View
            style={[
              styles.motifBackdrop,
              {
                backgroundColor: theme.primaryLight,
                transform: [{ scale: glowScale }],
              },
            ]}
          />

          {/* Left Circle: Book (Seamless float) */}
          <Animated.View
            style={[
              styles.floatingCircle,
              styles.circleLeft,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                shadowColor: '#000000',
                transform: [{ translateY: leftTranslateY }],
              },
            ]}>
            <Ionicons name="book-outline" size={24} color={theme.primary} />
          </Animated.View>

          {/* Center Circle: Leaf (Seamless float) */}
          <Animated.View
            style={[
              styles.floatingCircle,
              styles.circleCenter,
              {
                backgroundColor: theme.primary,
                shadowColor: theme.primary,
                transform: [{ translateY: centerTranslateY }],
              },
            ]}>
            <Ionicons name="leaf" size={34} color="#FFFFFF" />
          </Animated.View>

          {/* Right Circle: Trade (Seamless float) */}
          <Animated.View
            style={[
              styles.floatingCircle,
              styles.circleRight,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                shadowColor: '#000000',
                transform: [{ translateY: rightTranslateY }],
              },
            ]}>
            <Ionicons name="swap-horizontal" size={24} color={theme.gold} />
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
          <Text style={[styles.brandEyebrow, { color: theme.primary }]}>
            CAMPUSGREEN
          </Text>

          <Text style={[styles.headline, { color: theme.text }]}>
            Where campus gear{'\n'}finds a second life.
          </Text>

          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Buy affordable textbooks, swap class tools, and share dorm essentials with students
            right at your school.
          </Text>
        </Animated.View>
      </View>

      {/* Bottom Action Area */}
      <Animated.View style={[styles.bottomSection, { opacity: buttonFade }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Get Started"
          onPress={() => router.push('/(auth)/register')}
          style={({ pressed }) => [
            styles.primaryButton,
            {
              backgroundColor: pressed ? theme.primaryDark : theme.primary,
              shadowColor: theme.primary,
            },
          ]}>
          <Text style={styles.primaryButtonText}>Get Started</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Log in"
          onPress={() => router.push('/(auth)/login')}
          style={({ pressed }) => [
            styles.secondaryButton,
            {
              borderColor: theme.border,
              backgroundColor: pressed ? theme.surfaceSubtle : theme.surface,
            },
          ]}>
          <Text style={[styles.secondaryButtonText, { color: theme.text }]}>Log In</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Explore as guest"
          onPress={() => router.push('/(tabs)/marketplace')}
          style={styles.guestButton}>
          <Text style={[styles.guestButtonText, { color: theme.textSecondary }]}>
            Explore as Guest
          </Text>
        </Pressable>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.five,
    paddingTop: IS_COMPACT ? Spacing.five : Spacing.seven,
    paddingBottom: Spacing.five,
  },

  /* Hero Section */
  heroSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },

  /* Visual Motif (3 connected community circles) */
  motifContainer: {
    width: 220,
    height: 140,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: IS_COMPACT ? Spacing.four : Spacing.six,
  },
  motifBackdrop: {
    position: 'absolute',
    width: 170,
    height: 110,
    borderRadius: Radius.full,
    opacity: 0.6,
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
    top: 6,
    zIndex: 3,
    elevation: 6,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
  },
  circleLeft: {
    width: 58,
    height: 58,
    borderRadius: 29,
    left: 12,
    bottom: 12,
    zIndex: 2,
    borderWidth: 1.5,
    elevation: 3,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  circleRight: {
    width: 58,
    height: 58,
    borderRadius: 29,
    right: 12,
    bottom: 12,
    zIndex: 2,
    borderWidth: 1.5,
    elevation: 3,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },

  /* Copy block */
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: Spacing.two,
  },
  brandEyebrow: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: Spacing.two,
  },
  headline: {
    fontSize: IS_COMPACT ? 28 : 34,
    lineHeight: IS_COMPACT ? 34 : 40,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.6,
    marginBottom: Spacing.three,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 310,
  },

  /* Bottom Actions */
  bottomSection: {
    width: '100%',
    alignItems: 'center',
    gap: 10,
  },
  primaryButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  guestButton: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
  guestButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
