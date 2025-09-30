import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../constants/theme';
import HomeScreen from '../screens/dashboard/HomeScreen';
import ScheduleScreen from '../screens/schedule/ScheduleScreen';
import AcademicScreen from '../screens/academic/AcademicScreen';
import DocumentsScreen from '../screens/documents/DocumentsScreen';
import AIChatScreen from '../screens/chat/AIChatScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator();

const StudentTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ color, size }) => {
        const map: Record<string, string> = {
          Home: 'home',
          Schedule: 'calendar',
          Academic: 'school',
          Documents: 'file-document',
          'AI Chat': 'chat',
          Profile: 'account',
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
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Schedule" component={ScheduleScreen} />
    <Tab.Screen name="Academic" component={AcademicScreen} />
    <Tab.Screen name="Documents" component={DocumentsScreen} />
    <Tab.Screen name="AI Chat" component={AIChatScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

export default StudentTabs;


