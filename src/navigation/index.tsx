import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ThemedIcon from '../components/ThemedIcon';
import Home from '../screens/Home';
import Settings from '../screens/Settings';
import { LabelsScreen } from '../screens/Labels';
import { useTheme } from '../contexts/ThemeContext';
import { colors, scaleFont } from '../styles/variables';

const Tab = createBottomTabNavigator();

function HomeIcon({ color }: { color: string }) {
  return <ThemedIcon lib="Ionicons" name="checkmark-circle-outline" size={24} color={color} />;
}

function LabelsIcon({ color }: { color: string }) {
  return <ThemedIcon lib="MaterialIcons" name="label-outline" size={24} color={color} />;
}

function SettingsIcon({ color }: { color: string }) {
  return <ThemedIcon lib="Ionicons" name="settings-outline" size={24} color={color} />;
}

interface AppNavigatorProps {
  todosHook: any;
  driveSync: any;
}

export default function AppNavigator({
  todosHook,
  driveSync,
}: AppNavigatorProps) {
  const { theme, fontScale } = useTheme();
  const insets = useSafeAreaInsets();
  // labels agora vem do Contexto, não precisa passar como prop
  // As telas Home e Labels já consomem o contexto diretamente

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
            fontSize: scaleFont(12, fontScale),
            fontWeight: '500',
          },
        }}
      >
        <Tab.Screen 
          name="Home"
          options={{
            tabBarLabel: 'Tarefas',
            tabBarIcon: HomeIcon,
          }}
        >
          {() => (
            <Home
              todos={todosHook.todos}
              add={todosHook.add}
              toggle={todosHook.toggle}
              remove={todosHook.remove}
              updateFields={todosHook.updateFields}
              getTodosByLabel={todosHook.getTodosByLabel}
              syncStatus={driveSync.syncStatus}
            />
          )}
        </Tab.Screen>
        <Tab.Screen 
          name="Labels"
          options={{
            tabBarLabel: 'Labels',
            tabBarIcon: LabelsIcon,
          }}
        >
          {() => (
            <LabelsScreen
              todos={todosHook.todos}
              syncLabelNow={driveSync.syncLabelNow}
              user={driveSync.user}
              markLabelDeleted={driveSync.markLabelDeleted}
              leaveSharedLabel={driveSync.leaveSharedLabel}
            />
          )}
        </Tab.Screen>
        <Tab.Screen 
          name="Settings"
          options={{
            tabBarLabel: 'Ajustes',
            tabBarIcon: SettingsIcon,
          }}
        >
          {() => (
            <Settings
              user={driveSync.user}
              syncStatus={driveSync.syncStatus}
              signIn={driveSync.signIn}
              signOut={driveSync.signOut}
              syncAll={driveSync.syncAll}
            />
          )}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}