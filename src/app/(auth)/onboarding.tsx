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

const YEAR_LEVELS = [
  { id: '1', label: '1st Year' },
  { id: '2', label: '2nd Year' },
  { id: '3', label: '3rd Year' },
  { id: '4', label: '4th Year+' },
];

const DEGREE_PROGRAMS = [
  { id: 'nursing', name: 'BS Nursing', dept: 'Health Sciences' },
  { id: 'accountancy', name: 'BS Accountancy', dept: 'Business' },
  { id: 'it', name: 'BS Information Technology', dept: 'Computing' },
  { id: 'cs', name: 'BS Computer Science', dept: 'Computing' },
  { id: 'tourism', name: 'BS Tourism Management', dept: 'Hospitality' },
  { id: 'civil_eng', name: 'BS Civil Engineering', dept: 'Engineering' },
  { id: 'ba', name: 'BS Business Administration', dept: 'Business' },
  { id: 'education', name: 'BS Secondary Education', dept: 'Education' },
  { id: 'psychology', name: 'BS Psychology', dept: 'Arts & Sciences' },
];

const NEEDED_ITEMS = [
  {
    id: 'textbooks',
    title: 'Textbooks & Reviewers',
    subtitle: 'Syllabus books, course modules, and notes',
    icon: 'book-outline',
  },
  {
    id: 'uniforms',
    title: 'Uniforms & Clinical Scrubs',
    subtitle: 'Campus polo, PE shirts, scrubs, and lab coats',
    icon: 'shirt-outline',
  },
  {
    id: 'tools',
    title: 'Tools & Lab Equipment',
    subtitle: 'Scientific calculators, drafting pens, and kits',
    icon: 'construct-outline',
  },
  {
    id: 'dorm',
    title: 'Dorm & Room Essentials',
    subtitle: 'Desk lamps, fans, kettles, and organizers',
    icon: 'home-outline',
  },
  {
    id: 'tech',
    title: 'Tech & Study Gadgets',
    subtitle: 'Chargers, power banks, tablets, and peripherals',
    icon: 'hardware-chip-outline',
  },
];

const TRADING_PREFERENCES = [
  {
    id: 'buy',
    title: 'Buy at Student Prices',
    subtitle: 'Affordable gear directly from campus peers',
    icon: 'pricetag-outline',
  },
  {
    id: 'swap',
    title: 'Swap Zone (Barter)',
    subtitle: 'Trade item-for-item without spending cash',
    icon: 'swap-horizontal',
  },
  {
    id: 'freebies',
    title: 'Pay-It-Forward (Free)',
    subtitle: 'Claim free supplies donated by seniors',
    icon: 'gift-outline',
  },
  {
    id: 'sell',
    title: 'Pass Down Old Gear',
    subtitle: 'List items you no longer need for upcoming terms',
    icon: 'arrow-redo-outline',
  },
];

