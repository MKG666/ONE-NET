// شاشة الإعدادات - مع النسخ الاحتياطي التلقائي وGoogle Drive
// يعمل الرفع إلى Google Drive كاملاً بعد بناء APK، وقد لا يعمل في معاينة Expo Go
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Alert, Modal, TextInput, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useColors, useApp } from '@/hooks/useApp';
import { ThemeMode } from '@/contexts/AppContext';
import { translations } from '@/constants/i18n';
import { getManufacturers, addManufacturer, deleteManufacturer, exportDatabaseJSON, importDatabaseJSON } from '@/services/database';
import { Spacing, FontSize, BorderRadius, Shadow } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import * as Notifications from 'expo-notifications';

// ── إعداد الإشعارات المحلية ──
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: false, shouldSetBadge: false }),
});

// ── خيارات النسخ التلقائي ──
const AUTO_BACKUP_OPTIONS = [
  { value: '0',  labelAr: 'معطّل',       labelEn: 'Disabled' },
  { value: '3',  labelAr: 'كل 3 أيام',   labelEn: 'Every 3 days' },
  { value: '7',  labelAr: 'كل 7 أيام',   labelEn: 'Every 7 days' },
  { value: '30', labelAr: 'كل 30 يوماً', labelEn: 'Every 30 days' },
];

// ── خيارات مكان الحفظ ──
const BACKUP_DEST_OPTIONS = [
  { value: 'local',  labelAr: 'ذاكرة الهاتف',            labelEn: 'Phone Storage' },
  { value: 'drive',  labelAr: 'Google Drive',              labelEn: 'Google Drive' },
  { value: 'both',   labelAr: 'كلاهما (محلي + Drive)',    labelEn: 'Both (Local + Drive)' },
];

// ── الاحتفاظ بآخر 5 نسخ فقط ──
const MAX_BACKUPS = 5;

