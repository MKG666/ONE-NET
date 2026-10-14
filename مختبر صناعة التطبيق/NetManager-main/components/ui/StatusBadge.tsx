// شارة حالة المودم
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { STATUS_LABELS } from '@/constants/config';
import { useApp } from '@/hooks/useApp';
import { FontSize, BorderRadius, Spacing } from '@/constants/theme';

interface StatusBadgeProps {
  status: string;
  small?: boolean;
}

export function StatusBadge({ status, small }: StatusBadgeProps) {
  const { lang } = useApp();
  const info = STATUS_LABELS[status] || STATUS_LABELS.disconnected;
  const label = lang === 'ar' ? info.ar : info.en;

  return (
    <View style={[styles.badge, { backgroundColor: info.color + '20', borderColor: info.color }, small && styles.small]}>
      <View style={[styles.dot, { backgroundColor: info.color }]} />
      <Text style={[styles.text, { color: info.color }, small && styles.smallText]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    gap: 4,
  },
  small: { paddingHorizontal: 6, paddingVertical: 2 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: FontSize.sm, fontWeight: '600' },
  smallText: { fontSize: 10 },
});