export default function OnboardingScreen() {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const router = useRouter();

  // 3-Step Need-Focused Flow:
  // Step 1: Your Academic Focus (Year & Degree)
  // Step 2: What Items Do You Need? (Books, Uniforms, Tools, Dorm, Tech)
  // Step 3: How Do You Want To Trade? (Buy, Swap, Freebies, Pass Down)
  const [step, setStep] = useState(1);

  // Step 1 State (No auto-selection)
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [courseQuery, setCourseQuery] = useState('');
  const [customCourse, setCustomCourse] = useState('');

  // Step 2 State (No auto-selection)
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Step 3 State (No auto-selection)
  const [selectedTrades, setSelectedTrades] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState(false);

  const filteredCourses = DEGREE_PROGRAMS.filter((p) =>
    p.name.toLowerCase().includes(courseQuery.toLowerCase())
  );

  const toggleItem = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleTrade = (id: string) => {
    setSelectedTrades((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        router.replace('/(tabs)/marketplace');
      }, 400);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}>
        {/* Top Header Bar */}
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={handleBack}
            style={({ pressed }) => [
              styles.backButton,
              {
                backgroundColor: pressed ? theme.surfaceSubtle : theme.surface,
                borderColor: theme.border,
              },
            ]}>
            <Ionicons name="arrow-back" size={20} color={theme.text} />
          </Pressable>

          {/* Clean Step Segment Dots */}
          <View style={styles.stepProgressRow}>
            {[1, 2, 3].map((s) => (
              <View
                key={s}
                style={[
                  styles.stepSegment,
                  {
                    backgroundColor: s <= step ? theme.primary : theme.border,
                  },
                ]}
              />
            ))}
          </View>

          <View style={{ width: 40 }} />
        </View>

        {/* Scrollable Step Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {/* ================= STEP 1: Academic Focus ================= */}
          {step === 1 && (
            <View style={styles.stepBlock}>
              <View style={styles.titleSection}>
                <Text style={[styles.title, { color: theme.text }]}>Your Studies</Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                  Select your year and program to surface relevant course materials.
                </Text>
              </View>

              {/* Year Level Grid (4 equal responsive columns) */}
              <View style={styles.fieldSection}>
                <Text style={[styles.sectionLabel, { color: theme.text }]}>Year Level</Text>
                <View style={styles.yearGrid}>
                  {YEAR_LEVELS.map((y) => {
                    const isSelected = selectedYear === y.id;
                    return (
                      <Pressable
                        key={y.id}
                        accessibilityRole="button"
                        accessibilityLabel={y.label}
                        onPress={() => setSelectedYear(y.id)}
                        style={[
                          styles.yearCell,
                          {
                            backgroundColor: isSelected ? theme.primary : theme.surface,
                            borderColor: isSelected ? theme.primary : theme.border,
                          },
                        ]}>
                        <Text
                          style={[
                            styles.yearCellText,
                            {
                              color: isSelected ? '#FFFFFF' : theme.text,
                              fontWeight: isSelected ? '700' : '600',
                            },
                          ]}>
                          {y.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Degree Program List */}
              <View style={styles.fieldSection}>
                <Text style={[styles.sectionLabel, { color: theme.text }]}>
                  Degree Program
                </Text>

                {/* Search Bar */}
                <View
                  style={[
                    styles.searchInputWrapper,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
                  ]}>
                  <Ionicons
                    name="search-outline"
                    size={18}
                    color={theme.textSecondary}
                    style={styles.searchIcon}
                  />
                  <TextInput
                    style={[styles.searchInput, { color: theme.text }]}
                    placeholder="Search degree program..."
                    placeholderTextColor={theme.textMuted}
                    value={courseQuery}
                    onChangeText={setCourseQuery}
                  />
                  {courseQuery ? (
                    <Pressable onPress={() => setCourseQuery('')} style={{ padding: 4 }}>
                      <Ionicons name="close-circle" size={16} color={theme.textSecondary} />
                    </Pressable>
                  ) : null}
                </View>

                {/* Structured Program Options */}
                <View style={styles.optionList}>
                  {filteredCourses.map((c) => {
                    const isSelected = selectedCourse === c.id;
                    return (
                      <Pressable
                        key={c.id}
                        accessibilityRole="button"
                        accessibilityLabel={c.name}
                        onPress={() => {
                          setSelectedCourse(c.id);
                          setCustomCourse('');
                        }}
                        style={[
                          styles.optionCard,
                          {
                            backgroundColor: isSelected ? theme.primaryLight : theme.surface,
                            borderColor: isSelected ? theme.primary : theme.border,
                          },
                        ]}>
                        <View style={styles.cardTextCol}>
                          <Text
                            style={[
                              styles.cardTitle,
                              {
                                color: isSelected ? theme.primary : theme.text,
                                fontWeight: isSelected ? '700' : '600',
                              },
                            ]}>
                            {c.name}
                          </Text>
                          <Text
                            style={[
                              styles.cardSubtitle,
                              { color: isSelected ? theme.primary : theme.textSecondary },
                            ]}>
                            {c.dept}
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.radioCircle,
                            {
                              borderColor: isSelected ? theme.primary : theme.border,
                              backgroundColor: isSelected ? theme.primary : 'transparent',
                            },
                          ]}>
                          {isSelected && <View style={styles.radioInnerDot} />}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Other Degree Input */}
                <View style={styles.otherInputGroup}>
                  <Text style={[styles.subLabel, { color: theme.textSecondary }]}>
                    Don&apos;t see your major?
                  </Text>
                  <View
                    style={[
                      styles.searchInputWrapper,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                      },
                    ]}>
                    <TextInput
                      style={[styles.searchInput, { color: theme.text }]}
                      placeholder="Type custom program name..."
                      placeholderTextColor={theme.textMuted}
                      value={customCourse}
                      onChangeText={(val) => {
                        setCustomCourse(val);
                        if (val) setSelectedCourse('');
                      }}
                    />
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* ================= STEP 2: What Items Do You Need? ================= */}
          {step === 2 && (
            <View style={styles.stepBlock}>
              <View style={styles.titleSection}>
                <Text style={[styles.title, { color: theme.text }]}>
                  What items do you need?
                </Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                  Pick the gear and school materials you are looking to get this term.
                </Text>
              </View>

              <View style={styles.optionList}>
                {NEEDED_ITEMS.map((item) => {
                  const isSelected = selectedItems.includes(item.id);
                  return (
                    <Pressable
                      key={item.id}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: isSelected }}
                      accessibilityLabel={item.title}
                      onPress={() => toggleItem(item.id)}
                      style={[
                        styles.optionCard,
                        {
                          backgroundColor: isSelected ? theme.primaryLight : theme.surface,
                          borderColor: isSelected ? theme.primary : theme.border,
                        },
                      ]}>
                      <View
                        style={[
                          styles.cardIconWrap,
                          {
                            backgroundColor: isSelected ? theme.primary : theme.surfaceSubtle,
                          },
                        ]}>
                        <Ionicons
                          name={item.icon as any}
                          size={18}
                          color={isSelected ? '#FFFFFF' : theme.textSecondary}
                        />
                      </View>

                      <View style={styles.cardTextCol}>
                        <Text
                          style={[
                            styles.cardTitle,
                            {
                              color: isSelected ? theme.primary : theme.text,
                              fontWeight: isSelected ? '700' : '600',
                            },
                          ]}>
                          {item.title}
                        </Text>
                        <Text
                          style={[
                            styles.cardSubtitle,
                            { color: isSelected ? theme.primary : theme.textSecondary },
                          ]}>
                          {item.subtitle}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.checkboxSquare,
                          {
                            backgroundColor: isSelected ? theme.primary : 'transparent',
                            borderColor: isSelected ? theme.primary : theme.border,
                          },
                        ]}>
                        {isSelected && (
                          <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                        )}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* ================= STEP 3: How Do You Want To Trade? ================= */}
          {step === 3 && (
            <View style={styles.stepBlock}>
              <View style={styles.titleSection}>
                <Text style={[styles.title, { color: theme.text }]}>
                  How do you want to trade?
                </Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                  Select your preferred ways to exchange school gear with peers.
                </Text>
              </View>

              <View style={styles.optionList}>
                {TRADING_PREFERENCES.map((trade) => {
                  const isSelected = selectedTrades.includes(trade.id);
                  return (
                    <Pressable
                      key={trade.id}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: isSelected }}
                      accessibilityLabel={trade.title}
                      onPress={() => toggleTrade(trade.id)}
                      style={[
                        styles.optionCard,
                        {
                          backgroundColor: isSelected ? theme.primaryLight : theme.surface,
                          borderColor: isSelected ? theme.primary : theme.border,
                        },
                      ]}>
                      <View
                        style={[
                          styles.cardIconWrap,
                          {
                            backgroundColor: isSelected ? theme.primary : theme.surfaceSubtle,
                          },
                        ]}>
                        <Ionicons
                          name={trade.icon as any}
                          size={18}
                          color={isSelected ? '#FFFFFF' : theme.textSecondary}
                        />
                      </View>

                      <View style={styles.cardTextCol}>
                        <Text
                          style={[
                            styles.cardTitle,
                            {
                              color: isSelected ? theme.primary : theme.text,
                              fontWeight: isSelected ? '700' : '600',
                            },
                          ]}>
                          {trade.title}
                        </Text>
                        <Text
                          style={[
                            styles.cardSubtitle,
                            { color: isSelected ? theme.primary : theme.textSecondary },
                          ]}>
                          {trade.subtitle}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.checkboxSquare,
                          {
                            backgroundColor: isSelected ? theme.primary : 'transparent',
                            borderColor: isSelected ? theme.primary : theme.border,
                          },
                        ]}>
                        {isSelected && (
                          <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                        )}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Bottom Pinned Thumb Dock */}
        <View
          style={[
            styles.bottomDock,
            {
              backgroundColor: theme.background,
              borderTopColor: theme.border,
            },
          ]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={step === 3 ? 'Enter Marketplace' : 'Continue'}
            onPress={handleNext}
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
              <Text style={styles.primaryButtonText}>
                {step === 3 ? 'Enter Marketplace' : 'Continue'}
              </Text>
            )}
          </Pressable>
        </View>
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

  /* Top Navigation */
  topBar: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.five,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepSegment: {
    width: 28,
    height: 4,
    borderRadius: 2,
  },

  /* Scrollable Content */
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.five,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.five,
  },

  /* Step Block */
  stepBlock: {
    width: '100%',
  },
  titleSection: {
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

  /* Field Sections */
  fieldSection: {
    marginBottom: Spacing.five,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  subLabel: {
    fontSize: 13,
    marginBottom: 6,
  },

  /* Year Level Grid */
  yearGrid: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  yearCell: {
    flex: 1,
    height: 44,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yearCellText: {
    fontSize: 13,
  },

  /* Search Input */
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: 12,
    height: 46,
    marginBottom: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    height: '100%',
  },

  /* Options List (Courses, Items, Trades) */
  optionList: {
    gap: 10,
    width: '100%',
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: Radius.xl,
    borderWidth: 1,
    gap: 12,
  },
  cardIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTextCol: {
    flex: 1,
    paddingRight: 6,
  },
  cardTitle: {
    fontSize: 14,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  checkboxSquare: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otherInputGroup: {
    marginTop: 14,
  },

  /* Pinned Bottom Dock */
  bottomDock: {
    paddingHorizontal: Spacing.five,
    paddingTop: Spacing.two,
    paddingBottom: Platform.OS === 'ios' ? Spacing.two : Spacing.four,
    borderTopWidth: 1,
  },
  primaryButton: {
    width: '100%',
    height: 50,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
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
});
