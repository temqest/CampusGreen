import React, { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
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
import {
  Condition,
  ItemCategory,
  ItemPhoto,
  MarketplaceItem,
  TradeType,
} from '@/types/item';
import { PhotoPickerSection, UploadedPhoto } from '@/components/sell/photo-picker-section';

const CATEGORIES: { label: ItemCategory; icon: keyof typeof Ionicons.glyphMap; co2: number }[] = [
  { label: 'Textbooks & Reviewers', icon: 'book-outline', co2: 3.5 },
  { label: 'Uniforms & Scrubs', icon: 'shirt-outline', co2: 4.2 },
  { label: 'Tools & Lab Gear', icon: 'construct-outline', co2: 2.8 },
  { label: 'Dorm & Room', icon: 'home-outline', co2: 5.0 },
  { label: 'Tech & Gadgets', icon: 'hardware-chip-outline', co2: 6.5 },
];

const CONDITIONS: { label: Condition; desc: string }[] = [
  { label: 'Brand New', desc: 'Unused with original packaging or tags' },
  { label: 'Like New', desc: 'Barely used, clean with no highlights or marks' },
  { label: 'Good', desc: 'Lightly used, fully intact and functional' },
  { label: 'Well-Loved', desc: 'Visible wear or highlights, perfectly usable' },
];

const CAMPUS_OPTIONS = [
  'Ateneo de Naga University',
  'Univ. of Nueva Caceres',
];

const DEFAULT_MEETUP_SPOTS = [
  'Alingal Hall (Tourism Lobby)',
  'Main Library Ground Floor',
  'Gate 1 Security Post',
  'Burns Hall (Nursing Bldg)',
  'Student Center Pavilion',
];

const YEAR_LEVELS = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'All Years'];

const QUICK_PRICES = ['150', '350', '500', '850', '1200'];

type Step = 1 | 2 | 3;

