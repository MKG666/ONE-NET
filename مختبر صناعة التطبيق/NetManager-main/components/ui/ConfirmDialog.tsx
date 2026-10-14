// نافذة تأكيد الحذف
import React from 'react';
import { View, Text, Modal, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useApp';
import { useApp } from '@/hooks/useApp';
import { translations } from '@/constants/i18n';
import { BorderRadius, Spacing, FontSize } from '@/constants/theme';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}

export function ConfirmDialog({ visible, title, message, onConfirm, onCancel, danger = true }: ConfirmDialogProps) {
  const colors = useColors();
  const { lang } = useApp();
  const tr = translations.common;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={[styles.dialog, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <View style={[styles.iconWrap, { backgroundColor: (danger ? colors.error : colors.warning) + '20' }]}>
            <MaterialIcons name={danger ? 'delete-forever' : 'warning'} size={32} color={danger ? colors.error : colors.warning} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          {message ? <Text style={[styles.msg, { color: colors.textSecondary }]}>{message}</Text> : null}
          <View style={styles.buttons}>
            <Pressable style={[styles.btn, { backgroundColor: colors.surfaceVariant }]} onPress={onCancel}>
              <Text style={[styles.btnText, { color: colors.text }]}>{tr.cancel[lang]}</Text>
            </Pressable>
            <Pressable style={[styles.btn, { backgroundColor: danger ? colors.error : colors.warning }]} onPress={onConfirm}>
              <Text style={[styles.btnText, { color: '#fff' }]}>{tr.confirm[lang]}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  dialog: { width: '100%', maxWidth: 380, borderRadius: BorderRadius.xl, padding: Spacing.xl, borderWidth: 1, gap: Spacing.md, alignItems: 'center' },
  iconWrap: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: FontSize.lg, fontWeight: '700', textAlign: 'center' },
  msg: { fontSize: FontSize.md, textAlign: 'center', lineHeight: 22 },
  buttons: { flexDirection: 'row', gap: Spacing.sm, width: '100%' },
  btn: { flex: 1, paddingVertical: Spacing.md, borderRadius: BorderRadius.md, alignItems: 'center' },
  btnText: { fontSize: FontSize.md, fontWeight: '600' },
});
