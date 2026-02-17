import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import Home from '../screens/Home';
import Settings from '../screens/Settings';
import { LabelsScreen } from '../screens/Labels';
import { useTheme } from '../contexts/ThemeContext';
import { colors } from '../styles/variables';

const Tab = createBottomTabNavigator();

function HomeIcon({ color }: { color: string }) {
  return <Icon name="checkmark-circle-outline" size={24} color={color} />;
}

function LabelsIcon({ color }: { color: string }) {
  return <MaterialIcon name="label-outline" size={24} color={color} />;
}

function SettingsIcon({ color }: { color: string }) {
  return <Icon name="settings-outline" size={24} color={color} />;
}

interface AppNavigatorProps {
  labelsHook: any;
  todosHook: any;
  driveSync: any;
}

export default function AppNavigator({
  labelsHook,
  todosHook,
  driveSync,
}: AppNavigatorProps) {
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
          options={{
            tabBarLabel: 'Tarefas',
            tabBarIcon: HomeIcon,
          }}
        >
          {() => (
            <Home
              labels={labelsHook.labels}
              todos={todosHook.todos}
              add={todosHook.add}
              toggle={todosHook.toggle}
              remove={todosHook.remove}
              updateFields={todosHook.updateFields}
              getTodosByLabel={todosHook.getTodosByLabel}
              getDefaultLabel={labelsHook.getDefaultLabel}
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
              labels={labelsHook.labels}
              todos={todosHook.todos}
              createLabel={labelsHook.createLabel}
              updateLabel={labelsHook.updateLabel}
              deleteLabel={labelsHook.deleteLabel}
              syncLabelNow={driveSync.syncLabelNow}
              user={driveSync.user}
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