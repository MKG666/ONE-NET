// شاشة الانطلاق/Splash
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { getDatabase } from '@/services/database';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const router = useRouter();
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);

  useEffect(() => {
    const init = async () => {
      // تهيئة قاعدة البيانات
      await getDatabase();

      // تشغيل الأنيميشن
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }),
      ]).start();

      // الانتقال للتطبيق بعد 2.5 ثانية
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 2500);
    };
    init();
  }, []);

  return (
    <View style={styles.container}>
      {/* خلفية */}
      <View style={styles.bgGradient} />

      {/* شبكة زخرفية */}
      <View style={styles.grid}>
        {Array.from({ length: 6 }).map((_, i) => (
          <View key={i} style={[styles.gridLine, { top: i * 80 }]} />
        ))}
      </View>

      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        {/* الأيقونة */}
        <View style={styles.iconContainer}>
          <View style={styles.iconBg}>
            <MaterialIcons name="router" size={64} color="#00B4D8" />
          </View>
          <View style={styles.iconRing1} />
          <View style={styles.iconRing2} />
        </View>

        {/* الاسم */}
        <Text style={styles.appName}>Net Manager</Text>
        <Text style={styles.tagline}>إدارة شبكاتك بسهولة واحترافية</Text>

        {/* نقاط التحميل */}
        <View style={styles.dots}>
          {[0, 1, 2].map(i => (
            <Animated.View key={i} style={[styles.dot, { opacity: fadeAnim }]} />
          ))}
        </View>
      </Animated.View>

      {/* الإصدار */}
      <Text style={styles.version}>v1.0.0</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A1628', justifyContent: 'center', alignItems: 'center' },
  bgGradient: { ...StyleSheet.absoluteFillObject, backgroundColor: '#0A1628' },
  grid: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  gridLine: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: '#00B4D810' },
  content: { alignItems: 'center', gap: 16 },
  iconContainer: { width: 130, height: 130, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  iconBg: { width: 100, height: 100, borderRadius: 24, backgroundColor: '#00B4D820', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#00B4D840' },
  iconRing1: { position: 'absolute', width: 120, height: 120, borderRadius: 60, borderWidth: 1, borderColor: '#00B4D830' },
  iconRing2: { position: 'absolute', width: 140, height: 140, borderRadius: 70, borderWidth: 1, borderColor: '#00B4D815' },
  appName: { fontSize: 34, fontWeight: '900', color: '#FFFFFF', letterSpacing: 1 },
  tagline: { fontSize: 15, color: '#00B4D8', fontWeight: '500' },
  dots: { flexDirection: 'row', gap: 8, marginTop: 16 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#00B4D8' },
  version: { position: 'absolute', bottom: 40, color: '#4A5568', fontSize: 12 },
});
