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

export default function VerifyScreen() {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const router = useRouter();

  const [method, setMethod] = useState<'email' | 'id'>('email');
  const [code, setCode] = useState('');
  const [idUploaded, setIdUploaded] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      router.replace('/(tabs)/marketplace');
    }, 450);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {/* Top Bar */}
          <View style={styles.topBar}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back"
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

          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>Student Verification</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Verify your status to trade and swap materials with your campus community.
            </Text>
          </View>

          {/* Segmented Switcher */}
          <View
            style={[
              styles.tabRow,
              {
                backgroundColor: theme.surfaceSubtle,
                borderColor: theme.border,
              },
            ]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Email PIN"
              onPress={() => setMethod('email')}
              style={[
                styles.tab,
                method === 'email' && {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}>
              <Text
                style={[
                  styles.tabText,
                  {
                    color: method === 'email' ? theme.primary : theme.textSecondary,
                    fontWeight: method === 'email' ? '700' : '500',
                  },
                ]}>
                Email Code
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Student ID"
              onPress={() => setMethod('id')}
              style={[
                styles.tab,
                method === 'id' && {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}>
              <Text
                style={[
                  styles.tabText,
                  {
                    color: method === 'id' ? theme.primary : theme.textSecondary,
                    fontWeight: method === 'id' ? '700' : '500',
                  },
                ]}>
                Student ID
              </Text>
            </Pressable>
          </View>

          {/* Form */}
          {method === 'email' ? (
            <View style={styles.group}>
              <Text style={[styles.label, { color: theme.text }]}>6-Digit PIN</Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  },
                ]}>
                <TextInput
                  style={[
                    styles.pinInput,
                    {
                      color: theme.text,
                    },
                  ]}
                  placeholder="000000"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="number-pad"
                  maxLength={6}
                  value={code}
                  onChangeText={setCode}
                />
              </View>
            </View>
          ) : (
            <View style={styles.group}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Upload front of ID"
                onPress={() => setIdUploaded(true)}
                style={[
                  styles.uploadBox,
                  {
                    backgroundColor: theme.surface,
                    borderColor: idUploaded ? theme.primary : theme.border,
                  },
                ]}>
                <Ionicons
                  name={idUploaded ? 'checkmark-circle' : 'camera-outline'}
                  size={28}
                  color={idUploaded ? theme.primary : theme.textSecondary}
                />
                <Text
                  style={[
                    styles.uploadText,
                    { color: idUploaded ? theme.primary : theme.text },
                  ]}>
                  {idUploaded ? 'ID Photo Selected' : 'Upload Front of Student ID'}
                </Text>
              </Pressable>
            </View>
          )}

          {/* Action Button */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Verify"
            onPress={handleVerify}
            disabled={isVerifying}
            style={({ pressed }) => [
              styles.primaryButton,
              {
                backgroundColor: pressed ? theme.primaryDark : theme.primary,
                shadowColor: theme.primary,
                opacity: isVerifying ? 0.8 : 1,
              },
            ]}>
            {isVerifying ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.primaryButtonText}>Verify</Text>
            )}
          </Pressable>
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
    paddingHorizontal: Spacing.five,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.six,
  },
  topBar: {
    height: 48,
    justifyContent: 'center',
    marginBottom: Spacing.three,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    lineHeight: 22,
  },
  tabRow: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: Spacing.five,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: Radius.md,
  },
  tabText: {
    fontSize: 13,
  },
  group: {
    marginBottom: Spacing.five,
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
  },
  inputWrapper: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    height: 50,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  pinInput: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 8,
    textAlign: 'center',
  },
  uploadBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: Radius.xl,
    padding: Spacing.six,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  uploadText: {
    fontSize: 14,
    fontWeight: '600',
  },
  primaryButton: {
    width: '100%',
    height: 52,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.three,
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
});
