// مكون العرض مع دعم الثيم
import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { useColors } from '@/hooks/useApp';

interface ThemedViewProps extends ViewProps {
  variant?: 'default' | 'surface' | 'card';
}

export function ThemedView({ variant = 'default', style, ...props }: ThemedViewProps) {
  const colors = useColors();
  const bg = variant === 'card' ? colors.card : variant === 'surface' ? colors.surface : colors.bg;
  return <View style={[{ backgroundColor: bg }, style]} {...props} />;
}
