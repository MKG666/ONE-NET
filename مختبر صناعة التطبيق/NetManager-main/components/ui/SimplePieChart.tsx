// رسم بياني دائري بسيط
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColors } from '@/hooks/useApp';
import { BorderRadius, Spacing, FontSize } from '@/constants/theme';

const PIE_COLORS = ['#00B4D8','#00F5D4','#FFB800','#FF4D4D','#8F9BB3','#7B61FF','#FF6B35','#4CAF50'];

interface PieData { name: string; count: number; }

interface SimplePieChartProps {
  data: PieData[];
  title?: string;
}

export function SimplePieChart({ data, title }: SimplePieChartProps) {
  const colors = useColors();
  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      {title && <Text style={[styles.title, { color: colors.text }]}>{title}</Text>}
      <View style={styles.legend}>
        {data.map((item, i) => (
          <View key={i} style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }]} />
            <Text style={[styles.label, { color: colors.textSecondary }]} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={[styles.pct, { color: colors.text }]}>
              {total > 0 ? Math.round((item.count / total) * 100) : 0}%
            </Text>
            <Text style={[styles.count, { color: colors.primary }]}>{item.count}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: BorderRadius.lg, padding: Spacing.md, borderWidth: 1, marginVertical: Spacing.xs },
  title: { fontSize: FontSize.md, fontWeight: '600', marginBottom: Spacing.sm },
  legend: { gap: Spacing.xs },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  dot: { width: 12, height: 12, borderRadius: 6 },
  label: { flex: 1, fontSize: FontSize.sm },
  pct: { fontSize: FontSize.sm, fontWeight: '600', width: 40, textAlign: 'right' },
  count: { fontSize: FontSize.sm, fontWeight: '700', width: 30, textAlign: 'right' },
});
