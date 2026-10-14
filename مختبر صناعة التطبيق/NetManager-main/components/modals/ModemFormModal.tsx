// نافذة إضافة/تعديل مودم - مع تحقق لحظي من تكرار IP/MAC/VLAN
// المهمة 2: تنبيه تكرار فوري مع Debounce 500ms وModal تفصيلي
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Modal, StyleSheet, ScrollView, Text, Pressable,
  KeyboardAvoidingView, Platform, Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { InputField } from '../ui/InputField';
import { useColors } from '@/hooks/useApp';
import { useApp } from '@/hooks/useApp';
import { translations } from '@/constants/i18n';
import { Modem, Area, checkDuplicates, getManufacturers, searchModems } from '@/services/database';
import { MODEM_STATUS, STATUS_LABELS } from '@/constants/config';
import { BorderRadius, Spacing, FontSize } from '@/constants/theme';

interface ModemFormModalProps {
  visible: boolean;
  modem?: Partial<Modem> | null;
  areas: Area[];
  defaultAreaId?: number;
  onSave: (data: Partial<Modem>) => Promise<void>;
  onClose: () => void;
}

// ── التحقق من صيغة IP ──
const validateIP = (ip: string) =>
  /^(\d{1,3}\.){3}\d{1,3}$/.test(ip) && ip.split('.').every(n => parseInt(n) <= 255);

// ── التحقق من صيغة MAC ──
const validateMAC = (mac: string) =>
  /^([0-9A-Fa-f]{2}[:\-]){5}[0-9A-Fa-f]{2}$/.test(mac);

// ── نوع نتيجة التحقق من التكرار ──
interface DupResult {
  isDuplicate: boolean;
  field?: 'ip' | 'mac' | 'vlan';
  existingModemName?: string;
  message?: string;
}

// ── نوع حالة التحقق اللحظي ──
type FieldValidity = 'idle' | 'checking' | 'ok' | 'duplicate';

