import { StyleSheet } from 'react-native';

// Ripple colors to be used for Android `android_ripple` depending on theme
export const fabRippleColors = {
  dark: 'rgba(255,255,255,0.18)',
  light: 'rgba(0,0,0,0.12)',
};

export const stylesHome = StyleSheet.create({
  geral: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 10,
    backgroundColor: 'white',
  },

  // FAB (floating action button)
  fabContainer: {
    position: 'absolute',
    right: 20,
    bottom: 28,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1a73e8',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6, // Android shadow on wrapper
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    zIndex: 10,
    overflow: 'visible', // não cortar a sombra
  },

  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent', // pressable transparente, cor vem do wrapper
  },

  fabText: {
    color: '#fff',
    fontSize: 28,
    lineHeight: 30,
    fontWeight: '600',
  },

  fabTest: {
    position: 'absolute',
    left: 20,
    bottom: 28,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f1f3f4',
    borderRadius: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    zIndex: 12,
  },

  fabTestText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '600',
  },
});
