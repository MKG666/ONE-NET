// هوك الوصول لسياق التطبيق
import { useContext } from 'react';
import { AppContext } from '@/contexts/AppContext';
import { Colors } from '@/constants/theme';

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}

// هوك الألوان حسب الثيم
export function useColors() {
  const { colorScheme } = useApp();
  const isDark = colorScheme === 'dark';
  return {
    isDark,
    bg: isDark ? Colors.dark.background : Colors.light.background,
    surface: isDark ? Colors.dark.surface : Colors.light.surface,
    surfaceVariant: isDark ? Colors.dark.surfaceVariant : Colors.light.surfaceVariant,
    card: isDark ? Colors.dark.card : Colors.light.card,
    cardBorder: isDark ? Colors.dark.cardBorder : Colors.light.cardBorder,
    header: isDark ? Colors.dark.header : Colors.light.header,
    text: isDark ? Colors.text.primary : Colors.text.dark,
    textSecondary: isDark ? Colors.text.secondary : Colors.text.darkSecondary,
    primary: Colors.primary,
    accent: Colors.accent,
    ...Colors.status,
    error: Colors.error,
    warning: Colors.warning,
    success: Colors.success,
  };
}