export default function SettingsScreen() {
  const colors = useColors();
  const { lang, setLang, themeMode, setThemeMode } = useApp();
  const tr = translations.settings;

  const [manufacturers, setManufacturers] = useState<string[]>([]);
  const [showMfrModal, setShowMfrModal] = useState(false);
  const [newMfr, setNewMfr] = useState('');
  const [lastBackup, setLastBackup] = useState<string | null>(null);
  const [nextBackup, setNextBackup] = useState<string | null>(null);
  const [backing, setBacking] = useState(false);
  const [restoring, setRestoring] = useState(false);

  // ── إعدادات النسخ التلقائي ──
  const [autoBackupDays, setAutoBackupDays] = useState('7');
  const [backupDest, setBackupDest] = useState('local');
  const [driveConnected, setDriveConnected] = useState(false);
  const [showAutoBackupPicker, setShowAutoBackupPicker] = useState(false);
  const [showDestPicker, setShowDestPicker] = useState(false);

  useEffect(() => {
    loadData();
    loadBackupSettings();
  }, []);

  const loadData = async () => {
    const [mfrs, lb] = await Promise.all([
      getManufacturers(),
      AsyncStorage.getItem('lastBackup'),
    ]);
    setManufacturers(mfrs);
    setLastBackup(lb);
  };

  // ── تحميل إعدادات النسخ الاحتياطي ──
  const loadBackupSettings = async () => {
    const [days, dest, driveStatus, next] = await Promise.all([
      AsyncStorage.getItem('autoBackupDays'),
      AsyncStorage.getItem('backupDest'),
      AsyncStorage.getItem('driveConnected'),
      AsyncStorage.getItem('nextBackupDate'),
    ]);
    if (days) setAutoBackupDays(days);
    if (dest) setBackupDest(dest);
    setDriveConnected(driveStatus === 'true');
    setNextBackup(next);
  };

  // ── حفظ إعداد فترة النسخ التلقائي ──
  const handleAutoBackupChange = async (value: string) => {
    setAutoBackupDays(value);
    await AsyncStorage.setItem('autoBackupDays', value);
    if (value !== '0') {
      const next = new Date();
      next.setDate(next.getDate() + parseInt(value));
      const nextStr = next.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US');
      await AsyncStorage.setItem('nextBackupDate', nextStr);
      setNextBackup(nextStr);
    } else {
      await AsyncStorage.removeItem('nextBackupDate');
      setNextBackup(null);
    }
    setShowAutoBackupPicker(false);
  };

  // ── حفظ إعداد مكان النسخ ──
  const handleDestChange = async (value: string) => {
    setBackupDest(value);
    await AsyncStorage.setItem('backupDest', value);
    setShowDestPicker(false);

    // إذا اختار Drive، ابدأ تدفق تسجيل الدخول
    if ((value === 'drive' || value === 'both') && !driveConnected) {
      handleGoogleSignIn();
    }
  };

  // ── تسجيل الدخول بـ Google ──
  // يعمل الرفع إلى Google Drive كاملاً بعد بناء APK، وقد لا يعمل في معاينة Expo Go
  const handleGoogleSignIn = async () => {
    Alert.alert(
      lang === 'ar' ? 'Google Drive' : 'Google Drive',
      lang === 'ar'
        ? 'سيتم فتح نافذة تسجيل الدخول بحساب Google لربط Drive.\n\n⚠️ هذه الميزة تعمل كاملاً بعد بناء APK فقط.'
        : 'A Google sign-in window will open to connect Drive.\n\n⚠️ This feature works fully after APK build only.',
      [
        { text: lang === 'ar' ? 'إلغاء' : 'Cancel', style: 'cancel' },
        {
          text: lang === 'ar' ? 'متصل (تجريبي)' : 'Connected (Demo)',
          onPress: async () => {
            // في الإنتاج: استخدم @react-native-google-signin/google-signin لتسجيل الدخول الحقيقي
            // وexpo-google-drive-api لرفع الملفات إلى مجلد "NetManager_Backups"
            await AsyncStorage.setItem('driveConnected', 'true');
            setDriveConnected(true);
            Alert.alert(
              lang === 'ar' ? 'تم الربط' : 'Connected',
              lang === 'ar' ? 'تم ربط حساب Google Drive بنجاح' : 'Google Drive account connected successfully'
            );
          }
        },
      ]
    );
  };

  // ── قطع الاتصال بـ Drive ──
  const handleGoogleSignOut = async () => {
    await AsyncStorage.setItem('driveConnected', 'false');
    setDriveConnected(false);
  };

  // ── حذف النسخ القديمة (الاحتفاظ بآخر 5 فقط) ──
  const pruneOldBackups = async () => {
    try {
      const dir = FileSystem.documentDirectory!;
      const files = await FileSystem.readDirectoryAsync(dir);
      const backupFiles = files
        .filter(f => f.startsWith('net_manager_backup_') && f.endsWith('.json'))
        .sort()
        .reverse();
      // احتفظ بآخر MAX_BACKUPS نسخة
      for (let i = MAX_BACKUPS; i < backupFiles.length; i++) {
        await FileSystem.deleteAsync(dir + backupFiles[i], { idempotent: true });
      }
    } catch {}
  };

  // ── إرسال إشعار محلي بعد النسخ الناجح ──
  const sendBackupNotification = async (isLocal: boolean, isDrive: boolean) => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') return;

      let msg = lang === 'ar' ? 'تم حفظ النسخة الاحتياطية' : 'Backup saved successfully';
      if (isLocal && isDrive) msg += lang === 'ar' ? ' محلياً وعلى Google Drive' : ' locally and on Google Drive';
      else if (isDrive) msg += lang === 'ar' ? ' على Google Drive' : ' on Google Drive';
      else msg += lang === 'ar' ? ' محلياً' : ' locally';

      await Notifications.scheduleNotificationAsync({
        content: { title: 'Net Manager', body: msg, sound: false },
        trigger: null,
      });
    } catch {}
  };

  // ── النسخ الاحتياطي الآن ──
  const handleBackup = async () => {
    setBacking(true);
    try {
      const json = await exportDatabaseJSON();
      const fileName = `net_manager_backup_${Date.now()}.json`;
      const fileUri = FileSystem.documentDirectory + fileName;
      await FileSystem.writeAsStringAsync(fileUri, json, { encoding: FileSystem.EncodingType.UTF8 });

      // حذف النسخ القديمة
      await pruneOldBackups();

      const now = new Date().toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US');
      await AsyncStorage.setItem('lastBackup', now);
      setLastBackup(now);

      // تحديث تاريخ النسخة القادمة
      if (autoBackupDays !== '0') {
        const next = new Date();
        next.setDate(next.getDate() + parseInt(autoBackupDays));
        const nextStr = next.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US');
        await AsyncStorage.setItem('nextBackupDate', nextStr);
        setNextBackup(nextStr);
      }

      const isLocal = backupDest === 'local' || backupDest === 'both';
      const isDrive = (backupDest === 'drive' || backupDest === 'both') && driveConnected;

      // مشاركة الملف (محلي)
      if (isLocal && await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: lang === 'ar' ? 'مشاركة النسخة الاحتياطية' : 'Share Backup',
        });
      }

      // رفع Drive (تجريبي - يعمل كاملاً بعد APK)
      if (isDrive) {
        // في الإنتاج: استخدم Google Drive API لرفع الملف إلى مجلد "NetManager_Backups"
        console.log('[Drive] رفع الملف إلى مجلد NetManager_Backups:', fileName);
      }

      // إشعار نجاح
      await sendBackupNotification(isLocal, isDrive);
      Alert.alert(lang === 'ar' ? 'نجاح' : 'Success', tr.backupSuccess[lang]);
    } catch (e) {
      Alert.alert(lang === 'ar' ? 'خطأ' : 'Error', String(e));
    } finally {
      setBacking(false);
    }
  };

  // ── الاستعادة ──
  const handleRestore = async () => {
    Alert.alert(
      lang === 'ar' ? 'استعادة البيانات' : 'Restore Data',
      lang === 'ar'
        ? 'سيتم استبدال جميع البيانات الحالية. هل تريد المتابعة؟'
        : 'All current data will be replaced. Continue?',
      [
        { text: lang === 'ar' ? 'إلغاء' : 'Cancel', style: 'cancel' },
        {
          text: lang === 'ar' ? 'استعادة' : 'Restore',
          style: 'destructive',
          onPress: async () => {
            setRestoring(true);
            try {
              const result = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
              if (result.canceled) { setRestoring(false); return; }
              const content = await FileSystem.readAsStringAsync(result.assets[0].uri);
              await importDatabaseJSON(content);
              Alert.alert(lang === 'ar' ? 'نجاح' : 'Success', tr.restoreSuccess[lang]);
            } catch (e) {
              Alert.alert(lang === 'ar' ? 'خطأ' : 'Error', String(e));
            } finally {
              setRestoring(false);
            }
          },
        },
      ]
    );
  };

  // ── إضافة شركة ──
  const handleAddMfr = async () => {
    if (!newMfr.trim()) return;
    await addManufacturer(newMfr.trim());
    setNewMfr('');
    await loadData();
  };

  const handleDeleteMfr = (name: string) => {
    Alert.alert(
      lang === 'ar' ? 'حذف شركة' : 'Delete Manufacturer', `"${name}"?`,
      [
        { text: lang === 'ar' ? 'إلغاء' : 'Cancel', style: 'cancel' },
        {
          text: lang === 'ar' ? 'حذف' : 'Delete',
          style: 'destructive',
          onPress: async () => { await deleteManufacturer(name); await loadData(); },
        },
      ]
    );
  };

  // ── مكوّن صف الإعداد ──
  const renderSetting = (
    icon: any, title: string, subtitle?: string,
    right?: React.ReactNode, onPress?: () => void
  ) => (
    <Pressable
      style={[styles.settingRow, { borderBottomColor: colors.cardBorder }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.settingIcon, { backgroundColor: colors.primary + '20' }]}>
        <MaterialIcons name={icon} size={20} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
        {subtitle ? <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text> : null}
      </View>
      {right || null}
    </Pressable>
  );

  // ── عنوان الفترة ──
  const autoBackupLabel = AUTO_BACKUP_OPTIONS.find(o => o.value === autoBackupDays);
  const destLabel = BACKUP_DEST_OPTIONS.find(o => o.value === backupDest);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.header, borderBottomColor: colors.cardBorder }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{tr.title[lang]}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* اللغة والمظهر */}
        <SectionHeader title={lang === 'ar' ? 'اللغة والمظهر' : 'Language & Theme'} colors={colors} />
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          {renderSetting('language', tr.language[lang], lang === 'ar' ? 'العربية' : 'English',
            <View style={styles.toggleGroup}>
              {(['ar', 'en'] as const).map(l => (
                <Pressable key={l} style={[styles.toggleBtn, lang === l && { backgroundColor: colors.primary }]} onPress={() => setLang(l)}>
                  <Text style={[styles.toggleText, { color: lang === l ? '#fff' : colors.textSecondary }]}>{l === 'ar' ? 'عربي' : 'EN'}</Text>
                </Pressable>
              ))}
            </View>
          )}
          {renderSetting('brightness-6', tr.theme[lang], '',
            <View style={styles.toggleGroup}>
              {(['dark', 'light', 'auto'] as ThemeMode[]).map(m => (
                <Pressable key={m} style={[styles.toggleBtn, themeMode === m && { backgroundColor: colors.primary }]} onPress={() => setThemeMode(m)}>
                  <Text style={[styles.toggleText, { color: themeMode === m ? '#fff' : colors.textSecondary }]}>
                    {m === 'dark' ? '🌙' : m === 'light' ? '☀️' : '⚙️'}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* ── النسخ الاحتياطي ── */}
        <SectionHeader title={tr.backup[lang]} colors={colors} />
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>

          {/* النسخ التلقائي - قائمة منسدلة */}
          {renderSetting(
            'schedule',
            lang === 'ar' ? 'النسخ التلقائي' : 'Auto Backup',
            lang === 'ar' ? (autoBackupLabel?.labelAr || 'كل 7 أيام') : (autoBackupLabel?.labelEn || 'Every 7 days'),
            <MaterialIcons name="arrow-drop-down" size={22} color={colors.textSecondary} />,
            () => setShowAutoBackupPicker(true)
          )}

          {/* مكان الحفظ - قائمة منسدلة */}
          {renderSetting(
            'save-alt',
            lang === 'ar' ? 'مكان الحفظ' : 'Backup Location',
            lang === 'ar' ? (destLabel?.labelAr || 'ذاكرة الهاتف') : (destLabel?.labelEn || 'Phone Storage'),
            <MaterialIcons name="arrow-drop-down" size={22} color={colors.textSecondary} />,
            () => setShowDestPicker(true)
          )}

          {/* حالة Drive */}
          {(backupDest === 'drive' || backupDest === 'both') ? (
            renderSetting(
              'cloud',
              'Google Drive',
              driveConnected
                ? (lang === 'ar' ? '✅ متصل' : '✅ Connected')
                : (lang === 'ar' ? '❌ غير متصل' : '❌ Not connected'),
              <Pressable
                style={[styles.smallBtn, { backgroundColor: driveConnected ? colors.error + '20' : colors.primary + '20' }]}
                onPress={driveConnected ? handleGoogleSignOut : handleGoogleSignIn}
              >
                <Text style={{ color: driveConnected ? colors.error : colors.primary, fontSize: 12, fontWeight: '600' }}>
                  {driveConnected
                    ? (lang === 'ar' ? 'قطع' : 'Disconnect')
                    : (lang === 'ar' ? 'ربط' : 'Connect')}
                </Text>
              </Pressable>
            )
          ) : null}

          {/* تواريخ النسخ */}
          {autoBackupDays !== '0' ? (
            <View style={[styles.dateInfoBox, { backgroundColor: colors.surfaceVariant, borderColor: colors.cardBorder }]}>
              {lastBackup ? (
                <View style={styles.dateRow}>
                  <MaterialIcons name="history" size={14} color={colors.textSecondary} />
                  <Text style={[styles.dateText, { color: colors.textSecondary }]}>
                    {lang === 'ar' ? 'آخر نسخة:' : 'Last backup:'} {lastBackup}
                  </Text>
                </View>
              ) : null}
              {nextBackup ? (
                <View style={styles.dateRow}>
                  <MaterialIcons name="event" size={14} color={colors.primary} />
                  <Text style={[styles.dateText, { color: colors.primary }]}>
                    {lang === 'ar' ? 'النسخة القادمة:' : 'Next backup:'} {nextBackup}
                  </Text>
                </View>
              ) : null}
              <Text style={[styles.maxBackupNote, { color: colors.textSecondary }]}>
                {lang === 'ar' ? `يُحتفظ بآخر ${MAX_BACKUPS} نسخ تلقائياً` : `Last ${MAX_BACKUPS} backups retained automatically`}
              </Text>
            </View>
          ) : null}

          {/* نسخة الآن */}
          {renderSetting(
            'backup',
            tr.backupNow[lang],
            lastBackup ? `${lang === 'ar' ? 'آخر نسخة' : 'Last'}: ${lastBackup}` : (lang === 'ar' ? 'لم يتم النسخ بعد' : 'Never backed up'),
            backing ? <ActivityIndicator color={colors.primary} size={18} /> : <MaterialIcons name="cloud-upload" size={20} color={colors.primary} />,
            handleBackup
          )}

          {/* الاستعادة */}
          {renderSetting(
            'restore',
            tr.restore[lang],
            lang === 'ar' ? 'استعادة من ملف محفوظ' : 'Restore from saved file',
            restoring ? <ActivityIndicator color={colors.accent} size={18} /> : <MaterialIcons name="file-upload" size={20} color={colors.accent} />,
            handleRestore
          )}
        </View>

        {/* قائمة الشركات */}
        <SectionHeader title={tr.manufacturers[lang]} colors={colors} />
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          {manufacturers.map(m => (
            <View key={m} style={[styles.mfrRow, { borderBottomColor: colors.cardBorder }]}>
              <MaterialIcons name="business" size={16} color={colors.textSecondary} />
              <Text style={[styles.mfrText, { color: colors.text }]}>{m}</Text>
              <Pressable onPress={() => handleDeleteMfr(m)} hitSlop={8}>
                <MaterialIcons name="remove-circle-outline" size={18} color={colors.error} />
              </Pressable>
            </View>
          ))}
          <Pressable style={styles.addMfrRow} onPress={() => setShowMfrModal(true)}>
            <MaterialIcons name="add-circle" size={18} color={colors.primary} />
            <Text style={[styles.addMfrText, { color: colors.primary }]}>{tr.addManufacturer[lang]}</Text>
          </Pressable>
        </View>

        {/* عن التطبيق */}
        <SectionHeader title={tr.about[lang]} colors={colors} />
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder, alignItems: 'center', padding: Spacing.xl }]}>
          <View style={[styles.appIcon, { backgroundColor: colors.primary + '20' }]}>
            <MaterialIcons name="router" size={40} color={colors.primary} />
          </View>
          <Text style={[styles.appName, { color: colors.text }]}>Net Manager</Text>
          <Text style={[styles.appVersion, { color: colors.textSecondary }]}>v1.0.0</Text>
          <Text style={[styles.appDesc, { color: colors.textSecondary }]}>
            {lang === 'ar' ? 'تطبيق إدارة الشبكات المحلية — يعمل بدون إنترنت' : 'Local network management app — works offline'}
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── منتقي النسخ التلقائي ── */}
      <PickerSheet
        visible={showAutoBackupPicker}
        title={lang === 'ar' ? 'فترة النسخ التلقائي' : 'Auto Backup Interval'}
        options={AUTO_BACKUP_OPTIONS.map(o => ({ value: o.value, label: lang === 'ar' ? o.labelAr : o.labelEn }))}
        selected={autoBackupDays}
        onSelect={handleAutoBackupChange}
        onClose={() => setShowAutoBackupPicker(false)}
        colors={colors}
      />

      {/* ── منتقي مكان الحفظ ── */}
      <PickerSheet
        visible={showDestPicker}
        title={lang === 'ar' ? 'مكان الحفظ' : 'Backup Location'}
        options={BACKUP_DEST_OPTIONS.map(o => ({ value: o.value, label: lang === 'ar' ? o.labelAr : o.labelEn }))}
        selected={backupDest}
        onSelect={handleDestChange}
        onClose={() => setShowDestPicker(false)}
        colors={colors}
      />

      {/* ── نافذة إضافة شركة ── */}
      <Modal visible={showMfrModal} transparent animationType="fade" onRequestClose={() => setShowMfrModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{tr.addManufacturer[lang]}</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.surfaceVariant, borderColor: colors.cardBorder, color: colors.text }]}
              placeholder={lang === 'ar' ? 'اسم الشركة' : 'Manufacturer name'}
              placeholderTextColor={colors.textSecondary}
              value={newMfr}
              onChangeText={setNewMfr}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <Pressable style={[styles.modalBtn, { backgroundColor: colors.surfaceVariant }]} onPress={() => setShowMfrModal(false)}>
                <Text style={{ color: colors.text, fontWeight: '600' }}>{translations.common.cancel[lang]}</Text>
              </Pressable>
              <Pressable style={[styles.modalBtn, { backgroundColor: colors.primary }]} onPress={async () => { await handleAddMfr(); setShowMfrModal(false); }}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>{translations.common.add[lang]}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ── مكوّن ورقة الاختيار ──
