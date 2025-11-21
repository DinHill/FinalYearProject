import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Modal, TextInput, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import Card from '../../components/common/Card';
import { useAuth } from '../../context/AuthContext';
import { commonStyles } from '../../styles/commonStyles';
import { api } from '../../services/api';
import { useNavigation } from '@react-navigation/native';
import { useResponsive } from '../../hooks/useResponsive';
import { adaptiveFontSize, adaptiveSpacing } from '../../utils/responsive';
import { uploadImageToCloudinary } from '../../utils/cloudinary';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const responsive = useResponsive();
  const { user, logout, refreshUser } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    full_name: user?.full_name || '',
    phone_number: user?.phone_number || '',
    date_of_birth: user?.date_of_birth || '',
    gender: user?.gender || '',
  });

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const imageUri = result.assets[0].uri;
      setAvatarUri(imageUri);

      // Show uploading alert
      Alert.alert('Uploading', 'Please wait while we upload your avatar...');

      try {
        // Upload to Cloudinary
        const uploadResult = await uploadImageToCloudinary(imageUri);

        if (!uploadResult.success) {
          throw new Error(uploadResult.error || 'Upload failed');
        }

        // Update backend with Cloudinary URL
        const response = await api.updateProfile({
          avatar_url: uploadResult.url,
        });

        if (!response.success) {
          throw new Error(response.error || 'Failed to update profile');
        }

        Alert.alert('Success', 'Avatar updated successfully!');
        
        // Refresh user data to show new avatar
        if (refreshUser) {
          await refreshUser();
        }
      } catch (error: any) {
        Alert.alert('Error', error.message || 'Failed to upload avatar');
        // Revert local state on error
        setAvatarUri(user?.avatar_url || null);
      }
    }
  };

  const handleEdit = () => {
    setEditForm({
      full_name: user?.full_name || '',
      phone_number: user?.phone_number || '',
      date_of_birth: user?.date_of_birth || '',
      gender: user?.gender || '',
    });
    setEditMode(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await api.updateProfile(editForm);
      if (!response.success) {
        throw new Error(response.error || 'Failed to update profile');
      }
      Alert.alert('Success', 'Profile updated successfully');
      setEditMode(false);
      // Optionally refresh user data here
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to logout');
            }
          },
        },
      ]
    );
  };

  const getStatusText = (status?: string) => {
    if (!status) return 'Active';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const academicInfo = [
    {
      icon: 'school',
      title: 'Role',
      value: user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) || 'Student',
      color: COLORS.primary,
    },
    {
      icon: 'calendar',
      title: 'Year Entered',
      value: user?.year_entered?.toString() || 'N/A',
      color: COLORS.secondary,
    },
    {
      icon: 'account-check',
      title: 'Status',
      value: getStatusText(user?.status),
      color: COLORS.info,
    },
    {
      icon: 'map-marker',
      title: 'Campus',
      value: user?.campus_id ? `Campus ${user.campus_id}` : 'N/A',
      color: COLORS.accent,
    },
  ];

  const personalInfo = [
    {
      icon: 'email',
      title: 'Email',
      value: user?.email || 'N/A',
      color: COLORS.primary,
    },
    {
      icon: 'phone',
      title: 'Phone',
      value: user?.phone_number || 'N/A',
      color: COLORS.secondary,
    },
    {
      icon: 'account',
      title: 'Username',
      value: user?.username || 'N/A',
      color: COLORS.warning,
    },
    {
      icon: 'calendar',
      title: 'Date of Birth',
      value: formatDate(user?.date_of_birth),
      color: COLORS.accent,
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={commonStyles.header}>
          <View style={styles.logoContainer}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.white} />
            </TouchableOpacity>
            <View style={styles.logo}>
              <MaterialCommunityIcons name="account" size={24} color={COLORS.secondary} />
            </View>
            <Text style={styles.headerText}>My Profile</Text>
          </View>
          <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
            <MaterialCommunityIcons name="pencil" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <TouchableOpacity style={styles.profileImageContainer} onPress={handlePickImage}>
            {avatarUri || user?.avatar_url ? (
              <Image 
                source={{ uri: avatarUri || user?.avatar_url }} 
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.profileImage}>
                <MaterialCommunityIcons name="account" size={48} color={COLORS.gray} />
              </View>
            )}
            <View style={styles.cameraButton}>
              <MaterialCommunityIcons name="camera" size={16} color={COLORS.white} />
            </View>
          </TouchableOpacity>
          <View style={styles.profileInfo}>
            <Text style={styles.studentName}>{user?.full_name || 'User'}</Text>
            <Text style={styles.studentId}>ID: {user?.username || 'N/A'}</Text>
            <View style={styles.statusTags}>
              <View style={styles.statusTag}>
                <Text style={styles.statusTagText}>{getStatusText(user?.status)}</Text>
              </View>
              <View style={[styles.statusTag, { backgroundColor: COLORS.secondary }]}>
                <Text style={styles.statusTagText}>Verified</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Academic Information */}
        <Card style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Academic Information</Text>
          
          {academicInfo.map((item, index) => (
            <View key={index} style={styles.infoItem}>
              <View style={[styles.infoIcon, { backgroundColor: item.color }]}>
                <MaterialCommunityIcons name={item.icon as any} size={20} color={COLORS.white} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>{item.title}</Text>
                <Text style={styles.infoValue}>{item.value}</Text>
              </View>
            </View>
          ))}
        </Card>

        {/* Personal Information */}
        <Card style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          {personalInfo.map((item, index) => (
            <View key={index} style={styles.infoItem}>
              <View style={[styles.infoIcon, { backgroundColor: item.color }]}>
                <MaterialCommunityIcons name={item.icon as any} size={20} color={COLORS.white} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>{item.title}</Text>
                <Text style={styles.infoValue}>{item.value}</Text>
              </View>
            </View>
          ))}
        </Card>

        {/* Logout Button */}
        <Card style={styles.infoCard}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <MaterialCommunityIcons name="logout" size={24} color={COLORS.error} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </Card>

        {/* Additional Info Placeholder */}
        <View style={styles.additionalInfo}>
          <Text style={styles.additionalInfoText}>Account created: {formatDate(user?.created_at)}</Text>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={editMode}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditMode(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setEditMode(false)}>
                <MaterialCommunityIcons name="close" size={24} color={COLORS.black} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Full Name</Text>
                <TextInput
                  style={styles.formInput}
                  value={editForm.full_name}
                  onChangeText={(text) => setEditForm({ ...editForm, full_name: text })}
                  placeholder="Enter your full name"
                  placeholderTextColor={COLORS.gray}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Phone Number</Text>
                <TextInput
                  style={styles.formInput}
                  value={editForm.phone_number}
                  onChangeText={(text) => setEditForm({ ...editForm, phone_number: text })}
                  placeholder="Enter your phone number"
                  placeholderTextColor={COLORS.gray}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Date of Birth</Text>
                <TextInput
                  style={styles.formInput}
                  value={editForm.date_of_birth}
                  onChangeText={(text) => setEditForm({ ...editForm, date_of_birth: text })}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={COLORS.gray}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Gender</Text>
                <View style={styles.genderButtons}>
                  {['male', 'female', 'other'].map((gender) => (
                    <TouchableOpacity
                      key={gender}
                      style={[
                        styles.genderButton,
                        editForm.gender === gender && styles.genderButtonActive,
                      ]}
                      onPress={() => setEditForm({ ...editForm, gender })}
                    >
                      <Text
                        style={[
                          styles.genderButtonText,
                          editForm.gender === gender && styles.genderButtonTextActive,
                        ]}
                      >
                        {gender.charAt(0).toUpperCase() + gender.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SPACING.lg,
    paddingBottom: 0,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    padding: SPACING.xs,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  headerText: {
    color: COLORS.white,
    fontSize: FONTS.lg,
    fontWeight: FONTS.semibold as any,
    marginTop: 2,
  },
  editButton: {
    padding: SPACING.xs,
  },
  profileCard: {
    backgroundColor: COLORS.primary,
    marginHorizontal: SPACING.base,
    marginTop: SPACING.base,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImageContainer: {
    position: 'relative',
    marginRight: SPACING.base,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  profileInfo: {
    flex: 1,
  },
  studentName: {
    color: COLORS.white,
    fontSize: FONTS['2xl'],
    fontWeight: FONTS.bold as any,
    marginBottom: SPACING.xs,
  },
  studentId: {
    color: COLORS.white,
    fontSize: FONTS.base,
    marginBottom: SPACING.sm,
  },
  statusTags: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  statusTag: {
    backgroundColor: COLORS.gray,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  statusTagText: {
    color: COLORS.white,
    fontSize: FONTS.xs,
    fontWeight: FONTS.medium as any,
  },
  infoCard: {
    marginHorizontal: SPACING.base,
    marginTop: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONTS.lg,
    fontWeight: FONTS.semibold as any,
    color: COLORS.black,
    marginBottom: SPACING.base,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.base,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.base,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: FONTS.sm,
    color: COLORS.gray,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: FONTS.base,
    color: COLORS.black,
    fontWeight: FONTS.medium as any,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.base,
  },
  logoutText: {
    fontSize: FONTS.lg,
    color: COLORS.error,
    fontWeight: FONTS.semibold as any,
    marginLeft: SPACING.sm,
  },
  additionalInfo: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  additionalInfoText: {
    fontSize: FONTS.sm,
    color: COLORS.gray,
    fontStyle: 'italic',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderTopRightRadius: BORDER_RADIUS.lg,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayLight,
  },
  modalTitle: {
    fontSize: FONTS.xl,
    fontWeight: '700',
    color: COLORS.black,
  },
  modalBody: {
    padding: SPACING.lg,
  },
  formGroup: {
    marginBottom: SPACING.lg,
  },
  formLabel: {
    fontSize: FONTS.base,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: SPACING.sm,
  },
  formInput: {
    borderWidth: 1,
    borderColor: COLORS.grayLight,
    borderRadius: BORDER_RADIUS.base,
    padding: SPACING.base,
    fontSize: FONTS.base,
    color: COLORS.black,
    backgroundColor: COLORS.white,
  },
  genderButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  genderButton: {
    flex: 1,
    paddingVertical: SPACING.base,
    borderWidth: 1,
    borderColor: COLORS.grayLight,
    borderRadius: BORDER_RADIUS.base,
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  genderButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  genderButtonText: {
    fontSize: FONTS.base,
    color: COLORS.black,
    fontWeight: '600',
  },
  genderButtonTextActive: {
    color: COLORS.white,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.base,
    borderRadius: BORDER_RADIUS.base,
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  saveButtonDisabled: {
    backgroundColor: COLORS.gray,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: FONTS.lg,
    fontWeight: '700',
  },
});

export default ProfileScreen;