export function ModemFormModal({ visible, modem, areas, defaultAreaId, onSave, onClose }: ModemFormModalProps) {
  const colors = useColors();
  const { lang } = useApp();
  const tr = translations.modem;

  const [form, setForm] = useState<Partial<Modem>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dupErrors, setDupErrors] = useState<Record<string, string>>({}); // أخطاء التكرار
  const [fieldValidity, setFieldValidity] = useState<Record<string, FieldValidity>>({});
  const [saving, setSaving] = useState(false);
  const [manufacturers, setManufacturers] = useState<string[]>([]);
  const [showManufacturerPicker, setShowManufacturerPicker] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [showAreaPicker, setShowAreaPicker] = useState(false);
  const [scanTarget, setScanTarget] = useState<'mac' | 'serial' | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  // Modal تأكيد التكرار
  const [showDupConfirm, setShowDupConfirm] = useState(false);
  const [dupConfirmMsg, setDupConfirmMsg] = useState('');
  const [pendingSave, setPendingSave] = useState(false);
  // Timers Debounce
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    if (visible) {
      loadManufacturers();
      if (modem) setForm({ ...modem });
      else setForm({ status: 'active', area_id: defaultAreaId, photos: '[]' });
      setErrors({});
      setDupErrors({});
      setFieldValidity({});
    }
    return () => {
      Object.values(debounceTimers.current).forEach(clearTimeout);
    };
  }, [visible, modem, defaultAreaId]);

  const loadManufacturers = async () => {
    const list = await getManufacturers();
    setManufacturers(list);
  };

  // ── تحديث حقل مع تشغيل التحقق اللحظي ──
  const setField = (key: keyof Modem, value: any) => {
    setForm(p => ({ ...p, [key]: value }));
    setErrors(p => ({ ...p, [key]: '' }));
    setDupErrors(p => ({ ...p, [key]: '' }));

    // التحقق اللحظي لـ IP / MAC / VLAN
    if (['ip', 'mac', 'vlan'].includes(key as string) && value) {
      setFieldValidity(p => ({ ...p, [key]: 'checking' }));
      if (debounceTimers.current[key as string]) clearTimeout(debounceTimers.current[key as string]);
      debounceTimers.current[key as string] = setTimeout(() => {
        checkFieldDuplicate(key as 'ip' | 'mac' | 'vlan', value);
      }, 500);
    } else if (['ip', 'mac', 'vlan'].includes(key as string)) {
      setFieldValidity(p => ({ ...p, [key]: 'idle' }));
    }
  };

  // ── دالة التحقق اللحظي لحقل واحد ──
  const checkFieldDuplicate = useCallback(async (field: 'ip' | 'mac' | 'vlan', value: any) => {
    const selectedArea = areas.find(a => a.id === form.area_id);
    if (!selectedArea || !value) {
      setFieldValidity(p => ({ ...p, [field]: 'idle' }));
      return;
    }

    try {
      const ipVal   = field === 'ip'   ? String(value) : undefined;
      const macVal  = field === 'mac'  ? String(value) : undefined;
      const vlanVal = field === 'vlan' ? Number(value) : undefined;

      // لا تتحقق من IP إذا لم تكن الصيغة صحيحة
      if (field === 'ip' && !validateIP(String(value))) {
        setFieldValidity(p => ({ ...p, [field]: 'idle' }));
        return;
      }

      const result = await checkDuplicates(
        selectedArea.network_id,
        ipVal, macVal, vlanVal,
        modem?.id
      );

      const isDup = result[field] === true;
      setFieldValidity(p => ({ ...p, [field]: isDup ? 'duplicate' : 'ok' }));

      if (isDup) {
        // اجلب اسم المودم المكرر
        const modems = await searchModems('', { networkId: selectedArea.network_id });
        const existing = modems.find(m =>
          (field === 'ip' && m.ip === ipVal) ||
          (field === 'mac' && m.mac === macVal) ||
          (field === 'vlan' && m.vlan === vlanVal)
        );
        const label = field === 'ip' ? 'IP' : field === 'mac' ? 'MAC' : 'VLAN';
        setDupErrors(p => ({
          ...p,
          [field]: lang === 'ar'
            ? `${label} مستخدم في مودم آخر${existing ? `: ${existing.name}` : ''}`
            : `${label} used in another modem${existing ? `: ${existing.name}` : ''}`,
        }));
      } else {
        setDupErrors(p => ({ ...p, [field]: '' }));
      }
    } catch {
      setFieldValidity(p => ({ ...p, [field]: 'idle' }));
    }
  }, [form.area_id, areas, modem?.id, lang]);

  // ── أيقونة حالة الحقل ──
  const renderFieldIndicator = (field: string) => {
    const v = fieldValidity[field];
    if (v === 'checking') return <MaterialIcons name="sync" size={16} color={colors.textSecondary} />;
    if (v === 'ok')        return <MaterialIcons name="check-circle" size={16} color="#00D68F" />;
    if (v === 'duplicate') return <MaterialIcons name="warning" size={16} color={colors.error} />;
    return null;
  };

  // ── التحقق الكامل من التكرار قبل الحفظ ──
  const checkAllDuplicates = async (): Promise<DupResult> => {
    const selectedArea = areas.find(a => a.id === form.area_id);
    if (!selectedArea) return { isDuplicate: false };

    const result = await checkDuplicates(
      selectedArea.network_id,
      form.ip || undefined,
      form.mac || undefined,
      form.vlan || undefined,
      modem?.id
    );

    if (result.ip || result.mac || result.vlan) {
      // اجلب اسم المودم المكرر
      const modems = await searchModems('', { networkId: selectedArea.network_id });
      let field: 'ip' | 'mac' | 'vlan' | undefined;
      let value = '';
      let name = '';

      if (result.ip) {
        field = 'ip';
        value = form.ip || '';
        name = modems.find(m => m.ip === form.ip)?.name || '';
      } else if (result.mac) {
        field = 'mac';
        value = form.mac || '';
        name = modems.find(m => m.mac === form.mac)?.name || '';
      } else if (result.vlan) {
        field = 'vlan';
        value = String(form.vlan || '');
        name = modems.find(m => m.vlan === form.vlan)?.name || '';
      }

      const label = field === 'ip' ? 'IP' : field === 'mac' ? 'MAC' : 'VLAN';
      const msg = lang === 'ar'
        ? `⚠️ تحذير: عنوان ${label} (${value}) مستخدم مسبقاً في المودم: "${name}"`
        : `⚠️ Warning: ${label} address (${value}) is already used in modem: "${name}"`;

      return { isDuplicate: true, field, existingModemName: name, message: msg };
    }
    return { isDuplicate: false };
  };

  // ── مسح الباركود ──
  const startScan = async (target: 'mac' | 'serial') => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert(lang === 'ar' ? 'لا يوجد إذن للكاميرا' : 'No camera permission');
        return;
      }
    }
    setScanTarget(target);
  };

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scanTarget === 'mac') setField('mac', data);
    else if (scanTarget === 'serial') setField('serial', data);
    setScanTarget(null);
  };

  // ── التحقق من الصيغة ──
  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name?.trim()) errs.name = lang === 'ar' ? 'الاسم مطلوب' : 'Name required';
    if (!form.area_id) errs.area_id = lang === 'ar' ? 'المنطقة مطلوبة' : 'Area required';
    if (form.ip && !validateIP(form.ip)) errs.ip = tr.invalidIP[lang];
    if (form.mac && !validateMAC(form.mac)) errs.mac = tr.invalidMAC[lang];
    return errs;
  };

  // ── الحفظ الرئيسي ──
  const handleSave = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    // التحقق من التكرار
    const dupResult = await checkAllDuplicates();
    if (dupResult.isDuplicate) {
      // تمييز الحقل المكرر بإطار أحمر
      if (dupResult.field) {
        setErrors(p => ({ ...p, [dupResult.field!]: lang === 'ar' ? 'قيمة مكررة' : 'Duplicate value' }));
      }
      // عرض Modal تأكيد
      setDupConfirmMsg(dupResult.message || '');
      setShowDupConfirm(true);
      return;
    }
    doSave();
  };

  const doSave = async () => {
    setSaving(true);
    setShowDupConfirm(false);
    try {
      await onSave(form);
      onClose();
    } catch {
      Alert.alert(lang === 'ar' ? 'خطأ' : 'Error', lang === 'ar' ? 'فشل الحفظ' : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  // ── شاشة مسح الباركود ──
  if (scanTarget !== null) {
    return (
      <Modal visible animationType="slide" onRequestClose={() => setScanTarget(null)}>
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          {permission?.granted ? (
            <CameraView
              style={StyleSheet.absoluteFillObject}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr', 'code128', 'code39', 'ean13', 'ean8', 'datamatrix'] }}
              onBarcodeScanned={handleBarcodeScanned}
            />
          ) : (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontSize: 16 }}>{lang === 'ar' ? 'لا يوجد إذن للكاميرا' : 'No camera permission'}</Text>
            </View>
          )}
          <View style={styles.scanOverlay}>
            <View style={styles.scanFrame} />
            <Text style={styles.scanText}>{lang === 'ar' ? 'وجّه الكاميرا نحو الباركود' : 'Point camera at barcode'}</Text>
            <Pressable style={styles.cancelScan} onPress={() => setScanTarget(null)}>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>{lang === 'ar' ? 'إلغاء' : 'Cancel'}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    );
  }

  const selectedArea = areas.find(a => a.id === form.area_id);
  const selectedStatus = form.status || 'active';

  return (
    <>
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.container, { backgroundColor: colors.bg }]}>
            {/* الرأس */}
            <View style={[styles.header, { backgroundColor: colors.header, borderBottomColor: colors.cardBorder }]}>
              <Pressable onPress={onClose} hitSlop={8}>
                <MaterialIcons name="arrow-back" size={24} color={colors.text} />
              </Pressable>
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                {modem?.id ? tr.editModem[lang] : tr.addModem[lang]}
              </Text>
              <Pressable
                style={[styles.saveBtn, { backgroundColor: colors.primary }, saving && { opacity: 0.6 }]}
                onPress={handleSave}
                disabled={saving}
              >
                <Text style={styles.saveBtnText}>{saving ? '...' : translations.common.save[lang]}</Text>
              </Pressable>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>
              {/* المعلومات الأساسية */}
              <SectionTitle title={lang === 'ar' ? 'المعلومات الأساسية' : 'Basic Info'} colors={colors} />

              {/* اختيار المنطقة */}
              <View style={{ marginBottom: Spacing.sm }}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{translations.area.areaName[lang]}</Text>
                <Pressable
                  style={[styles.picker, { backgroundColor: colors.surfaceVariant, borderColor: errors.area_id ? colors.error : colors.cardBorder }]}
                  onPress={() => setShowAreaPicker(true)}
                >
                  <Text style={{ color: selectedArea ? colors.text : colors.textSecondary, flex: 1 }}>
                    {selectedArea ? selectedArea.name : (lang === 'ar' ? 'اختر منطقة...' : 'Select area...')}
                  </Text>
                  <MaterialIcons name="arrow-drop-down" size={22} color={colors.textSecondary} />
                </Pressable>
                {errors.area_id ? <Text style={styles.errText}>{errors.area_id}</Text> : null}
              </View>

              <InputField label={tr.name[lang]} value={form.name || ''} onChangeText={v => setField('name', v)}
                placeholder={lang === 'ar' ? 'اسم المودم' : 'Modem name'} error={errors.name} />
              <InputField label={`${tr.meshId[lang]} (${translations.common.optional[lang]})`}
                value={form.mesh_id || ''} onChangeText={v => setField('mesh_id', v)} placeholder="Mesh-001" />

              {/* الشركة */}
              <View style={{ marginBottom: Spacing.sm }}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{tr.manufacturer[lang]}</Text>
                <Pressable
                  style={[styles.picker, { backgroundColor: colors.surfaceVariant, borderColor: colors.cardBorder }]}
                  onPress={() => setShowManufacturerPicker(true)}
                >
                  <Text style={{ color: form.manufacturer ? colors.text : colors.textSecondary, flex: 1 }}>
                    {form.manufacturer || (lang === 'ar' ? 'اختر شركة...' : 'Select manufacturer...')}
                  </Text>
                  <MaterialIcons name="arrow-drop-down" size={22} color={colors.textSecondary} />
                </Pressable>
              </View>

              {/* الحالة */}
              <View style={{ marginBottom: Spacing.sm }}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{tr.status[lang]}</Text>
                <Pressable
                  style={[styles.picker, { backgroundColor: colors.surfaceVariant, borderColor: colors.cardBorder }]}
                  onPress={() => setShowStatusPicker(true)}
                >
                  <View style={[styles.statusDot, { backgroundColor: STATUS_LABELS[selectedStatus]?.color }]} />
                  <Text style={{ color: colors.text, flex: 1 }}>{STATUS_LABELS[selectedStatus]?.[lang] || selectedStatus}</Text>
                  <MaterialIcons name="arrow-drop-down" size={22} color={colors.textSecondary} />
                </Pressable>
              </View>

              {/* بيانات الشبكة */}
              <SectionTitle title={lang === 'ar' ? 'بيانات الشبكة' : 'Network Data'} colors={colors} />

              {/* IP مع تحقق لحظي */}
              <View style={{ marginBottom: Spacing.sm }}>
                <InputField
                  label={tr.ip[lang]}
                  value={form.ip || ''}
                  onChangeText={v => setField('ip', v)}
                  placeholder="192.168.1.1"
                  keyboardType="decimal-pad"
                  error={errors.ip || dupErrors.ip}
                  borderColor={dupErrors.ip ? colors.error : fieldValidity.ip === 'ok' ? '#00D68F' : undefined}
                />
                <View style={styles.fieldHint}>
                  {renderFieldIndicator('ip')}
                  {dupErrors.ip ? <Text style={[styles.dupText, { color: colors.error }]}>{dupErrors.ip}</Text> : null}
                  {fieldValidity.ip === 'ok' && !dupErrors.ip ? <Text style={[styles.dupText, { color: '#00D68F' }]}>✓ {lang === 'ar' ? 'فريد' : 'Unique'}</Text> : null}
                </View>
              </View>

              {/* MAC مع تحقق لحظي */}
              <View style={{ marginBottom: Spacing.sm }}>
                <InputField
                  label={tr.mac[lang]}
                  value={form.mac || ''}
                  onChangeText={v => setField('mac', v)}
                  placeholder="AA:BB:CC:DD:EE:FF"
                  error={errors.mac || dupErrors.mac}
                  borderColor={dupErrors.mac ? colors.error : fieldValidity.mac === 'ok' ? '#00D68F' : undefined}
                  rightIcon="qr-code-scanner"
                  onRightIconPress={() => startScan('mac')}
                />
                <View style={styles.fieldHint}>
                  {renderFieldIndicator('mac')}
                  {dupErrors.mac ? <Text style={[styles.dupText, { color: colors.error }]}>{dupErrors.mac}</Text> : null}
                  {fieldValidity.mac === 'ok' && !dupErrors.mac ? <Text style={[styles.dupText, { color: '#00D68F' }]}>✓ {lang === 'ar' ? 'فريد' : 'Unique'}</Text> : null}
                </View>
              </View>

              {/* VLAN مع تحقق لحظي */}
              <View style={{ marginBottom: Spacing.sm }}>
                <InputField
                  label="VLAN"
                  value={form.vlan ? String(form.vlan) : ''}
                  onChangeText={v => setField('vlan', v ? parseInt(v) || 0 : undefined)}
                  placeholder="100"
                  keyboardType="number-pad"
                  error={dupErrors.vlan}
                  borderColor={dupErrors.vlan ? colors.error : fieldValidity.vlan === 'ok' ? '#00D68F' : undefined}
                />
                <View style={styles.fieldHint}>
                  {renderFieldIndicator('vlan')}
                  {dupErrors.vlan ? <Text style={[styles.dupText, { color: colors.error }]}>{dupErrors.vlan}</Text> : null}
                  {fieldValidity.vlan === 'ok' && !dupErrors.vlan ? <Text style={[styles.dupText, { color: '#00D68F' }]}>✓ {lang === 'ar' ? 'فريد' : 'Unique'}</Text> : null}
                </View>
              </View>

              {/* لوحة الإدارة */}
              <SectionTitle title={lang === 'ar' ? 'لوحة الإدارة' : 'Admin Panel'} colors={colors} />
              <InputField label={tr.adminUser[lang]} value={form.admin_user || ''} onChangeText={v => setField('admin_user', v)}
                placeholder="admin" autoCapitalize="none" />
              <InputField label={tr.adminPass[lang]} value={form.admin_pass || ''} onChangeText={v => setField('admin_pass', v)}
                isPassword placeholder="••••••" />

              {/* الواي فاي */}
              <SectionTitle title={lang === 'ar' ? 'الواي فاي' : 'WiFi'} colors={colors} />
              <InputField label={tr.ssid[lang]} value={form.ssid || ''} onChangeText={v => setField('ssid', v)}
                placeholder="MyNetwork_2.4G" autoCapitalize="none" />
              <InputField label={tr.wifiPass[lang]} value={form.wifi_pass || ''} onChangeText={v => setField('wifi_pass', v)}
                isPassword placeholder="••••••••" />

              {/* المشترك */}
              <SectionTitle title={lang === 'ar' ? 'بيانات المشترك' : 'Subscriber'} colors={colors} />
              <InputField label={tr.subscriber[lang]} value={form.subscriber_name || ''} onChangeText={v => setField('subscriber_name', v)}
                placeholder={lang === 'ar' ? 'اسم المشترك' : 'Subscriber name'} />
              <InputField label={tr.phone[lang]} value={form.subscriber_phone || ''} onChangeText={v => setField('subscriber_phone', v)}
                placeholder="+964..." keyboardType="phone-pad" />

              {/* إضافي */}
              <SectionTitle title={lang === 'ar' ? 'معلومات إضافية' : 'Additional Info'} colors={colors} />
              <InputField label={tr.serial[lang]} value={form.serial || ''} onChangeText={v => setField('serial', v)}
                placeholder="SN-12345678"
                rightIcon="qr-code-scanner" onRightIconPress={() => startScan('serial')} />
              <InputField label={`${tr.installDate[lang]} (${translations.common.optional[lang]})`}
                value={form.install_date || ''} onChangeText={v => setField('install_date', v)} placeholder="YYYY-MM-DD" />
              <InputField label={`${tr.notes[lang]} (${translations.common.optional[lang]})`}
                value={form.notes || ''} onChangeText={v => setField('notes', v)}
                placeholder={lang === 'ar' ? 'ملاحظات...' : 'Notes...'}
                multiline numberOfLines={4} style={{ height: 80, textAlignVertical: 'top' }} />

              <View style={{ height: 40 }} />
            </ScrollView>
          </View>

          {/* منتقي الشركة */}
          <PickerModal
            visible={showManufacturerPicker} title={tr.manufacturer[lang]}
            options={manufacturers} selected={form.manufacturer || ''}
            onSelect={v => { setField('manufacturer', v); setShowManufacturerPicker(false); }}
            onClose={() => setShowManufacturerPicker(false)} colors={colors}
          />

          {/* منتقي الحالة */}
          <PickerModal
            visible={showStatusPicker} title={tr.status[lang]}
            options={Object.keys(MODEM_STATUS)} selected={form.status || 'active'}
            onSelect={v => { setField('status', v); setShowStatusPicker(false); }}
            onClose={() => setShowStatusPicker(false)} colors={colors}
            renderLabel={(v: string) => STATUS_LABELS[v]?.[lang] || v}
            renderColor={(v: string) => STATUS_LABELS[v]?.color}
          />

          {/* منتقي المنطقة */}
          <PickerModal
            visible={showAreaPicker} title={translations.area.areaName[lang]}
            options={areas.map(a => String(a.id))} selected={String(form.area_id || '')}
            onSelect={v => { setField('area_id', parseInt(v)); setShowAreaPicker(false); }}
            onClose={() => setShowAreaPicker(false)} colors={colors}
            renderLabel={(v: string) => areas.find(a => a.id === parseInt(v))?.name || v}
          />
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Modal تأكيد التكرار ── */}
      <Modal visible={showDupConfirm} transparent animationType="fade" onRequestClose={() => setShowDupConfirm(false)}>
        <View style={dupStyles.overlay}>
          <View style={[dupStyles.card, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
            <View style={dupStyles.iconRow}>
              <MaterialIcons name="warning" size={32} color={colors.warning} />
            </View>
            <Text style={[dupStyles.title, { color: colors.text }]}>
              {lang === 'ar' ? 'تنبيه: قيمة مكررة' : 'Warning: Duplicate Value'}
            </Text>
            <Text style={[dupStyles.msg, { color: colors.textSecondary }]}>{dupConfirmMsg}</Text>
            <View style={dupStyles.btnRow}>
              <Pressable
                style={[dupStyles.btn, { backgroundColor: colors.surfaceVariant }]}
                onPress={() => setShowDupConfirm(false)}
              >
                <Text style={{ color: colors.text, fontWeight: '700' }}>
                  {lang === 'ar' ? 'إلغاء الحفظ' : 'Cancel Save'}
                </Text>
              </Pressable>
              <Pressable
                style={[dupStyles.btn, { backgroundColor: colors.warning }]}
                onPress={doSave}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>
                  {lang === 'ar' ? 'المتابعة على أي حال' : 'Save Anyway'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

// ── مكوّن عنوان القسم ──
function SectionTitle({ title, colors }: { title: string; colors: any }) {
  return (
    <View style={[sectionStyles.wrap, { borderBottomColor: colors.cardBorder }]}>
      <Text style={[sectionStyles.text, { color: colors.primary }]}>{title}</Text>
    </View>
  );
}

// ── منتقي عام ──
function PickerModal({ visible, title, options, selected, onSelect, onClose, colors, renderLabel, renderColor }: any) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={pickerStyles.overlay} onPress={onClose}>
        <View style={[pickerStyles.sheet, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <Text style={[pickerStyles.title, { color: colors.text }]}>{title}</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {options.map((opt: string) => (
              <Pressable
                key={opt}
                style={[pickerStyles.option, opt === selected && { backgroundColor: colors.primary + '20' }]}
                onPress={() => onSelect(opt)}
              >
                {renderColor ? <View style={[pickerStyles.dot, { backgroundColor: renderColor(opt) }]} /> : null}
                <Text style={[pickerStyles.optText, { color: colors.text }, opt === selected && { color: colors.primary, fontWeight: '700' }]}>
                  {renderLabel ? renderLabel(opt) : opt}
                </Text>
                {opt === selected ? <MaterialIcons name="check" size={18} color={colors.primary} /> : null}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Pressable>
    </Modal>
  );
}

const dupStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 24 },
  card: { borderRadius: 20, padding: 24, borderWidth: 1, gap: 16 },
  iconRow: { alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  msg: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  btnRow: { flexDirection: 'row', gap: 12 },
  btn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
});

const sectionStyles = StyleSheet.create({
  wrap: { borderBottomWidth: 1, paddingBottom: 6, marginBottom: Spacing.md, marginTop: Spacing.sm },
  text: { fontSize: FontSize.sm, fontWeight: '700', letterSpacing: 0.5 },
});

const pickerStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 24 },
  sheet: { borderRadius: 20, padding: 20, borderWidth: 1, maxHeight: '80%' },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  option: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 8, borderRadius: 10, gap: 8 },
  optText: { flex: 1, fontSize: 15 },
  dot: { width: 10, height: 10, borderRadius: 5 },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md, paddingTop: Spacing.xl + 8, borderBottomWidth: 1 },
  headerTitle: { fontSize: FontSize.lg, fontWeight: '700', flex: 1, textAlign: 'center' },
  saveBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: FontSize.md },
  form: { padding: Spacing.md },
  fieldLabel: { fontSize: FontSize.sm, fontWeight: '500', marginBottom: 4 },
  picker: { flexDirection: 'row', alignItems: 'center', borderRadius: BorderRadius.md, borderWidth: 1, paddingHorizontal: Spacing.md, paddingVertical: 12, gap: 8 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  fieldHint: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: -6, marginBottom: 4, marginLeft: 2 },
  dupText: { fontSize: 11, fontWeight: '500' },
  errText: { color: '#FF4D4D', fontSize: 11, marginTop: 2 },
  scanOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', gap: 20 },
  scanFrame: { width: 250, height: 180, borderWidth: 2, borderColor: '#00B4D8', borderRadius: 12 },
  scanText: { color: '#fff', fontSize: 16, textAlign: 'center' },
  cancelScan: { backgroundColor: '#FF4D4D', paddingHorizontal: 32, paddingVertical: 12, borderRadius: 24, marginTop: 20 },
});
