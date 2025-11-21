import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../constants/theme';
import TeacherHomeScreen from '../screens/teacher/TeacherHomeScreen';
import TeacherScheduleScreen from '../screens/teacher/TeacherScheduleScreen';
import AttendanceManagementScreen from '../screens/teacher/AttendanceManagementScreen';
import GradeEntryScreen from '../screens/teacher/GradeEntryScreen';
import MoreScreen from '../screens/more/MoreScreen';
import AnnouncementsScreen from '../screens/announcements/AnnouncementsScreen';
import DocumentsScreen from '../screens/documents/DocumentsScreen';
import SupportScreen from '../screens/chat/SupportScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator();
const MoreStack = createNativeStackNavigator();

const MoreStackNavigator = () => (
  <MoreStack.Navigator screenOptions={{ headerShown: false }}>
    <MoreStack.Screen name="MoreHome" component={MoreScreen} />
    <MoreStack.Screen name="Announcements" component={AnnouncementsScreen} />
    <MoreStack.Screen name="Documents" component={DocumentsScreen} />
    <MoreStack.Screen name="Support" component={SupportScreen} />
    <MoreStack.Screen name="Profile" component={ProfileScreen} />
  </MoreStack.Navigator>
);

const TeacherTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ color, size }) => {
        const map: Record<string, string> = {
          Dashboard: 'view-dashboard',
          Attendance: 'clipboard-check',
          Grades: 'pencil-box',
          Schedule: 'calendar',
          More: 'menu',
        };
        return (
          <MaterialCommunityIcons name={map[route.name] || 'circle'} size={size} color={color} />
        );
      },
      tabBarActiveTintColor: COLORS.primary,
      tabBarInactiveTintColor: COLORS.gray,
      tabBarStyle: { backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.grayLight, height: 60 },
      tabBarLabelStyle: { fontSize: FONTS.xs, fontWeight: FONTS.medium as any },
      headerShown: false,
    })}
  >
    <Tab.Screen name="Dashboard" component={TeacherHomeScreen} />
    <Tab.Screen name="Attendance" component={AttendanceManagementScreen} />
    <Tab.Screen name="Grades" component={GradeEntryScreen} />
    <Tab.Screen name="Schedule" component={TeacherScheduleScreen} />
    <Tab.Screen name="More" component={MoreStackNavigator} />
  </Tab.Navigator>
);

export default TeacherTabs;


