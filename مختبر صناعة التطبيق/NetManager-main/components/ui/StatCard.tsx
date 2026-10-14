// بطاقة إحصائية للوحة التحكم
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useApp';
import { BorderRadius, Spacing, FontSize, Shadow } from '@/constants/theme';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
  onPress?: () => void;
}

export function StatCard({ title, value, icon, color, onPress }: StatCardProps) {
  const colors = useColors();
  return (
    <Pressable
      style={({ pressed }) => [styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder, opacity: pressed ? 0.85 : 1 }]}
      onPress={onPress}
    >
      <View style={[styles.iconBox, { backgroundColor: color + '25' }]}>
        <MaterialIcons name={icon} size={26} color={color} />
      </View>
      <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.title, { color: colors.textSecondary }]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 140,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    gap: Spacing.xs,
    ...Shadow.sm,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  value: { fontSize: FontSize.xxxl, fontWeight: '700' },
  title: { fontSize: FontSize.sm, textAlign: 'center', fontWeight: '500' },
});
