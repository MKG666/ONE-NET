// مكون النص مع دعم الثيم واللغة
import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { useColors } from '@/hooks/useApp';
import { useApp } from '@/hooks/useApp';
import { FontSize, FontWeight } from '@/constants/theme';

interface ThemedTextProps extends TextProps {
  variant?: 'title' | 'subtitle' | 'body' | 'caption' | 'label';
  color?: string;
  bold?: boolean;
}

export function ThemedText({ variant = 'body', color, bold, style, ...props }: ThemedTextProps) {
  const colors = useColors();
  const { lang } = useApp();
  const isRTL = lang === 'ar';

  const variantStyle = styles[variant] || styles.body;
  const textColor = color || colors.text;

  return (
    <Text
      style={[
        variantStyle,
        { color: textColor },
        bold && { fontWeight: FontWeight.bold },
        isRTL && { textAlign: 'right', writingDirection: 'rtl' },
        style,
      ]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, lineHeight: 32 },
  subtitle: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, lineHeight: 26 },
  body: { fontSize: FontSize.md, fontWeight: FontWeight.regular, lineHeight: 24 },
  caption: { fontSize: FontSize.sm, fontWeight: FontWeight.regular, lineHeight: 20 },
  label: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, lineHeight: 20 },
});
