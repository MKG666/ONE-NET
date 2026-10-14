// ملف الترجمة - عربي وإنجليزي
export type Lang = 'ar' | 'en';

export const translations = {
  // التنقل
  nav: {
    home: { ar: 'الرئيسية', en: 'Home' },
    networks: { ar: 'الشبكات', en: 'Networks' },
    search: { ar: 'البحث', en: 'Search' },
    reports: { ar: 'التقارير', en: 'Reports' },
    settings: { ar: 'الإعدادات', en: 'Settings' },
  },
  // عام
  common: {
    save: { ar: 'حفظ', en: 'Save' },
    cancel: { ar: 'إلغاء', en: 'Cancel' },
    delete: { ar: 'حذف', en: 'Delete' },
    edit: { ar: 'تعديل', en: 'Edit' },
    add: { ar: 'إضافة', en: 'Add' },
    close: { ar: 'إغلاق', en: 'Close' },
    confirm: { ar: 'تأكيد', en: 'Confirm' },
    loading: { ar: 'جاري التحميل...', en: 'Loading...' },
    error: { ar: 'خطأ', en: 'Error' },
    success: { ar: 'تم بنجاح', en: 'Success' },
    warning: { ar: 'تحذير', en: 'Warning' },
    noData: { ar: 'لا توجد بيانات', en: 'No data' },
    search: { ar: 'بحث...', en: 'Search...' },
    optional: { ar: 'اختياري', en: 'Optional' },
    required: { ar: 'مطلوب', en: 'Required' },
    back: { ar: 'رجوع', en: 'Back' },
    share: { ar: 'مشاركة', en: 'Share' },
    copy: { ar: 'نسخ', en: 'Copy' },
    yes: { ar: 'نعم', en: 'Yes' },
    no: { ar: 'لا', en: 'No' },
  },
  // الشاشة الرئيسية
  dashboard: {
    title: { ar: 'لوحة التحكم', en: 'Dashboard' },
    totalModems: { ar: 'إجمالي المودمات', en: 'Total Modems' },
    activeModems: { ar: 'تعمل', en: 'Active' },
    inactiveModems: { ar: 'عاطلة', en: 'Inactive' },
    maintenance: { ar: 'صيانة', en: 'Maintenance' },
    disconnected: { ar: 'غير متصل', en: 'Disconnected' },
    byNetwork: { ar: 'توزيع حسب الشبكة', en: 'By Network' },
    byArea: { ar: 'توزيع حسب المنطقة', en: 'By Area' },
    byManufacturer: { ar: 'حسب الشركة', en: 'By Manufacturer' },
    alerts: { ar: 'التنبيهات', en: 'Alerts' },
    noAlerts: { ar: 'لا توجد تنبيهات', en: 'No alerts' },
    duplicateIP: { ar: 'عنوان IP مكرر', en: 'Duplicate IP' },
    duplicateMAC: { ar: 'عنوان MAC مكرر', en: 'Duplicate MAC' },
    duplicateVLAN: { ar: 'VLAN مكرر', en: 'Duplicate VLAN' },
  },
  // الشبكات
  network: {
    title: { ar: 'الشبكات', en: 'Networks' },
    addNetwork: { ar: 'إضافة شبكة', en: 'Add Network' },
    networkName: { ar: 'اسم الشبكة', en: 'Network Name' },
    description: { ar: 'وصف', en: 'Description' },
    areas: { ar: 'المناطق', en: 'Areas' },
    modems: { ar: 'مودم', en: 'Modems' },
    deleteConfirm: { ar: 'حذف الشبكة وجميع بياناتها؟', en: 'Delete network and all its data?' },
  },
  // المناطق
  area: {
    title: { ar: 'المناطق', en: 'Areas' },
    addArea: { ar: 'إضافة منطقة', en: 'Add Area' },
    areaName: { ar: 'اسم المنطقة', en: 'Area Name' },
    deleteConfirm: { ar: 'حذف المنطقة وجميع مودماتها؟', en: 'Delete area and all its modems?' },
  },
  // المودم
  modem: {
    title: { ar: 'المودمات', en: 'Modems' },
    addModem: { ar: 'إضافة مودم', en: 'Add Modem' },
    editModem: { ar: 'تعديل مودم', en: 'Edit Modem' },
    name: { ar: 'اسم المودم', en: 'Modem Name' },
    meshId: { ar: 'Mesh ID', en: 'Mesh ID' },
    manufacturer: { ar: 'الشركة المصنعة', en: 'Manufacturer' },
    ip: { ar: 'عنوان IP', en: 'IP Address' },
    mac: { ar: 'عنوان MAC', en: 'MAC Address' },
    vlan: { ar: 'VLAN', en: 'VLAN' },
    adminUser: { ar: 'اسم المستخدم', en: 'Admin Username' },
    adminPass: { ar: 'كلمة مرور اللوحة', en: 'Admin Password' },
    ssid: { ar: 'SSID الواي فاي', en: 'WiFi SSID' },
    wifiPass: { ar: 'كلمة مرور الواي فاي', en: 'WiFi Password' },
    serial: { ar: 'الرقم التسلسلي', en: 'Serial Number' },
    subscriber: { ar: 'اسم المشترك', en: 'Subscriber Name' },
    phone: { ar: 'رقم الهاتف', en: 'Phone Number' },
    location: { ar: 'الموقع', en: 'Location' },
    installDate: { ar: 'تاريخ التركيب', en: 'Install Date' },
    notes: { ar: 'ملاحظات', en: 'Notes' },
    status: { ar: 'الحالة', en: 'Status' },
    photos: { ar: 'الصور', en: 'Photos' },
    addedAt: { ar: 'تاريخ الإضافة', en: 'Added At' },
    updatedAt: { ar: 'آخر تعديل', en: 'Last Updated' },
    duplicateAlert: { ar: 'تنبيه: قيمة مكررة في نفس الشبكة!', en: 'Alert: Duplicate value in same network!' },
    invalidIP: { ar: 'صيغة IP غير صحيحة', en: 'Invalid IP format' },
    invalidMAC: { ar: 'صيغة MAC غير صحيحة', en: 'Invalid MAC format' },
    deleteConfirm: { ar: 'هل تريد حذف هذا المودم؟', en: 'Delete this modem?' },
    scanBarcode: { ar: 'مسح باركود', en: 'Scan Barcode' },
  },
  // البحث
  search: {
    title: { ar: 'البحث المتقدم', en: 'Advanced Search' },
    placeholder: { ar: 'ابحث بالاسم، IP، MAC، الهاتف...', en: 'Search by name, IP, MAC, phone...' },
    filters: { ar: 'فلاتر', en: 'Filters' },
    clearFilters: { ar: 'مسح الفلاتر', en: 'Clear Filters' },
    results: { ar: 'نتيجة', en: 'result(s)' },
  },
  // التقارير
  reports: {
    title: { ar: 'التقارير', en: 'Reports' },
    generatePDF: { ar: 'توليد PDF', en: 'Generate PDF' },
    selectArea: { ar: 'اختر منطقة', en: 'Select Area' },
    selectNetwork: { ar: 'اختر شبكة', en: 'Select Network' },
    generateQR: { ar: 'توليد QR', en: 'Generate QR' },
    shareReport: { ar: 'مشاركة التقرير', en: 'Share Report' },
    reportGenerated: { ar: 'تم توليد التقرير بنجاح', en: 'Report generated successfully' },
  },
  // الإعدادات
  settings: {
    title: { ar: 'الإعدادات', en: 'Settings' },
    language: { ar: 'اللغة', en: 'Language' },
    arabic: { ar: 'العربية', en: 'Arabic' },
    english: { ar: 'الإنجليزية', en: 'English' },
    theme: { ar: 'المظهر', en: 'Theme' },
    dark: { ar: 'داكن', en: 'Dark' },
    light: { ar: 'فاتح', en: 'Light' },
    auto: { ar: 'تلقائي', en: 'Auto' },
    backup: { ar: 'النسخ الاحتياطي', en: 'Backup' },
    backupNow: { ar: 'نسخة احتياطية الآن', en: 'Backup Now' },
    restore: { ar: 'استعادة', en: 'Restore' },
    autoBackup: { ar: 'نسخ احتياطي تلقائي', en: 'Auto Backup' },
    lastBackup: { ar: 'آخر نسخة احتياطية', en: 'Last Backup' },
    manufacturers: { ar: 'قائمة الشركات', en: 'Manufacturers List' },
    addManufacturer: { ar: 'إضافة شركة', en: 'Add Manufacturer' },
    about: { ar: 'عن التطبيق', en: 'About' },
    backupInterval: { ar: 'فترة النسخ الاحتياطي', en: 'Backup Interval' },
    backupSuccess: { ar: 'تم حفظ النسخة الاحتياطية بنجاح', en: 'Backup saved successfully' },
    restoreSuccess: { ar: 'تم استعادة البيانات بنجاح', en: 'Data restored successfully' },
  },
};

// دالة الترجمة
export function t(
  obj: Record<string, { ar: string; en: string }>,
  key: string,
  lang: Lang
): string {
  return obj[key]?.[lang] || key;
}
