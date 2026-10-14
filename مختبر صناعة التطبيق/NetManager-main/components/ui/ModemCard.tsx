// بطاقة عرض المودم
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Modem } from '@/services/database';
import { StatusBadge } from './StatusBadge';
import { useColors } from '@/hooks/useApp';
import { useApp } from '@/hooks/useApp';
import { BorderRadius, Spacing, FontSize, Shadow } from '@/constants/theme';

interface ModemCardProps {
  modem: Modem;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const ModemCard = React.memo(function ModemCard({ modem, onPress, onEdit, onDelete }: ModemCardProps) {
  const colors = useColors();
  const { lang } = useApp();

  return (
    <Pressable
      style={({ pressed }) => [styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder, opacity: pressed ? 0.9 : 1 }]}
      onPress={onPress}
    >
      {/* الرأس */}
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <MaterialIcons name="router" size={22} color={colors.primary} />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{modem.name}</Text>
          <Text style={[styles.sub, { color: colors.textSecondary }]} numberOfLines={1}>
            {modem.area_name} {modem.network_name ? `• ${modem.network_name}` : ''}
          </Text>
        </View>
        <StatusBadge status={modem.status} small />
      </View>

      {/* تفاصيل */}
      <View style={styles.details}>
        {modem.ip ? (
          <View style={styles.detail}>
            <MaterialIcons name="computer" size={13} color={colors.textSecondary} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>{modem.ip}</Text>
          </View>
        ) : null}
        {modem.mac ? (
          <View style={styles.detail}>
            <MaterialIcons name="memory" size={13} color={colors.textSecondary} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>{modem.mac}</Text>
          </View>
        ) : null}
        {modem.subscriber_name ? (
          <View style={styles.detail}>
            <MaterialIcons name="person" size={13} color={colors.textSecondary} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>{modem.subscriber_name}</Text>
          </View>
        ) : null}
        {modem.subscriber_phone ? (
          <View style={styles.detail}>
            <MaterialIcons name="phone" size={13} color={colors.textSecondary} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>{modem.subscriber_phone}</Text>
          </View>
        ) : null}
      </View>

      {/* أزرار */}
      <View style={styles.actions}>
        {modem.manufacturer ? (
          <View style={[styles.tag, { backgroundColor: colors.primary + '20' }]}>
            <Text style={[styles.tagText, { color: colors.primary }]}>{modem.manufacturer}</Text>
          </View>
        ) : null}
        <View style={styles.spacer} />
        <Pressable hitSlop={8} onPress={onEdit} style={styles.actionBtn}>
          <MaterialIcons name="edit" size={18} color={colors.primary} />
        </Pressable>
        <Pressable hitSlop={8} onPress={onDelete} style={styles.actionBtn}>
          <MaterialIcons name="delete-outline" size={18} color={colors.error} />
        </Pressable>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadow.sm,
    gap: Spacing.sm,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  iconWrap: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: '#00B4D815',
    alignItems: 'center', justifyContent: 'center',
  },
  headerText: { flex: 1 },
  name: { fontSize: FontSize.md, fontWeight: '600' },
  sub: { fontSize: FontSize.sm, marginTop: 1 },
  details: { gap: 4 },
  detail: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  detailText: { fontSize: FontSize.sm, flex: 1 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: 2 },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  tagText: { fontSize: 11, fontWeight: '600' },
  spacer: { flex: 1 },
  actionBtn: { padding: 6 },
});
