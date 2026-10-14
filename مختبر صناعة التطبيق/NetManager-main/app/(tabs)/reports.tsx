// شاشة التقارير - مع توليد PDF حقيقي
// تعمل الميزة كاملة بعد بناء APK، وقد لا تعمل في معاينة Expo Go
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Alert, Share, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { getNetworks, getAreas, getModems, Area, Network } from '@/services/database';
import { useColors, useApp } from '@/hooks/useApp';
import { translations } from '@/constants/i18n';
import { STATUS_LABELS } from '@/constants/config';
import { Spacing, FontSize, BorderRadius, Shadow } from '@/constants/theme';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

export default function ReportsScreen() {
  const colors = useColors();
  const { lang } = useApp();
  const tr = translations.reports;

  const [networks, setNetworks] = useState<Network[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [selectedNetworkId, setSelectedNetworkId] = useState<number | null>(null);
  const [selectedAreaId, setSelectedAreaId] = useState<number | null>(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [generatingText, setGeneratingText] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [n, a] = await Promise.all([getNetworks(), getAreas()]);
      setNetworks(n);
      setAreas(a);
    };
    load();
  }, []);

  const filteredAreas = selectedNetworkId
    ? areas.filter(a => a.network_id === selectedNetworkId)
    : areas;

  // ══════════════════════════════════════
  // دالة توليد تقرير PDF - expo-print
  // تعمل كاملة بعد بناء APK
  // ══════════════════════════════════════
  const generateAreaReportPDF = async (areaId: number) => {
    const area = areas.find(a => a.id === areaId);
    const network = networks.find(n => n.id === area?.network_id);
    const modems = await getModems(areaId);

    if (modems.length === 0) {
      Alert.alert(
        lang === 'ar' ? 'لا توجد بيانات' : 'No Data',
        lang === 'ar'
          ? 'لا توجد مودمات في هذه المنطقة لإصدار تقرير.'
          : 'No modems in this area to generate a report.'
      );
      return;
    }

    const reportDate = new Date().toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });

    // ── بناء صفوف الجدول ──
    const tableRows = modems.map((m, i) => {
      const status = STATUS_LABELS[m.status];
      const statusColor = status?.color || '#8F9BB3';
      const statusLabel = lang === 'ar' ? (status?.ar || m.status) : (status?.en || m.status);
      return `
        <tr style="background:${i % 2 === 0 ? '#1A2840' : '#1F3052'}">
          <td>${i + 1}</td>
          <td><strong>${m.name || '-'}</strong></td>
          <td>${m.manufacturer || '-'}</td>
          <td style="font-family:monospace">${m.ip || '-'}</td>
          <td style="font-family:monospace;font-size:11px">${m.mac || '-'}</td>
          <td>${m.vlan || '-'}</td>
          <td>${m.subscriber_name || '-'}</td>
          <td>${m.subscriber_phone || '-'}</td>
          <td><span style="background:${statusColor}22;color:${statusColor};padding:2px 8px;border-radius:10px;font-size:11px">${statusLabel}</span></td>
          <td style="font-size:11px">${m.created_at ? m.created_at.substring(0, 10) : '-'}</td>
        </tr>`;
    }).join('');

    // ── حساب الإحصائيات ──
    const activeCount = modems.filter(m => m.status === 'active').length;
    const inactiveCount = modems.filter(m => m.status === 'inactive').length;
    const maintenanceCount = modems.filter(m => m.status === 'maintenance').length;

    // ── قالب HTML ──
    const html = `
<!DOCTYPE html>
<html dir="${lang === 'ar' ? 'rtl' : 'ltr'}" lang="${lang}">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Net Manager Report</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Cairo', Arial, sans-serif; background: #0D1B2E; color: #E8EBF0; direction: ${lang === 'ar' ? 'rtl' : 'ltr'}; }
    .page { padding: 32px; max-width: 100%; }

    /* ترويسة */
    .header { background: linear-gradient(135deg, #0A2545, #1A4A7A); border-radius: 16px; padding: 24px; margin-bottom: 24px; display: flex; align-items: center; gap: 20px; }
    .header-icon { width: 60px; height: 60px; background: #00B4D820; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 28px; }
    .header-text h1 { font-size: 22px; font-weight: 900; color: #fff; }
    .header-text p  { font-size: 13px; color: #00B4D8; margin-top: 3px; }

    /* بطاقات الإحصائيات */
    .stats-row { display: flex; gap: 12px; margin-bottom: 24px; }
    .stat-card { flex: 1; background: #1A2840; border-radius: 12px; padding: 16px; text-align: center; border: 1px solid #ffffff10; }
    .stat-value { font-size: 28px; font-weight: 900; }
    .stat-label { font-size: 11px; color: #8F9BB3; margin-top: 4px; }

    /* الجدول */
    .table-wrap { border-radius: 12px; overflow: hidden; border: 1px solid #ffffff10; margin-bottom: 24px; }
    table { width: 100%; border-collapse: collapse; }
    thead tr { background: #00B4D8 !important; }
    th { padding: 10px 8px; font-size: 12px; font-weight: 700; color: #0A1628; text-align: ${lang === 'ar' ? 'right' : 'left'}; }
    td { padding: 9px 8px; font-size: 12px; border-bottom: 1px solid #ffffff08; text-align: ${lang === 'ar' ? 'right' : 'left'}; }

    /* تذييل */
    .footer { text-align: center; color: #4A5568; font-size: 11px; margin-top: 16px; }
    .footer strong { color: #8F9BB3; }
  </style>
</head>
<body>
<div class="page">

  <!-- ترويسة -->
  <div class="header">
    <div class="header-icon">📡</div>
    <div class="header-text">
      <h1>Net Manager — ${lang === 'ar' ? 'تقرير' : 'Report'}</h1>
      <p>${lang === 'ar' ? 'الشبكة:' : 'Network:'} ${network?.name || '-'} &nbsp;|&nbsp; ${lang === 'ar' ? 'المنطقة:' : 'Area:'} ${area?.name || '-'} &nbsp;|&nbsp; ${reportDate}</p>
    </div>
  </div>

  <!-- الإحصائيات -->
  <div class="stats-row">
    <div class="stat-card">
      <div class="stat-value" style="color:#00B4D8">${modems.length}</div>
      <div class="stat-label">${lang === 'ar' ? 'إجمالي المودمات' : 'Total Modems'}</div>
    </div>
    <div class="stat-card">
      <div class="stat-value" style="color:#00D68F">${activeCount}</div>
      <div class="stat-label">${lang === 'ar' ? 'يعمل' : 'Active'}</div>
    </div>
    <div class="stat-card">
      <div class="stat-value" style="color:#FF4D4D">${inactiveCount}</div>
      <div class="stat-label">${lang === 'ar' ? 'عاطل' : 'Inactive'}</div>
    </div>
    <div class="stat-card">
      <div class="stat-value" style="color:#FFB800">${maintenanceCount}</div>
      <div class="stat-label">${lang === 'ar' ? 'صيانة' : 'Maintenance'}</div>
    </div>
  </div>

  <!-- الجدول -->
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>${lang === 'ar' ? 'الاسم' : 'Name'}</th>
          <th>${lang === 'ar' ? 'الشركة' : 'Manufacturer'}</th>
          <th>IP</th>
          <th>MAC</th>
          <th>VLAN</th>
          <th>${lang === 'ar' ? 'المشترك' : 'Subscriber'}</th>
          <th>${lang === 'ar' ? 'الهاتف' : 'Phone'}</th>
          <th>${lang === 'ar' ? 'الحالة' : 'Status'}</th>
          <th>${lang === 'ar' ? 'تاريخ الإضافة' : 'Added'}</th>
        </tr>
      </thead>
      <tbody>${tableRows}</tbody>
    </table>
  </div>

  <!-- التذييل -->
  <div class="footer">
    <strong>Net Manager v1.0</strong> &nbsp;|&nbsp;
    ${lang === 'ar' ? 'تم التوليد في:' : 'Generated:'} ${reportDate} &nbsp;|&nbsp;
    ${lang === 'ar' ? 'إجمالي:' : 'Total:'} <strong>${modems.length}</strong> ${lang === 'ar' ? 'مودم' : 'modems'}
  </div>

</div>
</body>
</html>`;

    // ── تحويل HTML إلى PDF ──
    const { uri } = await Print.printToFileAsync({ html, base64: false });

    // ── نسخ الملف إلى مجلد الوثائق بإسم واضح ──
    const fileName = `NetManager_${area?.name || 'report'}_${Date.now()}.pdf`;
    const destUri = (FileSystem.documentDirectory || '') + fileName;
    await FileSystem.copyAsync({ from: uri, to: destUri });

    return destUri;
  };

  // ── معالج زر PDF ──
  const handleGeneratePDF = async () => {
    if (!selectedAreaId) {
      Alert.alert(lang === 'ar' ? 'اختر منطقة' : 'Select Area', lang === 'ar' ? 'يرجى اختيار منطقة أولاً' : 'Please select an area first');
      return;
    }
    setGeneratingPDF(true);
    try {
      const fileUri = await generateAreaReportPDF(selectedAreaId);
      if (!fileUri) { setGeneratingPDF(false); return; }

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/pdf',
          dialogTitle: lang === 'ar' ? 'مشاركة تقرير PDF' : 'Share PDF Report',
          UTI: 'com.adobe.pdf',
        });
        Alert.alert(
          lang === 'ar' ? 'تم' : 'Done',
          lang === 'ar' ? 'تم إنشاء التقرير بنجاح ✅' : 'Report generated successfully ✅'
        );
      } else {
        Alert.alert(lang === 'ar' ? 'تم الحفظ' : 'Saved', fileUri);
      }
    } catch (e) {
      console.error('[PDF Report Error]', e);
      Alert.alert(
        lang === 'ar' ? 'خطأ' : 'Error',
        lang === 'ar' ? 'تعذر إنشاء التقرير، حاول مرة أخرى.' : 'Could not generate report, please try again.'
      );
    } finally {
      setGeneratingPDF(false);
    }
  };

  // ── توليد تقرير نصي ──
  const generateTextReport = async () => {
    if (!selectedAreaId) {
      Alert.alert(lang === 'ar' ? 'اختر منطقة' : 'Select Area');
      return;
    }
    setGeneratingText(true);
    try {
      const area = areas.find(a => a.id === selectedAreaId);
      const network = networks.find(n => n.id === area?.network_id);
      const modems = await getModems(selectedAreaId);

      const header = lang === 'ar'
        ? `تقرير شبكة: ${network?.name || ''} - منطقة: ${area?.name || ''}\nتاريخ التقرير: ${new Date().toLocaleDateString('ar-SA')}\nإجمالي المودمات: ${modems.length}\n${'='.repeat(60)}\n`
        : `Network Report: ${network?.name || ''} - Area: ${area?.name || ''}\nReport Date: ${new Date().toLocaleDateString()}\nTotal Modems: ${modems.length}\n${'='.repeat(60)}\n`;

      const rows = modems.map((m, i) => {
        const status = STATUS_LABELS[m.status]?.[lang] || m.status;
        return lang === 'ar'
          ? `\n[${i + 1}] ${m.name}\n  الحالة: ${status}\n${m.ip ? `  IP: ${m.ip}\n` : ''}${m.mac ? `  MAC: ${m.mac}\n` : ''}${m.subscriber_name ? `  المشترك: ${m.subscriber_name}\n` : ''}${m.subscriber_phone ? `  الهاتف: ${m.subscriber_phone}\n` : ''}  تاريخ الإضافة: ${m.created_at?.substring(0, 10) || ''}\n`
          : `\n[${i + 1}] ${m.name}\n  Status: ${status}\n${m.ip ? `  IP: ${m.ip}\n` : ''}${m.mac ? `  MAC: ${m.mac}\n` : ''}${m.subscriber_name ? `  Subscriber: ${m.subscriber_name}\n` : ''}${m.subscriber_phone ? `  Phone: ${m.subscriber_phone}\n` : ''}  Added: ${m.created_at?.substring(0, 10) || ''}\n`;
      });

      const content = header + rows.join('\n' + '-'.repeat(40));
      const fileName = `report_${area?.name || 'area'}_${Date.now()}.txt`;
      const fileUri = FileSystem.documentDirectory + fileName;
      await FileSystem.writeAsStringAsync(fileUri, content, { encoding: FileSystem.EncodingType.UTF8 });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, { mimeType: 'text/plain', dialogTitle: lang === 'ar' ? 'مشاركة التقرير' : 'Share Report' });
      } else {
        Alert.alert(lang === 'ar' ? 'تم الحفظ' : 'Saved', fileUri);
      }
    } catch (e) {
      Alert.alert(lang === 'ar' ? 'خطأ' : 'Error', String(e));
    } finally {
      setGeneratingText(false);
    }
  };

  // ── توليد QR ──
  const generateQRData = async () => {
    if (!selectedAreaId) { Alert.alert(lang === 'ar' ? 'اختر منطقة' : 'Select Area'); return; }
    const modems = await getModems(selectedAreaId);
    if (modems.length === 0) { Alert.alert(lang === 'ar' ? 'لا توجد مودمات' : 'No modems'); return; }
    const area = areas.find(a => a.id === selectedAreaId);
    const data = modems.map(m => `${m.name}|${m.ip || ''}|${m.mac || ''}|${m.ssid || ''}`).join('\n');
    await Share.share({ message: `Net Manager - ${area?.name}\n${data}`, title: 'QR Data' });
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.header, borderBottomColor: colors.cardBorder }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{tr.title[lang]}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* اختيار الشبكة */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{tr.selectNetwork[lang]}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row', gap: 8, paddingBottom: 4 }}>
          {[{ id: null, name: lang === 'ar' ? 'الكل' : 'All' }, ...networks].map(n => (
            <Pressable
              key={String(n.id)}
              style={[styles.chip, {
                borderColor: selectedNetworkId === n.id ? colors.primary : colors.cardBorder,
                backgroundColor: selectedNetworkId === n.id ? colors.primary + '20' : colors.card,
              }]}
              onPress={() => { setSelectedNetworkId(n.id as any); setSelectedAreaId(null); }}
            >
              <Text style={[styles.chipText, { color: selectedNetworkId === n.id ? colors.primary : colors.textSecondary }]}>{n.name}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* اختيار المنطقة */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{tr.selectArea[lang]}</Text>
        <View style={styles.areaGrid}>
          {filteredAreas.map(a => (
            <Pressable
              key={a.id}
              style={[styles.areaCard, {
                backgroundColor: selectedAreaId === a.id ? colors.primary : colors.card,
                borderColor: selectedAreaId === a.id ? colors.primary : colors.cardBorder,
              }]}
              onPress={() => setSelectedAreaId(a.id)}
            >
              <MaterialIcons name="location-on" size={20} color={selectedAreaId === a.id ? '#fff' : colors.accent} />
              <Text style={[styles.areaText, { color: selectedAreaId === a.id ? '#fff' : colors.text }]} numberOfLines={1}>{a.name}</Text>
              <Text style={[styles.areaSub, { color: selectedAreaId === a.id ? '#ffffff90' : colors.textSecondary }]}>
                {a.modem_count || 0} {lang === 'ar' ? 'مودم' : 'modems'}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* ── أزرار التقارير ── */}
        <View style={styles.actions}>

          {/* زر PDF */}
          <Pressable
            style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }, !selectedAreaId && { opacity: 0.5 }]}
            onPress={handleGeneratePDF}
            disabled={!selectedAreaId || generatingPDF}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#FF4D4D20' }]}>
              {generatingPDF
                ? <ActivityIndicator color="#FF4D4D" size={24} />
                : <MaterialIcons name="picture-as-pdf" size={30} color="#FF4D4D" />}
            </View>
            <Text style={[styles.actionTitle, { color: colors.text }]}>
              {lang === 'ar' ? 'تقرير PDF' : 'PDF Report'}
            </Text>
            <Text style={[styles.actionDesc, { color: colors.textSecondary }]}>
              {lang === 'ar' ? 'جدول منسق يدعم RTL مع إحصائيات' : 'Formatted RTL table with statistics'}
            </Text>
            {generatingPDF
              ? <Text style={[styles.noteText, { color: colors.primary }]}>{lang === 'ar' ? 'جاري التوليد...' : 'Generating...'}</Text>
              : null}
          </Pressable>

          {/* زر نصي */}
          <Pressable
            style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }, !selectedAreaId && { opacity: 0.5 }]}
            onPress={generateTextReport}
            disabled={!selectedAreaId || generatingText}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.primary + '20' }]}>
              {generatingText
                ? <ActivityIndicator color={colors.primary} size={24} />
                : <MaterialIcons name="description" size={28} color={colors.primary} />}
            </View>
            <Text style={[styles.actionTitle, { color: colors.text }]}>{lang === 'ar' ? 'تقرير نصي' : 'Text Report'}</Text>
            <Text style={[styles.actionDesc, { color: colors.textSecondary }]}>
              {lang === 'ar' ? 'توليد ومشاركة تقرير نصي كامل' : 'Generate & share full text report'}
            </Text>
          </Pressable>

          {/* زر QR */}
          <Pressable
            style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }, !selectedAreaId && { opacity: 0.5 }]}
            onPress={generateQRData}
            disabled={!selectedAreaId}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.accent + '20' }]}>
              <MaterialIcons name="qr-code" size={28} color={colors.accent} />
            </View>
            <Text style={[styles.actionTitle, { color: colors.text }]}>{lang === 'ar' ? 'بيانات QR' : 'QR Data'}</Text>
            <Text style={[styles.actionDesc, { color: colors.textSecondary }]}>
              {lang === 'ar' ? 'مشاركة بيانات المودمات للمنطقة' : 'Share modem data for area'}
            </Text>
          </Pressable>
        </View>

        {/* تلميح */}
        {!selectedAreaId ? (
          <View style={[styles.hint, { backgroundColor: colors.surfaceVariant, borderColor: colors.cardBorder }]}>
            <MaterialIcons name="info-outline" size={20} color={colors.primary} />
            <Text style={[styles.hintText, { color: colors.textSecondary }]}>
              {lang === 'ar' ? 'اختر منطقة لتوليد التقرير' : 'Select an area to generate report'}
            </Text>
          </View>
        ) : null}

        {/* ملاحظة PDF */}
        <View style={[styles.pdfNote, { backgroundColor: colors.surfaceVariant, borderColor: colors.cardBorder }]}>
          <MaterialIcons name="info" size={14} color={colors.textSecondary} />
          <Text style={[styles.noteText, { color: colors.textSecondary }]}>
            {lang === 'ar'
              ? 'ميزة PDF تعمل كاملة بعد بناء APK، وقد لا تعمل في معاينة Expo Go'
              : 'PDF feature works fully after APK build, may not work in Expo Go preview'}
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { padding: Spacing.md, borderBottomWidth: 1 },
  headerTitle: { fontSize: FontSize.xl, fontWeight: '700' },
  content: { padding: Spacing.md, gap: Spacing.md },
  sectionLabel: { fontSize: FontSize.sm, fontWeight: '600', marginBottom: -4 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: FontSize.sm, fontWeight: '500' },
  areaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  areaCard: { width: '47%', padding: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1, alignItems: 'center', gap: 4, ...Shadow.sm },
  areaText: { fontSize: FontSize.md, fontWeight: '600', textAlign: 'center' },
  areaSub: { fontSize: FontSize.xs },
  actions: { gap: Spacing.md },
  actionCard: { padding: Spacing.lg, borderRadius: BorderRadius.lg, borderWidth: 1, gap: Spacing.sm, alignItems: 'center', ...Shadow.sm },
  actionIcon: { width: 60, height: 60, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  actionTitle: { fontSize: FontSize.lg, fontWeight: '700' },
  actionDesc: { fontSize: FontSize.sm, textAlign: 'center' },
  hint: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1, gap: Spacing.sm },
  hintText: { flex: 1, fontSize: FontSize.sm },
  pdfNote: { flexDirection: 'row', alignItems: 'flex-start', padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1, gap: 6 },
  noteText: { flex: 1, fontSize: FontSize.xs, lineHeight: 18 },
});
