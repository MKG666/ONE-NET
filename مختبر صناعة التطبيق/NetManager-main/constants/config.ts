// إعدادات التطبيق العامة
export const APP_CONFIG = {
  name: 'Net Manager',
  version: '1.0.0',
  dbName: 'net_manager.db',
  backupFolder: 'NetManagerBackups',
  maxImages: 5,
};

// قائمة الشركات المصنّعة الافتراضية
export const DEFAULT_MANUFACTURERS = [
  'Huawei',
  'TP-Link',
  'Mikrotik',
  'ZTE',
  'Cisco',
  'D-Link',
  'Ubiquiti',
  'Asus',
  'Netgear',
  'Tenda',
  'Ruijie',
  'H3C',
  'Nokia',
  'Calix',
  'Other',
];

// حالات المودم
export const MODEM_STATUS = {
  active: 'active',
  inactive: 'inactive',
  maintenance: 'maintenance',
  disconnected: 'disconnected',
} as const;

export type ModemStatus = keyof typeof MODEM_STATUS;

// نصوص حالات المودم
export const STATUS_LABELS: Record<string, { ar: string; en: string; color: string }> = {
  active: { ar: 'يعمل', en: 'Active', color: '#00D68F' },
  inactive: { ar: 'عاطل', en: 'Inactive', color: '#FF4D4D' },
  maintenance: { ar: 'صيانة', en: 'Maintenance', color: '#FFB800' },
  disconnected: { ar: 'غير متصل', en: 'Disconnected', color: '#8F9BB3' },
};

// فترات النسخ الاحتياطي
export const BACKUP_INTERVALS = [
  { value: 3, labelAr: 'كل 3 أيام', labelEn: 'Every 3 days' },
  { value: 7, labelAr: 'كل أسبوع', labelEn: 'Every week' },
  { value: 30, labelAr: 'كل شهر', labelEn: 'Every month' },
];