export default function SellScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addItem } = useItems();
  const itemCounterRef = useRef(0);

  // Active Step State
  const [currentStep, setCurrentStep] = useState<Step>(1);

  // Step 1: Item & Photos
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ItemCategory | null>(null);
  const [condition, setCondition] = useState<Condition | null>(null);

  // Step 2: Deal & Pricing
  const [tradeType, setTradeType] = useState<TradeType | null>(null);
  const [price, setPrice] = useState('');
  const [swapWishlist, setSwapWishlist] = useState('');
  const [description, setDescription] = useState('');

  // Step 3: Campus Handover & Context
  const [campus, setCampus] = useState(CAMPUS_OPTIONS[0]);
  const [safeMeetupSpot, setSafeMeetupSpot] = useState('');
  const [courseTag, setCourseTag] = useState('');
  const [yearLevel, setYearLevel] = useState<string | null>(null);

  // Submission & Success Sheet State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdItem, setCreatedItem] = useState<MarketplaceItem | null>(null);
  const [successModalVisible, setSuccessModalVisible] = useState(false);

  // Derived CO2 calculation
  const estimatedCo2 = useMemo(() => {
    if (!category) return 0;
    const cat = CATEGORIES.find((c) => c.label === category);
    return cat ? cat.co2 : 3.0;
  }, [category]);

  // Step 1 Validation
  const validateStep1 = (): boolean => {
    if (!title.trim()) {
      Alert.alert('Item Title Required', 'Please provide a descriptive title for your item.');
      return false;
    }
    if (title.trim().length < 3) {
      Alert.alert('Title Too Short', 'Please enter at least 3 characters for the title.');
      return false;
    }
    if (!category) {
      Alert.alert('Category Required', 'Please choose the category that best fits your item.');
      return false;
    }
    if (!condition) {
      Alert.alert('Condition Required', 'Please indicate the honest wear condition of your item.');
      return false;
    }
    return true;
  };

  // Step 2 Validation
  const validateStep2 = (): boolean => {
    if (!tradeType) {
      Alert.alert('Listing Type Required', 'Please select whether you want to Sell, Swap, or give as Freebie.');
      return false;
    }
    if (tradeType === 'buy') {
      const numPrice = Number(price);
      if (!price.trim() || isNaN(numPrice) || numPrice <= 0) {
        Alert.alert('Price Required', 'Please enter a valid price in Philippine Pesos (₱).');
        return false;
      }
    }
    return true;
  };

  // Step 3 & Final Validation
  const validateStep3 = (): boolean => {
    if (!safeMeetupSpot.trim()) {
      Alert.alert('Meetup Spot Required', 'Please select or enter a safe campus meetup zone.');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (validateStep1()) setCurrentStep(2);
    } else if (currentStep === 2) {
      if (validateStep2()) setCurrentStep(3);
    }
  };

  const handleBack = () => {
    if (currentStep === 2) setCurrentStep(1);
    if (currentStep === 3) setCurrentStep(2);
  };

  const handlePublish = async () => {
    if (!validateStep3()) return;

    setIsSubmitting(true);

    setTimeout(() => {
      itemCounterRef.current += 1;
      const generatedPhotos: ItemPhoto[] = photos.map((p, i) => ({
        id: p.id,
        label: p.label || (i === 0 ? 'Main View' : `Angle ${i + 1}`),
        iconName: 'cube-outline',
        uri: p.uri,
      }));

      const newItem: MarketplaceItem = {
        id: `user_item_${itemCounterRef.current}`,
        title: title.trim(),
        price: tradeType === 'buy' ? Number(price) : null,
        tradeType: tradeType!,
        category: category!,
        condition: condition!,
        courseTag: courseTag.trim() || undefined,
        yearLevel: yearLevel || undefined,
        campus,
        safeMeetupSpot: safeMeetupSpot.trim(),
        sellerName: 'You',
        sellerRating: 5.0,
        sellerYear: 'Verified Student',
        isVerifiedStudent: true,
        createdAt: 'Just now',
        imageUrl: photos.length > 0 ? photos[0].uri : undefined,
        photos: generatedPhotos.length > 0 ? generatedPhotos : undefined,
        description:
          description.trim() ||
          (tradeType === 'swap' && swapWishlist
            ? `Looking to trade for: ${swapWishlist}`
            : 'Pre-loved campus gear in great condition.'),
        estimatedCo2SavedKg: estimatedCo2,
      };

      addItem(newItem);
      setIsSubmitting(false);
      setCreatedItem(newItem);
      setSuccessModalVisible(true);
    }, 400);
  };

  const handleResetForm = () => {
    setPhotos([]);
    setTitle('');
    setTradeType(null);
    setPrice('');
    setCategory(null);
    setCondition(null);
    setCourseTag('');
    setYearLevel(null);
    setSafeMeetupSpot('');
    setDescription('');
    setSwapWishlist('');
    setCurrentStep(1);
    setCreatedItem(null);
    setSuccessModalVisible(false);
  };

  const handleGoToMarketplace = () => {
    setSuccessModalVisible(false);
    handleResetForm();
    router.push('/(tabs)/marketplace');
  };

  const handleViewCreatedItem = () => {
    if (!createdItem) return;
    setSuccessModalVisible(false);
    const itemId = createdItem.id;
    handleResetForm();
    router.push({
      pathname: '/item/[id]',
      params: { id: itemId },
    });
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: insets.top + Spacing.two,
              paddingBottom: insets.bottom + 90,
            },
          ]}>
          {/* Header & Progressive Stepper */}
          <View style={styles.headerBlock}>
            <View style={styles.topNavRow}>
              {currentStep > 1 ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Go back to previous step"
                  style={styles.backArrowBtn}
                  onPress={handleBack}>
                  <Ionicons name="arrow-back" size={22} color={theme.text} />
                </Pressable>
              ) : (
                <View style={styles.backPlaceholder} />
              )}
              <Text style={[styles.stepperPill, { color: theme.primary, backgroundColor: theme.primaryLight }]}>
                Step {currentStep} of 3
              </Text>
              <View style={styles.backPlaceholder} />
            </View>

            <Text style={[styles.stepMainHeading, { color: theme.text }]}>
              {currentStep === 1 && 'Item & Photos'}
              {currentStep === 2 && 'Pricing & Trade Deal'}
              {currentStep === 3 && 'Campus Meetup Spot'}
            </Text>
            <Text style={[styles.stepSubHeading, { color: theme.textSecondary }]}>
              {currentStep === 1 && 'Upload pictures and specify the item you are listing.'}
              {currentStep === 2 && 'Choose how you want to trade: sell for cash, barter, or gift.'}
              {currentStep === 3 && 'Designate a safe campus zone for physical item handover.'}
            </Text>

            {/* Stepper Progress Bar */}
            <View style={[styles.progressBarTrack, { backgroundColor: theme.border }]}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    backgroundColor: theme.primary,
                    width: currentStep === 1 ? '33.3%' : currentStep === 2 ? '66.6%' : '100%',
                  },
                ]}
              />
            </View>

            {/* Step Pills for Fast Navigation */}
            <View style={styles.stepPillRow}>
              <Pressable
                style={[
                  styles.navStepChip,
                  {
                    backgroundColor: currentStep === 1 ? theme.primaryLight : theme.surface,
                    borderColor: currentStep === 1 ? theme.primary : theme.border,
                  },
                ]}
                onPress={() => setCurrentStep(1)}>
                <Text
                  style={[
                    styles.navStepChipText,
                    {
                      color: currentStep === 1 ? theme.primary : theme.textSecondary,
                      fontWeight: currentStep === 1 ? '700' : '500',
                    },
                  ]}>
                  1. Basics
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.navStepChip,
                  {
                    backgroundColor: currentStep === 2 ? theme.primaryLight : theme.surface,
                    borderColor: currentStep === 2 ? theme.primary : theme.border,
                  },
                ]}
                onPress={() => {
                  if (validateStep1()) setCurrentStep(2);
                }}>
                <Text
                  style={[
                    styles.navStepChipText,
                    {
                      color: currentStep === 2 ? theme.primary : theme.textSecondary,
                      fontWeight: currentStep === 2 ? '700' : '500',
                    },
                  ]}>
                  2. Pricing
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.navStepChip,
                  {
                    backgroundColor: currentStep === 3 ? theme.primaryLight : theme.surface,
                    borderColor: currentStep === 3 ? theme.primary : theme.border,
                  },
                ]}
                onPress={() => {
                  if (validateStep1() && validateStep2()) setCurrentStep(3);
                }}>
                <Text
                  style={[
                    styles.navStepChipText,
                    {
                      color: currentStep === 3 ? theme.primary : theme.textSecondary,
                      fontWeight: currentStep === 3 ? '700' : '500',
                    },
                  ]}>
                  3. Meetup
                </Text>
              </Pressable>
            </View>
          </View>

          {/* ================= STEP 1: ITEM & PHOTOS ================= */}
          {currentStep === 1 && (
            <View style={styles.stepContent}>
              {/* Photo Picker */}
              <PhotoPickerSection
                photos={photos}
                onPhotosChange={setPhotos}
                maxPhotos={5}
              />

              {/* Title */}
              <View style={styles.cardSection}>
                <View style={styles.labelRow}>
                  <Text style={[styles.fieldLabel, { color: theme.text }]}>Item Title *</Text>
                  <Text style={[styles.charCount, { color: theme.textMuted }]}>{title.length}/80</Text>
                </View>
                <TextInput
                  style={[
                    styles.inputField,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                      color: theme.text,
                    },
                  ]}
                  placeholder="e.g. BS Tourism Corporate Blazer or Cabin Luggage"
                  placeholderTextColor={theme.textMuted}
                  value={title}
                  onChangeText={setTitle}
                  maxLength={80}
                />
              </View>

              {/* Category */}
              <View style={styles.cardSection}>
                <Text style={[styles.fieldLabel, { color: theme.text }]}>Category *</Text>
                <Text style={[styles.fieldSubLabel, { color: theme.textSecondary }]}>
                  Choose the academic category that matches your item
                </Text>
                <View style={styles.categoryGrid}>
                  {CATEGORIES.map((cat) => {
                    const isSelected = category === cat.label;
                    return (
                      <Pressable
                        key={cat.label}
                        accessibilityRole="button"
                        accessibilityLabel={cat.label}
                        style={[
                          styles.catTile,
                          {
                            backgroundColor: isSelected ? theme.primaryLight : theme.surface,
                            borderColor: isSelected ? theme.primary : theme.border,
                          },
                        ]}
                        onPress={() => setCategory(cat.label)}>
                        <View
                          style={[
                            styles.catTileIconBox,
                            { backgroundColor: isSelected ? theme.primary : theme.surfaceSubtle },
                          ]}>
                          <Ionicons
                            name={cat.icon}
                            size={20}
                            color={isSelected ? '#FFFFFF' : theme.primary}
                          />
                        </View>
                        <Text
                          style={[
                            styles.catTileTitle,
                            {
                              color: isSelected ? theme.primary : theme.text,
                              fontWeight: isSelected ? '700' : '500',
                            },
                          ]}>
                          {cat.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Condition */}
              <View style={styles.cardSection}>
                <Text style={[styles.fieldLabel, { color: theme.text }]}>Condition *</Text>
                <Text style={[styles.fieldSubLabel, { color: theme.textSecondary }]}>
                  Honest descriptions build trust and avoid meetup cancellations
                </Text>
                <View style={styles.conditionList}>
                  {CONDITIONS.map((cond) => {
                    const isSelected = condition === cond.label;
                    return (
                      <Pressable
                        key={cond.label}
                        accessibilityRole="button"
                        accessibilityLabel={cond.label}
                        style={[
                          styles.conditionItem,
                          {
                            backgroundColor: isSelected ? theme.primaryLight : theme.surface,
                            borderColor: isSelected ? theme.primary : theme.border,
                          },
                        ]}
                        onPress={() => setCondition(cond.label)}>
                        <View style={styles.conditionRadioOuter}>
                          {isSelected && (
                            <View style={[styles.conditionRadioInner, { backgroundColor: theme.primary }]} />
                          )}
                        </View>
                        <View style={styles.conditionTextWrap}>
                          <Text
                            style={[
                              styles.condItemTitle,
                              {
                                color: isSelected ? theme.primary : theme.text,
                                fontWeight: isSelected ? '700' : '600',
                              },
                            ]}>
                            {cond.label}
                          </Text>
                          <Text style={[styles.condItemDesc, { color: theme.textSecondary }]}>
                            {cond.desc}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>
          )}

          {/* ================= STEP 2: PRICING & DEAL ================= */}
          {currentStep === 2 && (
            <View style={styles.stepContent}>
              <View style={styles.cardSection}>
                <Text style={[styles.fieldLabel, { color: theme.text }]}>How do you want to list? *</Text>
                <Text style={[styles.fieldSubLabel, { color: theme.textSecondary }]}>
                  Select your preferred transaction format
                </Text>

                {/* Deal Type Option Cards */}
                <View style={styles.dealTypeCards}>
                  {/* Option 1: Sell for Cash */}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Sell for Student Cash"
                    style={[
                      styles.dealCard,
                      {
                        backgroundColor: tradeType === 'buy' ? theme.primaryLight : theme.surface,
                        borderColor: tradeType === 'buy' ? theme.primary : theme.border,
                      },
                    ]}
                    onPress={() => setTradeType('buy')}>
                    <View style={[styles.dealIconBox, { backgroundColor: theme.badgeGreenBg }]}>
                      <Ionicons name="cash-outline" size={24} color={theme.primary} />
                    </View>
                    <View style={styles.dealCardInfo}>
                      <Text style={[styles.dealCardTitle, { color: theme.text }]}>
                        Sell for Cash (₱)
                      </Text>
                      <Text style={[styles.dealCardDesc, { color: theme.textSecondary }]}>
                        Get paid via GCash, Maya, or cash upon campus handover.
                      </Text>
                    </View>
                    <View style={styles.dealRadioCircle}>
                      {tradeType === 'buy' && (
                        <View style={[styles.dealRadioDot, { backgroundColor: theme.primary }]} />
                      )}
                    </View>
                  </Pressable>

                  {/* Option 2: The Swap Zone */}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Swap or Barter"
                    style={[
                      styles.dealCard,
                      {
                        backgroundColor: tradeType === 'swap' ? theme.blueBg : theme.surface,
                        borderColor: tradeType === 'swap' ? theme.blue : theme.border,
                      },
                    ]}
                    onPress={() => setTradeType('swap')}>
                    <View style={[styles.dealIconBox, { backgroundColor: theme.blueBg }]}>
                      <Ionicons name="swap-horizontal-outline" size={24} color={theme.blue} />
                    </View>
                    <View style={styles.dealCardInfo}>
                      <Text style={[styles.dealCardTitle, { color: theme.text }]}>
                        The Swap Zone (Barter)
                      </Text>
                      <Text style={[styles.dealCardDesc, { color: theme.textSecondary }]}>
                        Trade for items you need. Zero money needed.
                      </Text>
                    </View>
                    <View style={styles.dealRadioCircle}>
                      {tradeType === 'swap' && (
                        <View style={[styles.dealRadioDot, { backgroundColor: theme.blue }]} />
                      )}
                    </View>
                  </Pressable>

                  {/* Option 3: Pay-It-Forward */}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Freebie Pay-It-Forward"
                    style={[
                      styles.dealCard,
                      {
                        backgroundColor: tradeType === 'free' ? theme.goldBg : theme.surface,
                        borderColor: tradeType === 'free' ? theme.gold : theme.border,
                      },
                    ]}
                    onPress={() => setTradeType('free')}>
                    <View style={[styles.dealIconBox, { backgroundColor: theme.goldBg }]}>
                      <Ionicons name="gift-outline" size={24} color={theme.gold} />
                    </View>
                    <View style={styles.dealCardInfo}>
                      <Text style={[styles.dealCardTitle, { color: theme.text }]}>
                        Pay-It-Forward (Freebie)
                      </Text>
                      <Text style={[styles.dealCardDesc, { color: theme.textSecondary }]}>
                        Gift gear to underclassmen or peers at ₱0.00.
                      </Text>
                    </View>
                    <View style={styles.dealRadioCircle}>
                      {tradeType === 'free' && (
                        <View style={[styles.dealRadioDot, { backgroundColor: theme.gold }]} />
                      )}
                    </View>
                  </Pressable>
                </View>
              </View>

              {/* Dynamic Price Input if 'buy' */}
              {tradeType === 'buy' && (
                <View style={styles.cardSection}>
                  <Text style={[styles.fieldLabel, { color: theme.text }]}>Price (₱ PHP) *</Text>
                  <Text style={[styles.fieldSubLabel, { color: theme.textSecondary }]}>
                    Set an affordable student price
                  </Text>
                  <View
                    style={[
                      styles.priceBox,
                      { backgroundColor: theme.surface, borderColor: theme.primary },
                    ]}>
                    <Text style={[styles.priceCurrencySymbol, { color: theme.primary }]}>₱</Text>
                    <TextInput
                      style={[styles.priceInputField, { color: theme.text }]}
                      placeholder="350"
                      placeholderTextColor={theme.textMuted}
                      value={price}
                      onChangeText={setPrice}
                      keyboardType="numeric"
                    />
                  </View>

                  {/* Quick price chips */}
                  <View style={styles.quickPriceRow}>
                    <Text style={[styles.quickPriceLabel, { color: theme.textSecondary }]}>Presets:</Text>
                    {QUICK_PRICES.map((p) => (
                      <Pressable
                        key={p}
                        style={[
                          styles.quickPricePill,
                          {
                            backgroundColor: price === p ? theme.primaryLight : theme.surface,
                            borderColor: price === p ? theme.primary : theme.border,
                          },
                        ]}
                        onPress={() => setPrice(p)}>
                        <Text
                          style={[
                            styles.quickPriceText,
                            { color: price === p ? theme.primary : theme.text },
                          ]}>
                          ₱{p}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}

              {/* Wishlist Input if 'swap' */}
              {tradeType === 'swap' && (
                <View style={styles.cardSection}>
                  <Text style={[styles.fieldLabel, { color: theme.text }]}>What would you like in trade?</Text>
                  <Text style={[styles.fieldSubLabel, { color: theme.textSecondary }]}>
                    State items or books you are currently seeking
                  </Text>
                  <TextInput
                    style={[
                      styles.inputField,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                        color: theme.text,
                      },
                    ]}
                    placeholder="e.g. BS Accountancy reviewers, desk lamp, or graphing paper"
                    placeholderTextColor={theme.textMuted}
                    value={swapWishlist}
                    onChangeText={setSwapWishlist}
                  />
                </View>
              )}

              {/* Description */}
              <View style={styles.cardSection}>
                <Text style={[styles.fieldLabel, { color: theme.text }]}>Description (Optional)</Text>
                <Text style={[styles.fieldSubLabel, { color: theme.textSecondary }]}>
                  Mention inclusions, highlights, or the semester it was used
                </Text>
                <TextInput
                  style={[
                    styles.textAreaField,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                      color: theme.text,
                    },
                  ]}
                  placeholder="e.g. Bought brand new last semester. Complete pages with light pencil notes. Comes with official plastic cover..."
                  placeholderTextColor={theme.textMuted}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </View>
          )}

          {/* ================= STEP 3: CAMPUS HANDOVER & REVIEW ================= */}
          {currentStep === 3 && (
            <View style={styles.stepContent}>
              {/* Campus Selector */}
              <View style={styles.cardSection}>
                <Text style={[styles.fieldLabel, { color: theme.text }]}>Campus *</Text>
                <View style={styles.campusToggleRow}>
                  {CAMPUS_OPTIONS.map((c) => {
                    const isSelected = campus === c;
                    return (
                      <Pressable
                        key={c}
                        style={[
                          styles.campusTab,
                          {
                            backgroundColor: isSelected ? theme.primary : theme.surface,
                            borderColor: isSelected ? theme.primary : theme.border,
                          },
                        ]}
                        onPress={() => setCampus(c)}>
                        <Ionicons
                          name="school-outline"
                          size={16}
                          color={isSelected ? '#FFFFFF' : theme.textSecondary}
                          style={{ marginRight: 6 }}
                        />
                        <Text
                          style={[
                            styles.campusTabText,
                            {
                              color: isSelected ? '#FFFFFF' : theme.text,
                              fontWeight: isSelected ? '700' : '500',
                            },
                          ]}>
                          {c === 'Ateneo de Naga University' ? 'Ateneo de Naga (AdNU)' : 'Univ. of Nueva Caceres (UNC)'}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Safe Meetup Spot */}
              <View style={styles.cardSection}>
                <Text style={[styles.fieldLabel, { color: theme.text }]}>Safe Campus Meetup Spot *</Text>
                <Text style={[styles.fieldSubLabel, { color: theme.textSecondary }]}>
                  Meet at verified secure zones (well-lit lobbies or guard stations)
                </Text>

                <View style={styles.spotChipGrid}>
                  {DEFAULT_MEETUP_SPOTS.map((spot) => {
                    const isSelected = safeMeetupSpot === spot;
                    return (
                      <Pressable
                        key={spot}
                        style={[
                          styles.spotTile,
                          {
                            backgroundColor: isSelected ? theme.primaryLight : theme.surface,
                            borderColor: isSelected ? theme.primary : theme.border,
                          },
                        ]}
                        onPress={() => setSafeMeetupSpot(spot)}>
                        <Ionicons
                          name="location-sharp"
                          size={16}
                          color={isSelected ? theme.primary : theme.textMuted}
                          style={{ marginRight: 6 }}
                        />
                        <Text
                          style={[
                            styles.spotTileText,
                            {
                              color: isSelected ? theme.primary : theme.text,
                              fontWeight: isSelected ? '700' : '500',
                            },
                          ]}>
                          {spot}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <TextInput
                  style={[
                    styles.inputField,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                      color: theme.text,
                      marginTop: Spacing.two,
                    },
                  ]}
                  placeholder="Or enter custom spot (e.g. Science Bldg Room 204)..."
                  placeholderTextColor={theme.textMuted}
                  value={safeMeetupSpot}
                  onChangeText={setSafeMeetupSpot}
                />
              </View>

              {/* Academic Program & Year Target (Optional) */}
              <View style={styles.cardSection}>
                <Text style={[styles.fieldLabel, { color: theme.text }]}>Academic Program (Optional)</Text>
                <TextInput
                  style={[
                    styles.inputField,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                      color: theme.text,
                    },
                  ]}
                  placeholder="e.g. BS Tourism Management, BS Accountancy"
                  placeholderTextColor={theme.textMuted}
                  value={courseTag}
                  onChangeText={setCourseTag}
                />

                <Text style={[styles.fieldLabel, { color: theme.text, marginTop: Spacing.three }]}>
                  Target Year Level
                </Text>
                <View style={styles.yearRow}>
                  {YEAR_LEVELS.map((yr) => {
                    const isSelected = yearLevel === yr;
                    return (
                      <Pressable
                        key={yr}
                        style={[
                          styles.yearButton,
                          {
                            backgroundColor: isSelected ? theme.primaryLight : theme.surface,
                            borderColor: isSelected ? theme.primary : theme.border,
                          },
                        ]}
                        onPress={() => setYearLevel(isSelected ? null : yr)}>
                        <Text
                          style={[
                            styles.yearButtonText,
                            {
                              color: isSelected ? theme.primary : theme.text,
                              fontWeight: isSelected ? '700' : '500',
                            },
                          ]}>
                          {yr}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Live Listing Summary Card */}
              <View style={styles.cardSection}>
                <Text style={[styles.fieldLabel, { color: theme.text }]}>Listing Preview</Text>
                <View
                  style={[
                    styles.summaryCard,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                  ]}>
                  <View style={styles.summaryTopRow}>
                    {photos.length > 0 ? (
                      <Image
                        source={{ uri: photos[0].uri }}
                        style={styles.summaryThumb}
                        contentFit="cover"
                      />
                    ) : (
                      <View style={[styles.summaryFallback, { backgroundColor: theme.primaryLight }]}>
                        <Ionicons name="cube-outline" size={28} color={theme.primary} />
                      </View>
                    )}

                    <View style={styles.summaryInfo}>
                      <Text style={[styles.summaryItemTitle, { color: theme.text }]} numberOfLines={2}>
                        {title || 'Untitled Item'}
                      </Text>

                      <View style={styles.summaryBadgeRow}>
                        <View style={[styles.summaryDealBadge, { backgroundColor: theme.primary }]}>
                          <Text style={styles.summaryDealBadgeText}>
                            {tradeType === 'buy'
                              ? `₱${price || '0'}`
                              : tradeType === 'swap'
                              ? 'Swap Zone'
                              : 'Freebie'}
                          </Text>
                        </View>
                        {category && (
                          <View style={[styles.summaryCategoryBadge, { backgroundColor: theme.surfaceSubtle }]}>
                            <Text style={[styles.summaryCategoryText, { color: theme.textSecondary }]}>
                              {category}
                            </Text>
                          </View>
                        )}
                      </View>

                      <Text style={[styles.summaryLocation, { color: theme.textSecondary }]} numberOfLines={1}>
                        📍 {safeMeetupSpot || 'Select meetup spot'} • {campus.includes('Ateneo') ? 'AdNU' : 'UNC'}
                      </Text>
                    </View>
                  </View>

                  {/* CO2 Savings Counter */}
                  <View style={[styles.summaryEcoRow, { borderTopColor: theme.border }]}>
                    <Ionicons name="leaf-outline" size={16} color={theme.primary} style={{ marginRight: 6 }} />
                    <Text style={[styles.summaryEcoText, { color: theme.primary }]}>
                      Estimated CO₂ Saved: ~{estimatedCo2.toFixed(1)} kg CO₂e
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Persistent Bottom Action Dock */}
        <View
          style={[
            styles.dockBar,
            {
              backgroundColor: theme.surface,
              borderTopColor: theme.border,
              paddingBottom: Math.max(insets.bottom, Spacing.three),
            },
          ]}>
          {currentStep === 1 && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Continue to Pricing"
              style={[styles.primaryActionBtn, { backgroundColor: theme.primary }]}
              onPress={handleNext}>
              <Text style={styles.primaryActionText}>Continue to Pricing →</Text>
            </Pressable>
          )}

          {currentStep === 2 && (
            <View style={styles.dockDualRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Go back to Step 1"
                style={[styles.dockBackBtn, { borderColor: theme.border, backgroundColor: theme.surfaceSubtle }]}
                onPress={handleBack}>
                <Ionicons name="arrow-back" size={18} color={theme.text} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Continue to Campus Handover"
                style={[styles.dockContinueBtn, { backgroundColor: theme.primary }]}
                onPress={handleNext}>
                <Text style={styles.primaryActionText}>Next: Campus Handover →</Text>
              </Pressable>
            </View>
          )}

          {currentStep === 3 && (
            <View style={styles.dockDualRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Go back to Step 2"
                style={[styles.dockBackBtn, { borderColor: theme.border, backgroundColor: theme.surfaceSubtle }]}
                onPress={handleBack}>
                <Ionicons name="arrow-back" size={18} color={theme.text} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Publish Listing"
                disabled={isSubmitting}
                style={[
                  styles.dockContinueBtn,
                  { backgroundColor: theme.primary, opacity: isSubmitting ? 0.85 : 1 },
                ]}
                onPress={handlePublish}>
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <View style={styles.dockBtnInner}>
                    <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.primaryActionText}>Publish Listing</Text>
                  </View>
                )}
              </Pressable>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Success Sheet Modal */}
      <Modal
        visible={successModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSuccessModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.successCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}>
            <View style={[styles.successCircle, { backgroundColor: theme.primaryLight }]}>
              <Ionicons name="checkmark-sharp" size={36} color={theme.primary} />
            </View>

            <Text style={[styles.successSheetTitle, { color: theme.text }]}>
              Listing Live on Campus!
            </Text>
            <Text style={[styles.successSheetSub, { color: theme.textSecondary }]}>
              Your gear is published and discoverable for peers at {createdItem?.campus}.
            </Text>

            {createdItem && (
              <View
                style={[
                  styles.previewItemBox,
                  { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
                ]}>
                {createdItem.imageUrl ? (
                  <Image
                    source={{ uri: createdItem.imageUrl }}
                    style={styles.previewBoxImg}
                    contentFit="cover"
                  />
                ) : (
                  <View style={[styles.previewBoxFallback, { backgroundColor: theme.primaryLight }]}>
                    <Ionicons name="cube-outline" size={24} color={theme.primary} />
                  </View>
                )}
                <View style={styles.previewBoxMeta}>
                  <Text style={[styles.previewBoxTitle, { color: theme.text }]} numberOfLines={1}>
                    {createdItem.title}
                  </Text>
                  <Text style={[styles.previewBoxPrice, { color: theme.primary }]}>
                    {createdItem.tradeType === 'buy'
                      ? `₱${createdItem.price}`
                      : createdItem.tradeType === 'swap'
                      ? 'Swap Trade'
                      : 'Freebie'}
                  </Text>
                  <Text style={[styles.previewBoxSpot, { color: theme.textSecondary }]} numberOfLines={1}>
                    📍 {createdItem.safeMeetupSpot}
                  </Text>
                </View>
              </View>
            )}

            <Pressable
              style={[styles.modalActionPrimary, { backgroundColor: theme.primary }]}
              onPress={handleViewCreatedItem}>
              <Text style={styles.modalActionPrimaryText}>View Listing</Text>
            </Pressable>

            <Pressable
              style={[styles.modalActionSecondary, { borderColor: theme.border }]}
              onPress={handleGoToMarketplace}>
              <Text style={[styles.modalActionSecondaryText, { color: theme.text }]}>
                Browse Marketplace
              </Text>
            </Pressable>

            <Pressable
              style={styles.modalActionTertiary}
              onPress={handleResetForm}>
              <Text style={[styles.modalActionTertiaryText, { color: theme.textSecondary }]}>
                List Another Item
              </Text>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
  },
  headerBlock: {
    marginBottom: Spacing.four,
  },
  topNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.one,
  },
  backArrowBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backPlaceholder: {
    width: 36,
    height: 36,
  },
  stepperPill: {
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  stepMainHeading: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  stepSubHeading: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: Spacing.three,
  },
  progressBarTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: Spacing.three,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  stepPillRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  navStepChip: {
    flex: 1,
    height: 34,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navStepChipText: {
    fontSize: 12,
  },
  stepContent: {
    gap: Spacing.four,
  },
  cardSection: {
    marginBottom: Spacing.two,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.one,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  fieldSubLabel: {
    fontSize: 12,
    marginBottom: Spacing.two,
  },
  charCount: {
    fontSize: 12,
  },
  inputField: {
    height: 50,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    paddingHorizontal: Spacing.three,
    fontSize: 15,
  },
  textAreaField: {
    minHeight: 110,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    padding: Spacing.three,
    fontSize: 15,
  },
  categoryGrid: {
    gap: Spacing.two,
  },
  catTile: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
  },
  catTileIconBox: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.three,
  },
  catTileTitle: {
    fontSize: 14,
    flexShrink: 1,
  },
  conditionList: {
    gap: Spacing.two,
  },
  conditionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
  },
  conditionRadioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#AAAAAA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.three,
  },
  conditionRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  conditionTextWrap: {
    flex: 1,
  },
  condItemTitle: {
    fontSize: 14,
    marginBottom: 2,
  },
  condItemDesc: {
    fontSize: 12,
  },
  dealTypeCards: {
    gap: Spacing.two,
  },
  dealCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
  },
  dealIconBox: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.three,
  },
  dealCardInfo: {
    flex: 1,
  },
  dealCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  dealCardDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  dealRadioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#AAAAAA',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.two,
  },
  dealRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  priceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: Radius.lg,
    borderWidth: 2,
    paddingHorizontal: Spacing.three,
    marginBottom: Spacing.two,
  },
  priceCurrencySymbol: {
    fontSize: 22,
    fontWeight: '800',
    marginRight: Spacing.two,
  },
  priceInputField: {
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
  },
  quickPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  quickPriceLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginRight: 4,
  },
  quickPricePill: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  quickPriceText: {
    fontSize: 12,
    fontWeight: '600',
  },
  campusToggleRow: {
    gap: Spacing.two,
  },
  campusTab: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    paddingHorizontal: Spacing.three,
  },
  campusTabText: {
    fontSize: 13,
  },
  spotChipGrid: {
    gap: Spacing.two,
    marginBottom: Spacing.one,
  },
  spotTile: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1.5,
  },
  spotTileText: {
    fontSize: 13,
  },
  yearRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  yearButton: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 8,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  yearButtonText: {
    fontSize: 12,
  },
  summaryCard: {
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    padding: Spacing.three,
    overflow: 'hidden',
  },
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  summaryThumb: {
    width: 72,
    height: 72,
    borderRadius: Radius.md,
    marginRight: Spacing.three,
  },
  summaryFallback: {
    width: 72,
    height: 72,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.three,
  },
  summaryInfo: {
    flex: 1,
  },
  summaryItemTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  summaryBadgeRow: {
    flexDirection: 'row',
    gap: Spacing.one,
    alignItems: 'center',
    marginBottom: 4,
  },
  summaryDealBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  summaryDealBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  summaryCategoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  summaryCategoryText: {
    fontSize: 10,
    fontWeight: '600',
  },
  summaryLocation: {
    fontSize: 11,
  },
  summaryEcoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  summaryEcoText: {
    fontSize: 12,
    fontWeight: '700',
  },
  dockBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderTopWidth: 1,
  },
  primaryActionBtn: {
    height: 52,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  dockDualRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  dockBackBtn: {
    width: 52,
    height: 52,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dockContinueBtn: {
    flex: 1,
    height: 52,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dockBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.five,
  },
  successCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.five,
    alignItems: 'center',
  },
  successCircle: {
    width: 68,
    height: 68,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.three,
  },
  successSheetTitle: {
    fontSize: 21,
    fontWeight: '800',
    marginBottom: Spacing.one,
  },
  successSheetSub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.four,
  },
  previewItemBox: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.two,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: Spacing.four,
  },
  previewBoxImg: {
    width: 56,
    height: 56,
    borderRadius: Radius.md,
    marginRight: Spacing.three,
  },
  previewBoxFallback: {
    width: 56,
    height: 56,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.three,
  },
  previewBoxMeta: {
    flex: 1,
  },
  previewBoxTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  previewBoxPrice: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  previewBoxSpot: {
    fontSize: 11,
  },
  modalActionPrimary: {
    width: '100%',
    height: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  modalActionPrimaryText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  modalActionSecondary: {
    width: '100%',
    height: 46,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  modalActionSecondaryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalActionTertiary: {
    paddingVertical: Spacing.two,
  },
  modalActionTertiaryText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
