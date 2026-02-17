import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import Home from '../screens/Home';
import Settings from '../screens/Settings';
import { useTheme } from '../contexts/ThemeContext';
import { colors } from '../styles/variables';

const Tab = createBottomTabNavigator();

function HomeIcon({ color }: { color: string }) {
  return <Icon name="checkmark-circle-outline" size={24} color={color} />;
}

function SettingsIcon({ color }: { color: string }) {
  return <Icon name="settings-outline" size={24} color={color} />;
}

export default function AppNavigator() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: theme.surface,
            borderTopColor: theme.border,
            borderTopWidth: 1,
            paddingBottom: Math.max(insets.bottom, 4),
            height: 60 + Math.max(insets.bottom, 0),
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: theme.textTertiary,
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
          },
        }}
      >
        <Tab.Screen 
          name="Home" 
          component={Home}
          options={{
            tabBarLabel: 'Tarefas',
            tabBarIcon: HomeIcon,
          }}
        />
        <Tab.Screen 
          name="Settings" 
          component={Settings}
          options={{
            tabBarLabel: 'Ajustes',
            tabBarIcon: SettingsIcon,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}