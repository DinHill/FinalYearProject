import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { useNavigation } from '@react-navigation/native';
import { commonStyles } from '../../styles/commonStyles';
import { useResponsive } from '../../hooks/useResponsive';
import { adaptiveFontSize, adaptiveSpacing } from '../../utils/responsive';
import { useRole } from '../../context/RoleContext';

interface MenuItem {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  screen: string;
  roles: ('student' | 'teacher')[];
}

const MoreScreen = () => {
  const navigation = useNavigation();
  const responsive = useResponsive();
  const { role } = useRole();

  const menuItems: MenuItem[] = [
    {
      id: 'profile',
      title: 'Profile',
      subtitle: 'Account & settings',
      icon: 'account',
      color: COLORS.accent,
      screen: 'Profile',
      roles: ['student', 'teacher'],
    },
    {
      id: 'finance',
      title: 'Finance',
      subtitle: 'Tuition fees & payments',
      icon: 'cash-multiple',
      color: COLORS.primary,
      screen: 'Finance',
      roles: ['student'],
    },
    {
      id: 'announcements',
      title: 'Announcements',
      subtitle: 'Campus updates & news',
      icon: 'bullhorn',
      color: COLORS.warning,
      screen: 'Announcements',
      roles: ['student', 'teacher'],
    },
    {
      id: 'documents',
      title: 'Documents',
      subtitle: 'Request transcripts & certificates',
      icon: 'file-document',
      color: COLORS.info,
      screen: 'Documents',
      roles: ['student'],
    },
    {
      id: 'support',
      title: 'Support',
      subtitle: 'Help center & tickets',
      icon: 'help-circle',
      color: COLORS.secondary,
      screen: 'Support',
      roles: ['student', 'teacher'],
    },
  ];

  // Filter menu items based on user role
  const filteredMenuItems = menuItems.filter(item => 
    role && item.roles.includes(role as 'student' | 'teacher')
  );

  const handleMenuPress = (screen: string) => {
    navigation.navigate(screen as never);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={commonStyles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <MaterialCommunityIcons name="menu" size={24} color={COLORS.secondary} />
            </View>
            <Text style={styles.headerText}>More</Text>
          </View>
        </View>

        {/* Menu Items */}
        <View style={[styles.menuContainer, { paddingHorizontal: adaptiveSpacing.base, paddingTop: adaptiveSpacing.lg }]}>
          {filteredMenuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={() => handleMenuPress(item.screen)}
            >
              <View style={[styles.iconContainer, { backgroundColor: item.color + '15' }]}>
                <MaterialCommunityIcons name={item.icon as any} size={28} color={item.color} />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.gray} />
            </TouchableOpacity>
          ))}
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>University of Greenwich</Text>
          <Text style={styles.appInfoSubtext}>Academic Portal v1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
  },
  menuContainer: {},
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.base,
    borderRadius: BORDER_RADIUS.base,
    marginBottom: SPACING.sm,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.base,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.base,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: FONTS.base,
    fontWeight: '600' as any,
    color: COLORS.black,
    marginBottom: SPACING.xs / 2,
  },
  menuSubtitle: {
    fontSize: FONTS.sm,
    color: COLORS.gray,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    marginTop: SPACING.lg,
  },
  appInfoText: {
    fontSize: FONTS.sm,
    fontWeight: '600' as any,
    color: COLORS.grayDark,
    marginBottom: SPACING.xs / 2,
  },
  appInfoSubtext: {
    fontSize: FONTS.xs,
    color: COLORS.gray,
  },
});

export default MoreScreen;
