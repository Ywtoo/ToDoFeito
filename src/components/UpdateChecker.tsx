import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { useTheme } from '../contexts/ThemeContext';
import { createUpdateCheckerStyles } from '../styles/UpdateChecker.style';

interface RemoteInfo {
  tag_name?: string;
  html_url?: string;
}

export default function UpdateChecker() {
  // Show update checker in production and development. It's safe and non-blocking.
  const LOCAL_VERSION = DeviceInfo.getVersion() || '0.0.0';
  const { theme, fontScale } = useTheme();
  const styles = createUpdateCheckerStyles(theme, fontScale);

  const [loading, setLoading] = useState(false);
  const [remote, setRemote] = useState<RemoteInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function check() {
      setLoading(true);
      try {
        const res = await fetch('https://api.github.com/repos/Ywtoo/ToDoFeito/releases/latest', {
          headers: { Accept: 'application/vnd.github.v3+json' },
        });
        if (!mounted) return;
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setRemote({ tag_name: json.tag_name, html_url: json.html_url });
      } catch (err: any) {
        setError(err?.message || 'Failed to check updates');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    // run check but don't block the UI; failures are caught
    check();
    return () => { mounted = false; };
  }, []);

  const hasUpdate = !!(remote && remote.tag_name && remote.tag_name !== LOCAL_VERSION);

  if (loading) return (
    <View style={styles.container}><ActivityIndicator size="small" /></View>
  );

  if (!remote || (!hasUpdate && !error)) {
    // show current version only (minimal footprint), aligned to the right
    return (
      <View style={styles.containerRight}>
        <Text style={styles.text}>Versão: {LOCAL_VERSION}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.containerRight}>
        <Text style={styles.error}>Versão: {LOCAL_VERSION}</Text>
      </View>
    );
  }

  return (
    <View style={styles.updateBox}>
      <Text style={styles.updateText}>Nova versão disponível: {remote?.tag_name}</Text>
      <TouchableOpacity style={styles.button} onPress={() => {
        const url = remote?.html_url || 'https://github.com/Ywtoo/ToDoFeito/releases/latest';
        Linking.openURL(url).catch(() => {});
      }}>
        <Text style={styles.buttonText}>Abrir no GitHub</Text>
      </TouchableOpacity>
      <Text style={styles.small}>Atual: {LOCAL_VERSION}</Text>
    </View>
  );
}

// styles moved to src/styles/UpdateChecker.style.ts
