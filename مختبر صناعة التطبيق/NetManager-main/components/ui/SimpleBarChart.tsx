// رسم بياني شريطي بسيط
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useColors } from '@/hooks/useApp';
import { BorderRadius, Spacing, FontSize } from '@/constants/theme';

interface BarData { name: string; count: number; }

interface SimpleBarChartProps {
  data: BarData[];
  color?: string;
  title?: string;
}

export function SimpleBarChart({ data, color, title }: SimpleBarChartProps) {
  const colors = useColors();
  const maxVal = Math.max(...data.map(d => d.count), 1);
  const barColor = color || colors.primary;

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      {title && <Text style={[styles.title, { color: colors.text }]}>{title}</Text>}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.chartArea}>
          {data.map((item, i) => {
            const heightPct = (item.count / maxVal) * 120;
            return (
              <View key={i} style={styles.barGroup}>
                <Text style={[styles.value, { color: colors.text }]}>{item.count}</Text>
                <View style={[styles.bar, { height: Math.max(8, heightPct), backgroundColor: barColor, opacity: 0.7 + (i % 3) * 0.1 }]} />
                <Text style={[styles.label, { color: colors.textSecondary }]} numberOfLines={2}>{item.name}</Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: BorderRadius.lg, padding: Spacing.md, borderWidth: 1, marginVertical: Spacing.xs },
  title: { fontSize: FontSize.md, fontWeight: '600', marginBottom: Spacing.sm },
  chartArea: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm, paddingBottom: 4, minHeight: 160 },
  barGroup: { alignItems: 'center', width: 60, gap: 4 },
  bar: { width: 36, borderRadius: 6 },
  value: { fontSize: 11, fontWeight: '700' },
  label: { fontSize: 10, textAlign: 'center' },
});