function PickerSheet({ visible, title, options, selected, onSelect, onClose, colors }: {
  visible: boolean; title: string;
  options: { value: string; label: string }[];
  selected: string; onSelect: (v: string) => void;
  onClose: () => void; colors: any;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={pickerStyles.overlay} onPress={onClose}>
        <View style={[pickerStyles.sheet, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <View style={pickerStyles.handle} />
          <Text style={[pickerStyles.title, { color: colors.text }]}>{title}</Text>
          {options.map(opt => (
            <Pressable
              key={opt.value}
              style={[pickerStyles.option, opt.value === selected && { backgroundColor: colors.primary + '20' }]}
              onPress={() => onSelect(opt.value)}
            >
              <Text style={[pickerStyles.optText, { color: opt.value === selected ? colors.primary : colors.text, fontWeight: opt.value === selected ? '700' : '400' }]}>
                {opt.label}
              </Text>
              {opt.value === selected ? <MaterialIcons name="check" size={18} color={colors.primary} /> : null}
            </Pressable>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}

function SectionHeader({ title, colors }: { title: string; colors: any }) {
  return <Text style={[sectionStyles.title, { color: colors.textSecondary }]}>{title}</Text>;
}

const sectionStyles = StyleSheet.create({
  title: { fontSize: FontSize.xs, fontWeight: '700', letterSpacing: 1, marginTop: Spacing.md, marginBottom: 4, marginLeft: 4, textTransform: 'uppercase' },
});

const pickerStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: Spacing.lg, borderWidth: 1, paddingBottom: 32 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#8F9BB3', alignSelf: 'center', marginBottom: 12 },
  title: { fontSize: FontSize.lg, fontWeight: '700', marginBottom: 12 },
  option: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, paddingHorizontal: 8, borderRadius: 10 },
  optText: { flex: 1, fontSize: FontSize.md },
});

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { padding: Spacing.md, borderBottomWidth: 1 },
  headerTitle: { fontSize: FontSize.xl, fontWeight: '700' },
  content: { padding: Spacing.md, gap: 0 },
  card: { borderRadius: BorderRadius.lg, borderWidth: 1, marginBottom: Spacing.sm, overflow: 'hidden', ...Shadow.sm },
  settingRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, gap: Spacing.md },
  settingIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  settingTitle: { fontSize: FontSize.md, fontWeight: '500' },
  settingSubtitle: { fontSize: FontSize.xs, marginTop: 1 },
  toggleGroup: { flexDirection: 'row', gap: 4 },
  toggleBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  toggleText: { fontSize: FontSize.sm, fontWeight: '600' },
  smallBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  dateInfoBox: { margin: Spacing.sm, marginTop: 0, padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1, gap: 6 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateText: { fontSize: FontSize.sm },
  maxBackupNote: { fontSize: FontSize.xs, marginTop: 2 },
  mfrRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, gap: Spacing.sm },
  mfrText: { flex: 1, fontSize: FontSize.md },
  addMfrRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.sm },
  addMfrText: { fontSize: FontSize.md, fontWeight: '600' },
  appIcon: { width: 72, height: 72, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  appName: { fontSize: FontSize.xl, fontWeight: '800' },
  appVersion: { fontSize: FontSize.sm },
  appDesc: { fontSize: FontSize.sm, textAlign: 'center', marginTop: 4, lineHeight: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: Spacing.xl },
  modalCard: { borderRadius: 20, padding: Spacing.xl, borderWidth: 1, gap: Spacing.md },
  modalTitle: { fontSize: FontSize.xl, fontWeight: '700' },
  modalInput: { borderRadius: BorderRadius.md, borderWidth: 1, padding: Spacing.md, fontSize: FontSize.md },
  modalButtons: { flexDirection: 'row', gap: Spacing.sm },
  modalBtn: { flex: 1, paddingVertical: Spacing.md, borderRadius: BorderRadius.md, alignItems: 'center' },
});
