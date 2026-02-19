// Sistema de cores e tema
export const colors = {
  // Cores principais
  primary: '#3B82F6', // Azul mais moderno e vibrante
  primaryDark: '#2563EB',
  primaryLight: '#60A5FA',
  
  // Tema claro
  light: {
    background: '#F8FAFC', // Cinza azulado bem claroJ
    surface: '#FFFFFF',
    surfaceVariant: '#F1F5F9',
    text: '#0F172A', // Praticamente preto com tom azulado
    textSecondary: '#475569',
    textTertiary: '#94A3B8',
    border: '#E2E8F0',
    borderLight: '#F1F5F9',
    shadow: '#000',
    overlay: 'rgba(15, 23, 42, 0.4)',
    ripple: 'rgba(59, 130, 246, 0.12)',
    
    // Estados
    primary: '#3B82F6',
    success: '#10B981', // Verde moderno
    error: '#EF4444', // Vermelho vibrante
    warning: '#F59E0B', // Laranja âmbar
    disabled: '#F1F5F9',
    disabledText: '#94A3B8',
    // Cor para usar em cima de elementos `primary`
    onPrimary: '#FFFFFF',
  },
  
  // Tema escuro
  dark: {
    background: '#0F172A', // Azul escuro profundo
    surface: '#1E293B',
    surfaceVariant: '#334155',
    text: '#F1F5F9',
    textSecondary: '#CBD5E1',
    textTertiary: '#64748B',
    border: '#334155',
    borderLight: '#475569',
    shadow: '#000',
    overlay: 'rgba(0, 0, 0, 0.75)',
    ripple: 'rgba(96, 165, 250, 0.18)',
    
    // Estados
    primary: '#60A5FA',
    success: '#34D399',
    error: '#F87171',
    warning: '#FBBF24',
    disabled: '#334155',
    disabledText: '#64748B',
    // Cor para usar em cima de elementos `primary`
    onPrimary: '#FFFFFF',
  },
};

// Espaçamentos
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

// Tamanhos de fonte
export const fontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  base: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
};

// Border radius
export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  round: 28,
};

// Sombras
export const shadows = {
  small: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  medium: {
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  large: {
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
  },
};

// Tipo Theme para usar nas factories de estilo
export type Theme = typeof colors.light;
