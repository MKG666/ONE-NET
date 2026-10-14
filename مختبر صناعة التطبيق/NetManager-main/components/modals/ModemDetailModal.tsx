// نافذة تفاصيل المودم الكاملة
import React, { useState } from 'react';
import { View, Modal, StyleSheet, ScrollView, Text, Pressable, Share, Clipboard } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Modem } from '@/services/database';
import { StatusBadge } from '../ui/StatusBadge';
import { useColors } from '@/hooks/useApp';
import { useApp } from '@/hooks/useApp';
import { translations } from '@/constants/i18n';
import { BorderRadius, Spacing, FontSize } from '@/constants/theme';

interface ModemDetailModalProps {
  visible: boolean;
  modem: Modem | null;
  onClose: () => void;
  onEdit: () => void;
}

export function ModemDetailModal({ visible, modem, onClose, onEdit }: ModemDetailModalProps) {
  const colors = useColors();
  const { lang } = useApp();
  const [showPass, setShowPass] = useState(false);
  const [showWifiPass, setShowWifiPass] = useState(false);
  if (!modem) return null;
  const tr = translations.modem;

  const copyToClipboard = (text: string) => {
    Clipboard.setString(text);
  };

  const shareModem = async () => {
    const info = [
      `📡 ${modem.name}`,
      modem.mesh_id ? `Mesh ID: ${modem.mesh_id}` : '',
      modem.ip ? `IP: ${modem.ip}` : '',
      modem.mac ? `MAC: ${modem.mac}` : '',
      modem.ssid ? `SSID: ${modem.ssid}` : '',
      modem.subscriber_name ? `${lang === 'ar' ? 'المشترك' : 'Subscriber'}: ${modem.subscriber_name}` : '',
      modem.subscriber_phone ? `${lang === 'ar' ? 'الهاتف' : 'Phone'}: ${modem.subscriber_phone}` : '',
      modem.area_name ? `${lang === 'ar' ? 'المنطقة' : 'Area'}: ${modem.area_name}` : '',
    ].filter(Boolean).join('\n');
    await Share.share({ message: info, title: modem.name });
  };

  const renderRow = (label: string, value: string | number | undefined, copyable = false, isPass = false, passState?: boolean, togglePass?: () => void) => {
    if (!value && value !== 0) return null;
    const displayVal = isPass && !passState ? '••••••••' : String(value);
    return (
      <View style={[styles.row, { borderBottomColor: colors.cardBorder }]}>
        <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>{label}</Text>
        <View style={styles.rowValue}>
          <Text style={[styles.rowText, { color: colors.text }]} selectable>{displayVal}</Text>
          {isPass && togglePass ? (
            <Pressable onPress={togglePass} hitSlop={8}>
              <MaterialIcons name={passState ? 'visibility-off' : 'visibility'} size={16} color={colors.textSecondary} />
            </Pressable>
          ) : null}
          {copyable && !isPass ? (
            <Pressable onPress={() => copyToClipboard(String(value))} hitSlop={8}>
              <MaterialIcons name="content-copy" size={14} color={colors.textSecondary} />
            </Pressable>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        {/* الرأس */}
        <View style={[styles.header, { backgroundColor: colors.header, borderBottomColor: colors.cardBorder }]}>
          <Pressable onPress={onClose} hitSlop={8}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>{modem.name}</Text>
          <View style={styles.headerActions}>
            <Pressable onPress={shareModem} hitSlop={8} style={styles.headerBtn}>
              <MaterialIcons name="share" size={22} color={colors.primary} />
            </Pressable>
            <Pressable onPress={onEdit} hitSlop={8} style={styles.headerBtn}>
              <MaterialIcons name="edit" size={22} color={colors.primary} />
            </Pressable>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* الرأس */}
          <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={[styles.heroIcon, { backgroundColor: colors.primary + '20' }]}>
              <MaterialIcons name="router" size={40} color={colors.primary} />
            </View>
            <StatusBadge status={modem.status} />
            {modem.manufacturer ? <Text style={[styles.mfr, { color: colors.textSecondary }]}>{modem.manufacturer}</Text> : null}
          </View>

          {/* المعلومات */}
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>{lang === 'ar' ? 'المعلومات الأساسية' : 'Basic Info'}</Text>
            {renderRow(tr.meshId[lang], modem.mesh_id, true)}
            {renderRow(lang === 'ar' ? 'المنطقة' : 'Area', modem.area_name)}
            {renderRow(lang === 'ar' ? 'الشبكة' : 'Network', modem.network_name)}
            {renderRow(tr.ip[lang], modem.ip, true)}
            {renderRow(tr.mac[lang], modem.mac, true)}
            {renderRow('VLAN', modem.vlan)}
          </View>

          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>{lang === 'ar' ? 'لوحة الإدارة' : 'Admin Panel'}</Text>
            {renderRow(tr.adminUser[lang], modem.admin_user, true)}
            {renderRow(tr.adminPass[lang], modem.admin_pass, false, true, showPass, () => setShowPass(p => !p))}
          </View>

          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>{lang === 'ar' ? 'الواي فاي' : 'WiFi'}</Text>
            {renderRow('SSID', modem.ssid, true)}
            {renderRow(tr.wifiPass[lang], modem.wifi_pass, false, true, showWifiPass, () => setShowWifiPass(p => !p))}
          </View>

          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>{lang === 'ar' ? 'المشترك' : 'Subscriber'}</Text>
            {renderRow(tr.subscriber[lang], modem.subscriber_name)}
            {renderRow(tr.phone[lang], modem.subscriber_phone, true)}
          </View>

          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>{lang === 'ar' ? 'إضافي' : 'Additional'}</Text>
            {renderRow(tr.serial[lang], modem.serial, true)}
            {renderRow(tr.installDate[lang], modem.install_date)}
            {renderRow(tr.addedAt[lang], modem.created_at?.substring(0, 16))}
            {renderRow(tr.updatedAt[lang], modem.updated_at?.substring(0, 16))}
            {modem.notes ? (
              <View style={styles.notesRow}>
                <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>{tr.notes[lang]}</Text>
                <Text style={[styles.notesText, { color: colors.text }]}>{modem.notes}</Text>
              </View>
            ) : null}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, paddingTop: Spacing.xl + 8, borderBottomWidth: 1, gap: Spacing.sm },
  headerTitle: { flex: 1, fontSize: FontSize.lg, fontWeight: '700' },
  headerActions: { flexDirection: 'row', gap: 4 },
  headerBtn: { padding: 6 },
  content: { padding: Spacing.md, gap: Spacing.sm },
  heroCard: { borderRadius: BorderRadius.lg, padding: Spacing.xl, alignItems: 'center', borderWidth: 1, gap: Spacing.sm },
  heroIcon: { width: 80, height: 80, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  mfr: { fontSize: FontSize.sm, fontWeight: '500' },
  section: { borderRadius: BorderRadius.lg, padding: Spacing.md, borderWidth: 1 },
  sectionTitle: { fontSize: FontSize.sm, fontWeight: '700', letterSpacing: 0.5, marginBottom: Spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, gap: 8 },
  rowLabel: { flex: 0.9, fontSize: FontSize.sm },
  rowValue: { flex: 1.1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowText: { flex: 1, fontSize: FontSize.sm, fontWeight: '500' },
  notesRow: { paddingTop: 8, gap: 4 },
  notesText: { fontSize: FontSize.sm, lineHeight: 22 },
});
