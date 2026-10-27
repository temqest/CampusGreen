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

export default function ForgotPasswordScreen() {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleReset = () => {
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid student email.');
      return;
    }

    setErrorMessage('');
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 450);
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
          {/* Top Bar */}
          <View style={styles.topBar}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back to login"
              onPress={() => router.back()}
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
            <View style={styles.header}>
              <Text style={[styles.title, { color: theme.text }]}>Reset Password</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Enter your student email and we&apos;ll send instructions to reset your password.
              </Text>
            </View>

            {/* Error Banner */}
            {errorMessage ? (
              <View style={[styles.errorContainer, { backgroundColor: theme.errorBg }]}>
                <Ionicons name="alert-circle" size={18} color={theme.error} />
                <Text style={[styles.errorText, { color: theme.error }]}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Form */}
            {isSubmitted ? (
              <View
                style={[
                  styles.successCard,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  },
                ]}>
                <Ionicons name="checkmark-circle" size={36} color={theme.primary} />
                <Text style={[styles.successTitle, { color: theme.text }]}>
                  Check your inbox
                </Text>
                <Text style={[styles.successDesc, { color: theme.textSecondary }]}>
                  Password recovery instructions sent to{' '}
                  <Text style={{ fontWeight: '700', color: theme.text }}>{email}</Text>.
                </Text>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Return to Log In"
                  onPress={() => router.replace('/(auth)/login')}
                  style={[styles.primaryButton, { backgroundColor: theme.primary, marginTop: 14 }]}>
                  <Text style={styles.primaryButtonText}>Return to Log In</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.text }]}>
                    Student Email
                  </Text>
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

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Send Reset Link"
                  onPress={handleReset}
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
                    <Text style={styles.primaryButtonText}>Send Reset Link</Text>
                  )}
                </Pressable>
              </View>
            )}

            {/* Bottom Back to Login */}
            <View style={styles.bottomSection}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Back to Login"
                onPress={() => router.back()}
                style={styles.backLink}>
                <Ionicons name="arrow-back" size={16} color={theme.primary} />
                <Text style={[styles.backLinkText, { color: theme.primary }]}>
                  Back to Login
                </Text>
              </Pressable>
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
  centerWrapper: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: Spacing.three,
  },
  header: {
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
  form: {
    width: '100%',
    gap: Spacing.four,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 14,
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
  successCard: {
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: Spacing.five,
    alignItems: 'center',
    gap: 8,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  successDesc: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  bottomSection: {
    marginTop: Spacing.six,
    alignItems: 'center',
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
  },
  backLinkText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
