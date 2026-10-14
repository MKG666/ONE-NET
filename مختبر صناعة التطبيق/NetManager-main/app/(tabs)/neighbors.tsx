// شاشة "جيران الشبكة" - اكتشاف أجهزة MikroTik عبر MNDP
// ملاحظة: الميزة تعمل كاملة بعد بناء APK (تحتاج Native Code)، وقد لا تعمل في معاينة Expo Go
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable,
  ActivityIndicator, Modal, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import { mndpService, MikroTikDevice } from '@/services/MikroTikNeighborService';
import { ModemFormModal } from '@/components/modals/ModemFormModal';
import { useColors } from '@/hooks/useApp';
import { useApp } from '@/hooks/useApp';
import { getAreas, Area, Modem } from '@/services/database';
import { BorderRadius, FontSize, Shadow, Spacing } from '@/constants/theme';
import { Toast, useToast } from '@/components/ui/Toast';

export default function NeighborsScreen() {
  const colors = useColors();
  const { lang } = useApp();
  const { toast, show: showToast, hide: hideToast } = useToast();

  const [devices, setDevices] = useState<MikroTikDevice[]>([]);
  const [scanning, setScanning] = useState(false);
  const [isWifi, setIsWifi] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<MikroTikDevice | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showModemForm, setShowModemForm] = useState(false);
  const [prefillData, setPrefillData] = useState<Partial<Modem> | null>(null);
  const [areas, setAreas] = useState<Area[]>([]);

  // التحقق من حالة الشبكة
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsWifi(state.isConnected === true && (state.type === 'wifi' || state.type === 'ethernet'));
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    getAreas().then(setAreas);
  }, []);

  // بدء المسح
  const startScan = useCallback(async () => {
    if (scanning) return;
    setDevices([]);
    setError(null);
    setScanning(true);

    mndpService.startDiscovery({
      onDeviceFound: (device) => {
        setDevices(prev => {
          const key = device.mac || device.ip;
          const exists = prev.find(d => (d.mac || d.ip) === key);
          if (exists) return prev.map(d => (d.mac || d.ip) === key ? device : d);
          return [...prev, device];
        });
      },
      onError: (msg) => {
        setError(msg);
        setScanning(false);
      },
      onComplete: () => {
        setScanning(false);
      },
    });
  }, [scanning]);

  // إيقاف المسح
  const stopScan = () => {
    mndpService.stopDiscovery();
    setScanning(false);
  };

  // فتح نموذج إضافة مودم مع البيانات المملوءة تلقائياً
  const handleAddAsModem = (device: MikroTikDevice) => {
    setPrefillData({
      name: device.identity || device.board || 'MikroTik',
      ip: device.ip || '',
      mac: device.mac || '',
      manufacturer: 'Mikrotik',
      notes: `Platform: ${device.platform || ''} | Version: ${device.version || ''} | Interface: ${device.iface || ''}`,
      status: 'active',
      photos: '[]',
    });
    setShowDetail(false);
    setShowModemForm(true);
  };

  // عرض بطاقة جهاز
  const renderDevice = ({ item }: { item: MikroTikDevice }) => (
    <Pressable
      style={({ pressed }) => [styles.deviceCard, { backgroundColor: colors.card, borderColor: colors.cardBorder, opacity: pressed ? 0.9 : 1 }]}
      onPress={() => { setSelectedDevice(item); setShowDetail(true); }}
    >
      <View style={[styles.deviceIcon, { backgroundColor: '#E31A22' + '20' }]}>
        <MaterialIcons name="router" size={26} color="#E31A22" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.deviceName, { color: colors.text }]} numberOfLines={1}>
          {item.identity || item.board || (lang === 'ar' ? 'جهاز MikroTik' : 'MikroTik Device')}
        </Text>
        <Text style={[styles.deviceSub, { color: colors.textSecondary }]}>
          {item.ip ? `IP: ${item.ip}  ` : ''}{item.mac ? `MAC: ${item.mac}` : ''}
        </Text>
        {item.version ? <Text style={[styles.deviceMeta, { color: colors.textSecondary }]}>RouterOS {item.version}</Text> : null}
      </View>
      <Pressable
        style={[styles.addBtn, { backgroundColor: colors.primary + '20' }]}
        onPress={() => handleAddAsModem(item)}
        hitSlop={8}
      >
        <MaterialIcons name="add-circle" size={22} color={colors.primary} />
      </Pressable>
      <MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />
    </Pressable>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      {/* الرأس */}
      <View style={[styles.header, { backgroundColor: colors.header, borderBottomColor: colors.cardBorder }]}>
        <View style={[styles.headerIcon, { backgroundColor: '#E31A22' + '20' }]}>
          <MaterialIcons name="device-hub" size={20} color="#E31A22" />
        </View>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {lang === 'ar' ? 'جيران الشبكة' : 'Network Neighbors'}
        </Text>
        <Pressable
          style={[styles.scanBtn, { backgroundColor: scanning ? colors.error : colors.primary }]}
          onPress={scanning ? stopScan : startScan}
          disabled={isWifi === false}
        >
          {scanning
            ? <ActivityIndicator color="#fff" size={16} />
            : <MaterialIcons name="refresh" size={18} color="#fff" />}
          <Text style={styles.scanBtnText}>
            {scanning
              ? (lang === 'ar' ? 'إيقاف' : 'Stop')
              : (lang === 'ar' ? 'مسح' : 'Scan')}
          </Text>
        </Pressable>
      </View>

      {/* تنبيه WiFi */}
      {isWifi === false ? (
        <View style={[styles.wifiAlert, { backgroundColor: colors.warning + '20', borderColor: colors.warning + '40' }]}>
          <MaterialIcons name="wifi-off" size={22} color={colors.warning} />
          <Text style={[styles.wifiAlertText, { color: colors.warning }]}>
            {lang === 'ar'
              ? 'الرجاء الاتصال بشبكة WiFi محلية لاستخدام ميزة اكتشاف الجيران'
              : 'Please connect to a local WiFi network to use neighbor discovery'}
          </Text>
        </View>
      ) : null}

      {/* تنبيه خطأ */}
      {error ? (
        <View style={[styles.wifiAlert, { backgroundColor: colors.error + '15', borderColor: colors.error + '40' }]}>
          <MaterialIcons name="error-outline" size={20} color={colors.error} />
          <Text style={[styles.wifiAlertText, { color: colors.error }]}>{error}</Text>
        </View>
      ) : null}

      {/* مؤشر المسح */}
      {scanning ? (
        <View style={[styles.scanningBar, { backgroundColor: colors.primary + '15' }]}>
          <ActivityIndicator size={14} color={colors.primary} />
          <Text style={[styles.scanningText, { color: colors.primary }]}>
            {lang === 'ar' ? `جاري البحث... عُثر على ${devices.length} جهاز` : `Scanning... Found ${devices.length} device(s)`}
          </Text>
        </View>
      ) : null}

      {/* قائمة الأجهزة */}
      <FlatList
        data={devices}
        keyExtractor={item => item.mac || item.ip}
        renderItem={renderDevice}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={!scanning ? (
          <View style={styles.empty}>
            <MaterialIcons name="device-hub" size={64} color={colors.primary + '40'} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {devices.length === 0 && !error
                ? (lang === 'ar' ? 'لم يتم العثور على أجهزة' : 'No devices found')
                : ''}
            </Text>
            <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
              {lang === 'ar'
                ? 'تأكد من اتصالك بالشبكة الصحيحة، ثم اضغط "مسح"'
                : 'Make sure you are connected to the right network, then press "Scan"'}
            </Text>
            <View style={[styles.noteBox, { backgroundColor: colors.surfaceVariant, borderColor: colors.cardBorder }]}>
              <MaterialIcons name="info-outline" size={16} color={colors.primary} />
              <Text style={[styles.noteText, { color: colors.textSecondary }]}>
                {lang === 'ar'
                  ? 'الميزة تعمل كاملة بعد بناء APK، وقد لا تعمل في معاينة Expo Go'
                  : 'Feature works fully after APK build, may not work in Expo Go preview'}
              </Text>
            </View>
          </View>
        ) : null}
      />

      {/* نافذة تفاصيل الجهاز */}
      <Modal
        visible={showDetail}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDetail(false)}
      >
        <Pressable style={styles.sheetOverlay} onPress={() => setShowDetail(false)}>
          <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
            <View style={styles.sheetHandle} />

            {/* رأس الجهاز */}
            <View style={styles.sheetHeader}>
              <View style={[styles.sheetIcon, { backgroundColor: '#E31A22' + '20' }]}>
                <MaterialIcons name="router" size={32} color="#E31A22" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sheetTitle, { color: colors.text }]}>
                  {selectedDevice?.identity || selectedDevice?.board || 'MikroTik'}
                </Text>
                <Text style={[styles.sheetSub, { color: colors.textSecondary }]}>
                  {selectedDevice?.platform || 'MikroTik'}
                </Text>
              </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* تفاصيل */}
              {[
                { icon: 'computer', label: 'IP', value: selectedDevice?.ip },
                { icon: 'memory', label: 'MAC', value: selectedDevice?.mac },
                { icon: 'info', label: lang === 'ar' ? 'الإصدار' : 'Version', value: selectedDevice?.version ? `RouterOS ${selectedDevice.version}` : null },
                { icon: 'developer-board', label: lang === 'ar' ? 'اللوحة' : 'Board', value: selectedDevice?.board },
                { icon: 'settings-ethernet', label: lang === 'ar' ? 'الواجهة' : 'Interface', value: selectedDevice?.iface },
              ].map(({ icon, label, value }) =>
                value ? (
                  <View key={label} style={[styles.detailRow, { borderBottomColor: colors.cardBorder }]}>
                    <MaterialIcons name={icon as any} size={18} color={colors.primary} />
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{label}</Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>{value}</Text>
                  </View>
                ) : null
              )}
            </ScrollView>

            {/* زر الإضافة */}
            <Pressable
              style={[styles.addModemBtn, { backgroundColor: colors.primary }]}
              onPress={() => selectedDevice && handleAddAsModem(selectedDevice)}
            >
              <MaterialIcons name="add-circle" size={20} color="#fff" />
              <Text style={styles.addModemBtnText}>
                {lang === 'ar' ? 'إضافة كمودم جديد' : 'Add as New Modem'}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* نموذج إضافة مودم */}
      <ModemFormModal
        visible={showModemForm}
        modem={prefillData}
        areas={areas}
        onSave={async (data) => {
          showToast(lang === 'ar' ? 'تم إضافة المودم' : 'Modem added', 'success');
        }}
        onClose={() => setShowModemForm(false)}
      />

      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hideToast} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderBottomWidth: 1, gap: Spacing.sm },
  headerIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: FontSize.xl, fontWeight: '700' },
  scanBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, gap: 4 },
  scanBtnText: { color: '#fff', fontWeight: '600', fontSize: FontSize.sm },
  wifiAlert: { flexDirection: 'row', alignItems: 'flex-start', margin: Spacing.md, padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1, gap: 10 },
  wifiAlertText: { flex: 1, fontSize: FontSize.sm, lineHeight: 20, fontWeight: '500' },
  scanningBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: 8, gap: 10 },
  scanningText: { fontSize: FontSize.sm, fontWeight: '600' },
  list: { padding: Spacing.md, gap: Spacing.sm, flexGrow: 1 },
  deviceCard: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1, gap: Spacing.md, ...Shadow.sm },
  deviceIcon: { width: 50, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  deviceName: { fontSize: FontSize.md, fontWeight: '600' },
  deviceSub: { fontSize: FontSize.sm, marginTop: 2 },
  deviceMeta: { fontSize: FontSize.xs, marginTop: 1 },
  addBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 14, paddingHorizontal: 32 },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '700', textAlign: 'center' },
  emptyDesc: { fontSize: FontSize.md, textAlign: 'center', lineHeight: 24 },
  noteBox: { flexDirection: 'row', alignItems: 'flex-start', padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1, gap: 8, marginTop: 8 },
  noteText: { flex: 1, fontSize: FontSize.sm, lineHeight: 18 },
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.lg, borderWidth: 1, maxHeight: '75%', gap: Spacing.md },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#8F9BB3', alignSelf: 'center', marginBottom: 4 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  sheetIcon: { width: 60, height: 60, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  sheetTitle: { fontSize: FontSize.xl, fontWeight: '700' },
  sheetSub: { fontSize: FontSize.sm, marginTop: 2 },
  detailRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, gap: Spacing.sm },
  detailLabel: { fontSize: FontSize.sm, fontWeight: '500', width: 80 },
  detailValue: { flex: 1, fontSize: FontSize.md, fontWeight: '500' },
  addModemBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: Spacing.md, borderRadius: BorderRadius.lg, gap: 8, marginTop: 4 },
  addModemBtnText: { color: '#fff', fontSize: FontSize.md, fontWeight: '700' },
});
