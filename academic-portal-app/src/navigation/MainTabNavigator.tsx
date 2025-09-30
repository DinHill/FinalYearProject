import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { COLORS, FONTS } from '../constants/theme';

// Import screens (we'll create these next)
import HomeScreen from '../screens/dashboard/HomeScreen';
import ScheduleScreen from '../screens/schedule/ScheduleScreen';
import AcademicScreen from '../screens/academic/AcademicScreen';
import DocumentsScreen from '../screens/documents/DocumentsScreen';
import AIChatScreen from '../screens/chat/AIChatScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

// Import icons from Expo
import { MaterialCommunityIcons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'Home':
              iconName = 'home';
              break;
            case 'Schedule':
              iconName = 'calendar';
              break;
            case 'Academic':
              iconName = 'school';
              break;
            case 'Documents':
              iconName = 'file-document';
              break;
            case 'AI Chat':
              iconName = 'chat';
              break;
            case 'Profile':
              iconName = 'account';
              break;
            default:
              iconName = 'circle';
          }

          return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopWidth: 1,
          borderTopColor: COLORS.grayLight,
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: FONTS.xs,
          fontWeight: FONTS.medium as any,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen 
        name="Schedule" 
        component={ScheduleScreen}
        options={{
          tabBarLabel: 'Schedule',
        }}
      />
      <Tab.Screen 
        name="Academic" 
        component={AcademicScreen}
        options={{
          tabBarLabel: 'Academic',
        }}
      />
      <Tab.Screen 
        name="Documents" 
        component={DocumentsScreen}
        options={{
          tabBarLabel: 'Documents',
        }}
      />
      <Tab.Screen 
        name="AI Chat" 
        component={AIChatScreen}
        options={{
          tabBarLabel: 'AI Chat',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;