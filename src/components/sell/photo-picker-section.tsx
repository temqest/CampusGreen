import React, { useRef, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface UploadedPhoto {
  id: string;
  uri: string;
  label?: string;
}

interface PhotoPickerSectionProps {
  photos: UploadedPhoto[];
  onPhotosChange: (photos: UploadedPhoto[]) => void;
  maxPhotos?: number;
}

// Realistic campus preset photos for fast simulator/web verification
const SAMPLE_PRESETS: { title: string; uri: string; label: string }[] = [
  {
    title: 'Textbook / Reviewer',
    uri: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80',
    label: 'Front Cover',
  },
  {
    title: 'Nursing Scrubs Set',
    uri: 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=600&q=80',
    label: 'Uniform Top',
  },
  {
    title: 'Casio Calculator',
    uri: 'https://images.unsplash.com/photo-1587145820266-a5951ee6f620?w=600&q=80',
    label: 'Display & Keypad',
  },
  {
    title: 'Dorm Study Lamp',
    uri: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&q=80',
    label: 'Desk Setup',
  },
];

export function PhotoPickerSection({
  photos,
  onPhotosChange,
  maxPhotos = 5,
}: PhotoPickerSectionProps) {
  const theme = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const photoCounterRef = useRef(0);

  const getNextId = (prefix = 'photo') => {
    photoCounterRef.current += 1;
    return `${prefix}_${photoCounterRef.current}`;
  };

  // Request permissions and open Gallery
  const handlePickFromLibrary = async () => {
    setModalVisible(false);
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Photo Library Access Required',
          'CampusGreen needs permission to access your photo library so you can upload pictures of your item.'
        );
        return;
      }

      const remainingSlots = maxPhotos - photos.length;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: remainingSlots,
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newPhotos: UploadedPhoto[] = result.assets.map((asset, index) => ({
          id: getNextId('gallery'),
          uri: asset.uri,
          label: photos.length === 0 && index === 0 ? 'Cover Photo' : `Angle ${photos.length + index + 1}`,
        }));
        onPhotosChange([...photos, ...newPhotos].slice(0, maxPhotos));
      }
    } catch {
      Alert.alert('Error', 'Unable to open photo library. Please try again.');
    }
  };

  // Request permissions and open Camera
  const handleTakePhoto = async () => {
    setModalVisible(false);
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Camera Access Required',
          'CampusGreen needs camera permission so you can take clear photos of your items.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const newPhoto: UploadedPhoto = {
          id: getNextId('camera'),
          uri: asset.uri,
          label: photos.length === 0 ? 'Cover Photo' : `Photo ${photos.length + 1}`,
        };
        onPhotosChange([...photos, newPhoto].slice(0, maxPhotos));
      }
    } catch {
      Alert.alert('Error', 'Unable to launch camera. Please try again.');
    }
  };

  // Add realistic sample photo for testing
  const handleAddSamplePreset = (preset: typeof SAMPLE_PRESETS[0]) => {
    setModalVisible(false);
    if (photos.length >= maxPhotos) return;

    const newPhoto: UploadedPhoto = {
      id: getNextId('sample'),
      uri: preset.uri,
      label: photos.length === 0 ? 'Cover Photo' : preset.label,
    };
    onPhotosChange([...photos, newPhoto]);
  };

  // Remove photo
  const handleRemovePhoto = (id: string) => {
    const updated = photos.filter((p) => p.id !== id);
    if (updated.length > 0) {
      updated[0] = { ...updated[0], label: 'Cover Photo' };
    }
    onPhotosChange(updated);
  };

  // Make selected photo the Cover photo
  const handleSetCoverPhoto = (index: number) => {
    if (index === 0) return;
    const target = photos[index];
    const remaining = photos.filter((_, i) => i !== index);
    const reordered = [
      { ...target, label: 'Cover Photo' },
      ...remaining.map((p, i) => ({ ...p, label: `Angle ${i + 2}` })),
    ];
    onPhotosChange(reordered);
  };

  const coverPhoto = photos[0];
  const secondaryPhotos = photos.slice(1);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Item Photos</Text>
          <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
            High-quality photos increase student interest by 3x
          </Text>
        </View>
        <View style={[styles.countPill, { backgroundColor: theme.surfaceSubtle, borderColor: theme.border }]}>
          <Text style={[styles.countPillText, { color: theme.primary }]}>
            {photos.length} / {maxPhotos}
          </Text>
        </View>
      </View>

      {/* Case A: Empty State -> Spacious Hero Upload Card */}
      {photos.length === 0 ? (
        <View
          style={[
            styles.emptyHeroCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}>
          <View style={[styles.emptyIconCircle, { backgroundColor: theme.primaryLight }]}>
            <Ionicons name="camera" size={32} color={theme.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>Upload Pictures</Text>
          <Text style={[styles.emptyDesc, { color: theme.textSecondary }]}>
            Upload up to 5 pictures from your camera or photo gallery. The first photo will be your main marketplace cover.
          </Text>

          <View style={styles.heroButtonRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Choose photos from gallery"
              style={[styles.heroPrimaryBtn, { backgroundColor: theme.primary }]}
              onPress={handlePickFromLibrary}>
              <Ionicons name="images-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.heroPrimaryBtnText}>Photo Gallery</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Take a photo with camera"
              style={[styles.heroSecondaryBtn, { borderColor: theme.border, backgroundColor: theme.surfaceSubtle }]}
              onPress={handleTakePhoto}>
              <Ionicons name="camera-outline" size={18} color={theme.text} style={{ marginRight: 6 }} />
              <Text style={[styles.heroSecondaryBtnText, { color: theme.text }]}>Take Photo</Text>
            </Pressable>
          </View>

          {/* Quick preset chips for rapid testing */}
          <View style={[styles.heroPresetDivider, { borderTopColor: theme.border }]}>
            <Text style={[styles.heroPresetLabel, { color: theme.textSecondary }]}>
              Quick Samples (For Testing):
            </Text>
            <View style={styles.heroPresetChips}>
              {SAMPLE_PRESETS.map((preset) => (
                <Pressable
                  key={preset.title}
                  style={[styles.heroSampleChip, { borderColor: theme.border, backgroundColor: theme.surfaceSubtle }]}
                  onPress={() => handleAddSamplePreset(preset)}>
                  <Text style={[styles.heroSampleChipText, { color: theme.text }]}>
                    + {preset.title}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      ) : (
        /* Case B: Photos Exist -> Hero Cover Preview + Secondary Thumbnails */
        <View style={styles.filledContainer}>
          {/* Main Cover Photo Card */}
          <View
            style={[
              styles.coverCard,
              { backgroundColor: theme.surfaceSubtle, borderColor: theme.primary },
            ]}>
            <Image
              source={{ uri: coverPhoto.uri }}
              style={styles.coverImage}
              contentFit="cover"
              transition={200}
            />

            {/* Top Left Badge */}
            <View style={[styles.coverTag, { backgroundColor: theme.primary }]}>
              <Ionicons name="star" size={11} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.coverTagText}>Cover Photo</Text>
            </View>

            {/* Delete Cover Button */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Delete cover photo"
              style={styles.cardDeleteBtn}
              onPress={() => handleRemovePhoto(coverPhoto.id)}>
              <Ionicons name="close" size={14} color="#FFFFFF" />
            </Pressable>
          </View>

          {/* Secondary Photos Row */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.secondaryList}>
            {secondaryPhotos.map((photo, index) => {
              const actualIndex = index + 1;
              return (
                <View
                  key={photo.id}
                  style={[
                    styles.secondaryThumbnailCard,
                    { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
                  ]}>
                  <Image
                    source={{ uri: photo.uri }}
                    style={styles.secondaryThumbnailImage}
                    contentFit="cover"
                  />

                  {/* Make Cover Button */}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Set as cover photo"
                    style={[styles.setCoverPill, { backgroundColor: theme.surface }]}
                    onPress={() => handleSetCoverPhoto(actualIndex)}>
                    <Text style={[styles.setCoverText, { color: theme.text }]}>Cover</Text>
                  </Pressable>

                  {/* Remove Button */}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Delete photo"
                    style={styles.secondaryDeleteBtn}
                    onPress={() => handleRemovePhoto(photo.id)}>
                    <Ionicons name="close" size={12} color="#FFFFFF" />
                  </Pressable>
                </View>
              );
            })}

            {/* Add More Slot */}
            {photos.length < maxPhotos && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Add more photos"
                style={[
                  styles.addMoreSlot,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
                onPress={() => setModalVisible(true)}>
                <View style={[styles.addMoreCircle, { backgroundColor: theme.primaryLight }]}>
                  <Ionicons name="add" size={20} color={theme.primary} />
                </View>
                <Text style={[styles.addMoreText, { color: theme.primary }]}>+ Add</Text>
                <Text style={[styles.addMoreLimit, { color: theme.textMuted }]}>
                  {maxPhotos - photos.length} left
                </Text>
              </Pressable>
            )}
          </ScrollView>
        </View>
      )}

      {/* Action Sheet Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <View
            style={[
              styles.modalSheet,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
            onStartShouldSetResponder={() => true}>
            <View style={styles.sheetHandle} />
            <Text style={[styles.modalTitle, { color: theme.text }]}>Add Item Photos</Text>
            <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
              Clear photos from multiple angles help students buy with confidence.
            </Text>

            <Pressable
              style={({ pressed }) => [
                styles.modalOption,
                { backgroundColor: pressed ? theme.surfaceSubtle : 'transparent' },
              ]}
              onPress={handleTakePhoto}>
              <View style={[styles.optionIconContainer, { backgroundColor: theme.primaryLight }]}>
                <Ionicons name="camera-outline" size={22} color={theme.primary} />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={[styles.optionTitle, { color: theme.text }]}>Take a Live Photo</Text>
                <Text style={[styles.optionDesc, { color: theme.textSecondary }]}>
                  Use your device camera for instant capture
                </Text>
              </View>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.modalOption,
                { backgroundColor: pressed ? theme.surfaceSubtle : 'transparent' },
              ]}
              onPress={handlePickFromLibrary}>
              <View style={[styles.optionIconContainer, { backgroundColor: theme.blueBg }]}>
                <Ionicons name="images-outline" size={22} color={theme.blue} />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={[styles.optionTitle, { color: theme.text }]}>Choose from Gallery</Text>
                <Text style={[styles.optionDesc, { color: theme.textSecondary }]}>
                  Select up to {maxPhotos - photos.length} photos from your library
                </Text>
              </View>
            </Pressable>

            {/* Cancel Button */}
            <Pressable
              style={[styles.cancelButton, { backgroundColor: theme.surfaceSubtle }]}
              onPress={() => setModalVisible(false)}>
              <Text style={[styles.cancelButtonText, { color: theme.text }]}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.four,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 13,
  },
  countPill: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  countPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyHeroCard: {
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    padding: Spacing.five,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.three,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptyDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.four,
    maxWidth: '90%',
  },
  heroButtonRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    width: '100%',
  },
  heroPrimaryBtn: {
    flex: 1,
    height: 44,
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  heroSecondaryBtn: {
    flex: 1,
    height: 44,
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroSecondaryBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  heroPresetDivider: {
    width: '100%',
    marginTop: Spacing.four,
    paddingTop: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  heroPresetLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.two,
  },
  heroPresetChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  heroSampleChip: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  heroSampleChipText: {
    fontSize: 11,
    fontWeight: '500',
  },
  filledContainer: {
    gap: Spacing.three,
  },
  coverCard: {
    width: '100%',
    height: 180,
    borderRadius: Radius.lg,
    borderWidth: 2,
    overflow: 'hidden',
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverTag: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  coverTagText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  cardDeleteBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 26,
    height: 26,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryList: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingVertical: 2,
  },
  secondaryThumbnailCard: {
    width: 80,
    height: 80,
    borderRadius: Radius.md,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  secondaryThumbnailImage: {
    width: '100%',
    height: '100%',
  },
  setCoverPill: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    right: 4,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    alignItems: 'center',
  },
  setCoverText: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  secondaryDeleteBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMoreSlot: {
    width: 80,
    height: 80,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMoreCircle: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  addMoreText: {
    fontSize: 11,
    fontWeight: '700',
  },
  addMoreLimit: {
    fontSize: 9,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    borderTopWidth: 1,
    paddingHorizontal: Spacing.five,
    paddingTop: Spacing.three,
    paddingBottom: Platform.OS === 'ios' ? Spacing.seven : Spacing.five,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CCCCCC',
    alignSelf: 'center',
    marginBottom: Spacing.three,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    marginBottom: Spacing.four,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderRadius: Radius.md,
    marginBottom: Spacing.two,
  },
  optionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.three,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  optionDesc: {
    fontSize: 12,
  },
  cancelButton: {
    paddingVertical: Spacing.three,
    borderRadius: Radius.lg,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
