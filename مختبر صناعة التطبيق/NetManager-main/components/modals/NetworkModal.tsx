// نافذة إضافة/تعديل شبكة
import React, { useState, useEffect } from 'react';
import { View, Modal, StyleSheet, ScrollView, Text, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { InputField } from '../ui/InputField';
import { useColors } from '@/hooks/useApp';
import { useApp } from '@/hooks/useApp';
import { translations } from '@/constants/i18n';
import { Network } from '@/services/database';
import { BorderRadius, Spacing, FontSize } from '@/constants/theme';

interface NetworkModalProps {
  visible: boolean;
  network?: Network | null;
  onSave: (name: string, description?: string) => Promise<void>;
  onClose: () => void;
}

export function NetworkModal({ visible, network, onSave, onClose }: NetworkModalProps) {
  const colors = useColors();
  const { lang } = useApp();
  const tr = translations;
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (network) { setName(network.name); setDesc(network.description || ''); }
    else { setName(''); setDesc(''); }
    setError('');
  }, [network, visible]);

  const handleSave = async () => {
    if (!name.trim()) { setError(lang === 'ar' ? 'الاسم مطلوب' : 'Name is required'); return; }
    setSaving(true);
    try { await onSave(name.trim(), desc.trim() || undefined); onClose(); }
    catch (e) { setError(lang === 'ar' ? 'حدث خطأ' : 'An error occurred'); }
    finally { setSaving(false); }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          {/* الرأس */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              {network ? tr.common.edit[lang] : tr.network.addNetwork[lang]}
            </Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <MaterialIcons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          <InputField
            label={tr.network.networkName[lang]}
            value={name} onChangeText={setName}
            placeholder={lang === 'ar' ? 'اسم الشبكة' : 'Network name'}
            error={error} autoFocus
          />
          <InputField
            label={`${tr.network.description[lang]} (${tr.common.optional[lang]})`}
            value={desc} onChangeText={setDesc}
            placeholder={lang === 'ar' ? 'وصف اختياري' : 'Optional description'}
            multiline numberOfLines={3}
          />

          <View style={styles.buttons}>
            <Pressable style={[styles.btn, { backgroundColor: colors.surfaceVariant }]} onPress={onClose}>
              <Text style={[styles.btnText, { color: colors.text }]}>{tr.common.cancel[lang]}</Text>
            </Pressable>
            <Pressable style={[styles.btn, { backgroundColor: colors.primary }, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
              <Text style={[styles.btnText, { color: '#fff' }]}>{saving ? tr.common.loading[lang] : tr.common.save[lang]}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.xl, borderWidth: 1, borderBottomWidth: 0, gap: Spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.xs },
  title: { fontSize: FontSize.xl, fontWeight: '700' },
  buttons: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  btn: { flex: 1, paddingVertical: Spacing.md, borderRadius: BorderRadius.md, alignItems: 'center' },
  btnText: { fontSize: FontSize.md, fontWeight: '600' },
});
