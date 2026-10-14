// خدمة اكتشاف أجهزة MikroTik عبر بروتوكول MNDP
// MikroTik Neighbor Discovery Protocol - UDP Port 5678
// ملاحظة: الميزة تعمل كاملة بعد بناء APK (تحتاج Native Code)، وقد لا تعمل في معاينة Expo Go

import { Platform } from 'react-native';

// نوع بيانات جهاز MikroTik مكتشف
export interface MikroTikDevice {
  mac: string;
  ip: string;
  identity: string;   // اسم الجهاز
  platform: string;   // طراز الجهاز
  version: string;    // إصدار RouterOS
  board: string;      // اسم اللوحة
  iface: string;      // الواجهة
  discoveredAt: number;
}

// ثوابت بروتوكول MNDP
const MNDP_PORT = 5678;
const MNDP_BROADCAST = '255.255.255.255';
const MNDP_DISCOVERY_TIMEOUT = 5000; // 5 ثوانٍ

// حزمة طلب الاكتشاف MNDP (12 بايت)
function buildMNDPRequest(): Buffer {
  const buf = Buffer.alloc(12);
  buf.writeUInt16BE(0, 0);   // نوع الرسالة: طلب
  buf.writeUInt16BE(0, 2);   // كود التتبع
  buf.writeUInt32BE(0, 4);   // الطابع الزمني
  buf.writeUInt32BE(0, 8);   // معرف الجلسة
  return buf;
}

// فك حزمة MNDP واستخراج بيانات الجهاز
export function parseMNDPPacket(data: Buffer, senderIP: string): MikroTikDevice | null {
  try {
    // تحقق من حجم الحزمة (على الأقل 12 بايت)
    if (data.length < 12) return null;

    const device: MikroTikDevice = {
      mac: '',
      ip: senderIP,
      identity: '',
      platform: '',
      version: '',
      board: '',
      iface: '',
      discoveredAt: Date.now(),
    };

    // تخطي رأس الحزمة (12 بايت)
    let offset = 12;

    // قراءة حقول TLV (Type-Length-Value)
    while (offset < data.length - 4) {
      const type = data.readUInt16BE(offset);
      const length = data.readUInt16BE(offset + 2);
      offset += 4;

      if (offset + length > data.length) break;

      const value = data.slice(offset, offset + length);

      switch (type) {
        case 1: // MAC Address
          if (length === 6) {
            device.mac = Array.from(value)
              .map(b => b.toString(16).padStart(2, '0').toUpperCase())
              .join(':');
          }
          break;
        case 5: // Identity (اسم الجهاز)
          device.identity = value.toString('utf8').replace(/\0/g, '').trim();
          break;
        case 7: // Version (إصدار RouterOS)
          device.version = value.toString('utf8').replace(/\0/g, '').trim();
          break;
        case 8: // Platform (الطراز)
          device.platform = value.toString('utf8').replace(/\0/g, '').trim();
          break;
        case 10: // Interface Name
          device.iface = value.toString('utf8').replace(/\0/g, '').trim();
          break;
        case 12: // Board Name
          device.board = value.toString('utf8').replace(/\0/g, '').trim();
          break;
        case 15: // IPv4 Address
          if (length === 4) {
            device.ip = `${value[0]}.${value[1]}.${value[2]}.${value[3]}`;
          }
          break;
      }

      offset += length;
    }

    // يجب أن يكون للجهاز على الأقل MAC أو Identity
    if (!device.mac && !device.identity) return null;

    return device;
  } catch (err) {
    console.warn('[MNDP] خطأ في تحليل الحزمة:', err);
    return null;
  }
}

// واجهة خدمة الاكتشاف
export interface MNDPDiscoveryCallbacks {
  onDeviceFound: (device: MikroTikDevice) => void;
  onError: (error: string) => void;
  onComplete: () => void;
}

// كلاس خدمة MNDP - يستخدم react-native-udp
export class MNDPService {
  private socket: any = null;
  private isListening = false;
  private devices: Map<string, MikroTikDevice> = new Map();

  // بدء الاكتشاف
  async startDiscovery(callbacks: MNDPDiscoveryCallbacks): Promise<void> {
    // ملاحظة: react-native-udp لا يعمل في Expo Go
    try {
      // محاولة تحميل react-native-udp
      let UDPSocket: any;
      try {
        UDPSocket = require('react-native-udp').default || require('react-native-udp');
      } catch {
        callbacks.onError(
          Platform.OS === 'web'
            ? 'UDP غير مدعوم على المتصفح'
            : 'react-native-udp غير متوفر. الميزة تعمل فقط بعد بناء APK'
        );
        return;
      }

      this.devices.clear();

      // إنشاء socket UDP
      this.socket = UDPSocket.createSocket({ type: 'udp4', reusePort: true });

      this.socket.on('error', (err: any) => {
        callbacks.onError(`تعذر بدء الاستماع: ${err.message || 'منفذ 5678 قد يكون مستخدماً'}`);
        this.stopDiscovery();
      });

      this.socket.on('message', (msg: Buffer, rinfo: { address: string }) => {
        const device = parseMNDPPacket(msg, rinfo.address);
        if (device) {
          // استخدم MAC كمفتاح تفرد، أو IP إذا لم يكن MAC متاحاً
          const key = device.mac || device.ip;
          this.devices.set(key, device);
          callbacks.onDeviceFound(device);
        }
      });

      // ربط المنفذ
      this.socket.bind(MNDP_PORT, () => {
        this.isListening = true;

        // إرسال حزمة الاكتشاف
        try {
          const request = buildMNDPRequest();
          this.socket.send(request, 0, request.length, MNDP_PORT, MNDP_BROADCAST, () => {});
        } catch {
          // تجاهل خطأ الإرسال - قد لا تعمل broadcast في بعض الأجهزة
        }

        // إنهاء الاكتشاف بعد 5 ثوانٍ
        setTimeout(() => {
          this.stopDiscovery();
          callbacks.onComplete();
        }, MNDP_DISCOVERY_TIMEOUT);
      });
    } catch (err: any) {
      callbacks.onError(`خطأ غير متوقع: ${err?.message || 'تحقق من صلاحيات الشبكة'}`);
    }
  }

  // إيقاف الاكتشاف
  stopDiscovery(): void {
    if (this.socket) {
      try {
        this.socket.close();
      } catch {}
      this.socket = null;
    }
    this.isListening = false;
  }

  // الحصول على الأجهزة المكتشفة
  getDevices(): MikroTikDevice[] {
    return Array.from(this.devices.values());
  }

  get active(): boolean {
    return this.isListening;
  }
}

// مثيل مشترك للخدمة
export const mndpService = new MNDPService();
