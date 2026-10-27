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
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Spacing, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function LoginScreen() {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = () => {
    if (!email.trim()) {
      setErrorMessage('Please enter your university email address.');
      return;
    }
    if (!password.trim()) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setErrorMessage('');
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      router.replace('/(tabs)/marketplace');
    }, 450);
  };

  const handleGoogleLogin = () => {
    setErrorMessage('');
    setIsGoogleLoading(true);
    setTimeout(() => {
      setIsGoogleLoading(false);
      router.replace('/(tabs)/marketplace');
    }, 600);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
        style={styles.keyboardView}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {/* Top Bar with Back Button */}
          <View style={styles.topBar}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
              style={({ pressed }) => [
                styles.backButton,
                {
                  backgroundColor: pressed ? theme.surfaceSubtle : theme.surface,
                  borderColor: theme.border,
                },
              ]}>
              <Ionicons name="arrow-back" size={20} color={theme.text} />
            </Pressable>
          </View>

          {/* Centered Content Area for Thumb-Friendly Ergonomics */}
          <View style={styles.centerWrapper}>
            {/* Header */}
            <View style={styles.headerSection}>
              <Text style={[styles.title, { color: theme.text }]}>Welcome Back</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Sign in with your student email to continue.
              </Text>
            </View>

            {/* Error Message */}
            {errorMessage ? (
              <View style={[styles.errorContainer, { backgroundColor: theme.errorBg }]}>
                <Ionicons name="alert-circle" size={18} color={theme.error} />
                <Text style={[styles.errorText, { color: theme.error }]}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Input Form */}
            <View style={styles.form}>
              {/* Campus Email Input */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>Student Email</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
                  ]}>
                  <Ionicons
                    name="mail-outline"
                    size={19}
                    color={theme.textSecondary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    placeholder="name@university.edu.ph"
                    placeholderTextColor={theme.textMuted}
                    value={email}
                    onChangeText={(val) => {
                      setEmail(val);
                      if (errorMessage) setErrorMessage('');
                    }}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                  />
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={[styles.inputLabel, { color: theme.text }]}>Password</Text>
                  <Pressable
                    accessibilityRole="link"
                    accessibilityLabel="Forgot Password"
                    onPress={() => router.push('/(auth)/forgot-password')}>
                    <Text style={[styles.forgotLink, { color: theme.primary }]}>
                      Forgot Password?
                    </Text>
                  </Pressable>
                </View>

                <View
                  style={[
                    styles.inputWrapper,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
                  ]}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={19}
                    color={theme.textSecondary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    placeholder="Enter your password"
                    placeholderTextColor={theme.textMuted}
                    value={password}
                    onChangeText={(val) => {
                      setPassword(val);
                      if (errorMessage) setErrorMessage('');
                    }}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeButton}>
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={theme.textSecondary}
                    />
                  </Pressable>
                </View>
              </View>

              {/* Submit Button */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Log In"
                onPress={handleLogin}
                disabled={isLoading}
                style={({ pressed }) => [
                  styles.primaryButton,
                  {
                    backgroundColor: pressed ? theme.primaryDark : theme.primary,
                    shadowColor: theme.primary,
                    opacity: isLoading ? 0.8 : 1,
                  },
                ]}>
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.primaryButtonText}>Log In</Text>
                )}
              </Pressable>

              {/* Divider */}
              <View style={styles.dividerRow}>
                <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
                <Text style={[styles.dividerText, { color: theme.textSecondary }]}>or</Text>
                <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
              </View>

              {/* Google Quick Sign-In */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Continue with Google"
                onPress={handleGoogleLogin}
                disabled={isGoogleLoading}
                style={({ pressed }) => [
                  styles.googleButton,
                  {
                    backgroundColor: pressed ? theme.surfaceSubtle : theme.surface,
                    borderColor: theme.border,
                    opacity: isGoogleLoading ? 0.7 : 1,
                  },
                ]}>
                {isGoogleLoading ? (
                  <ActivityIndicator color={theme.text} size="small" />
                ) : (
                  <>
                    <Ionicons name="logo-google" size={18} color="#EA4335" style={styles.googleIcon} />
                    <Text style={[styles.googleButtonText, { color: theme.text }]}>
                      Continue with Google
                    </Text>
                  </>
                )}
              </Pressable>
            </View>

            {/* Bottom Switcher */}
            <View style={styles.bottomSection}>
              <View style={styles.switchRow}>
                <Text style={[styles.switchText, { color: theme.textSecondary }]}>
                  Don&apos;t have an account?
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Sign Up"
                  onPress={() => router.push('/(auth)/register')}>
                  <Text style={[styles.switchAction, { color: theme.primary }]}>Sign Up</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.five,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.four,
  },

  /* Top Navigation */
  topBar: {
    height: 48,
    justifyContent: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Ergonomic Center Wrapper */
  centerWrapper: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: Spacing.three,
  },

  /* Header */
  headerSection: {
    marginBottom: Spacing.five,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 21,
  },

  /* Error Banner */
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: Radius.md,
    marginBottom: Spacing.four,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },

  /* Form */
  form: {
    width: '100%',
    gap: Spacing.four,
  },
  inputGroup: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  forgotLink: {
    fontSize: 13,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: 14,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    height: '100%',
  },
  eyeButton: {
    padding: 6,
  },

  /* Primary Button */
  primaryButton: {
    width: '100%',
    height: 50,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.two,
    elevation: 2,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  /* Divider */
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 13,
    fontWeight: '500',
  },

  /* Google Button */
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: Radius.xl,
    borderWidth: 1,
  },
  googleIcon: {
    marginRight: 10,
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },

  /* Bottom Actions */
  bottomSection: {
    marginTop: Spacing.five,
    alignItems: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  switchText: {
    fontSize: 14,
  },
  switchAction: {
    fontSize: 14,
    fontWeight: '700',
  },
});
