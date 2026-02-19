import React from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../contexts/ThemeContext';

type IconLib = 'Ionicons' | 'MaterialIcons';

interface ThemedIconProps {
  lib?: IconLib;
  name: string;
  size?: number;
  color?: string;
  colorKey?: string;
  style?: any;
}

const ThemedIcon: React.FC<ThemedIconProps> = ({ lib = 'Ionicons', name, size = 24, color, colorKey, style, ...rest }) => {
  const { theme } = useTheme();
  const resolvedColor = color || (colorKey ? (theme as any)[colorKey] : theme.text);
  const IconComp = lib === 'MaterialIcons' ? MaterialIcons : Ionicons;
  return <IconComp name={name} size={size} color={resolvedColor} style={style} {...rest} />;
};

export default ThemedIcon;
