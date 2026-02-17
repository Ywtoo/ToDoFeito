import React from 'react';
import { View, Text, StyleSheet, Switch, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { spacing, fontSize, borderRadius, shadows } from '../styles/variables';

export default function Settings() {
  const { theme, isDark, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();

  const styles = StyleSheet.create({
    scrollContainer: {
      flex: 1,
      backgroundColor: theme.background,
    },
    container: { 
      flex: 1, 
      padding: spacing.lg,
      paddingTop: spacing.lg + insets.top,
    },
    title: { 
      fontSize: fontSize.xxl + 4, 
      fontWeight: '700', 
      marginBottom: spacing.xl,
      color: theme.text,
    },
    section: {
      backgroundColor: theme.surface,
      padding: spacing.lg,
      borderRadius: borderRadius.md,
      marginBottom: spacing.md,
      ...shadows.small,
    },
    sectionTitle: {
      fontSize: fontSize.sm,
      fontWeight: '600',
      color: theme.textSecondary,
      marginBottom: spacing.md,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.sm,
    },
    rowLabel: {
      fontSize: fontSize.base,
      fontWeight: '500',
      color: theme.text,
    },
    description: {
      fontSize: fontSize.sm,
      color: theme.textSecondary,
      marginTop: spacing.md,
      lineHeight: 20,
    },
  });

  return (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>Configurações</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>APARÊNCIA</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Tema Escuro</Text>
            <Switch value={isDark} onValueChange={toggleTheme} />
          </View>
          <Text style={styles.description}>
            O tema segue automaticamente as preferências do sistema. 
            Use esta opção para alternar manualmente (mais configurações em breve).
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
