import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { scaleFont } from '../styles/variables';
import { useSyncContext } from '../contexts/SyncContext';

export const SyncProgressIndicator: React.FC = () => {
  const { theme, fontScale } = useTheme();
  const { syncStatus } = useSyncContext();
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (syncStatus.status === 'syncing') {
      setVisible(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setVisible(false));
    }
  }, [syncStatus.status, fadeAnim]);

  if (!visible) return null;

  const progress = syncStatus.progress;
  const percentage = progress && progress.total > 0 
    ? Math.round((progress.current / progress.total) * 100) 
    : 0;

  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          backgroundColor: theme.surface, 
          top: insets.top + 10, // Respeita a área segura + margem
          opacity: fadeAnim,
        }
      ]}
    >
      <View style={styles.content}>
        {progress?.message && (
          <Text style={[styles.statusText, { color: theme.textSecondary, fontSize: scaleFont(12, fontScale) }]}> 
            {progress.message}
          </Text>
        )}
        {progress && (
          <Text style={[styles.percentageText, { color: theme.primary, fontSize: scaleFont(12, fontScale) }]}> 
            {percentage}%
          </Text>
        )}
        <ActivityIndicator size="small" color={theme.primary} style={styles.indicator} />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 16,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    zIndex: 9999, // Garante que fique acima de tudo
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontWeight: '500',
    marginRight: 4,
  },
  percentageText: {
    fontWeight: 'bold',
  },
  indicator: {
    marginLeft: 8,
  },
});
