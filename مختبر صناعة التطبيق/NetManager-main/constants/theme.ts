// ثوابت التصميم - ألوان وخطوط ومسافات
export const Colors = {
  // الألوان الرئيسية
  primary: '#00B4D8',
  primaryDark: '#0077A8',
  primaryLight: '#90E0EF',
  accent: '#00F5D4',
  
  // الخلفيات - الوضع الداكن
  dark: {
    background: '#0A1628',
    surface: '#0F2040',
    surfaceVariant: '#162952',
    card: '#1A3060',
    cardBorder: '#1E3A70',
    header: '#0D1F3C',
  },
  
  // الخلفيات - الوضع الفاتح
  light: {
    background: '#F0F4FF',
    surface: '#FFFFFF',
    surfaceVariant: '#E8EFFF',
    card: '#FFFFFF',
    cardBorder: '#D0DCFF',
    header: '#1A3060',
  },
  
  // الحالات
  status: {
    active: '#00D68F',
    inactive: '#FF4D4D',
    maintenance: '#FFB800',
    disconnected: '#8F9BB3',
  },
  
  // النصوص
  text: {
    primary: '#FFFFFF',
    secondary: '#8F9BB3',
    muted: '#4A5568',
    dark: '#1A2332',
    darkSecondary: '#4A5568',
  },
  
  // التحذيرات
  warning: '#FFB800',
  error: '#FF4D4D',
  success: '#00D68F',
  info: '#00B4D8',
  
  // متفرقات
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  overlay: 'rgba(0,0,0,0.6)',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 30,
};

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  lg: {
    shadowColor: '#00B4D8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
};
