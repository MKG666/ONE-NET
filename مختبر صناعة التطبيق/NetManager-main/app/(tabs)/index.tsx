// الشاشة الرئيسية - لوحة التحكم
import React, { useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { StatCard } from '@/components/ui/StatCard';
import { SimpleBarChart } from '@/components/ui/SimpleBarChart';
import { SimplePieChart } from '@/components/ui/SimplePieChart';
import { useColors } from '@/hooks/useApp';
import { useApp } from '@/hooks/useApp';
import { useDashboard } from '@/hooks/useNetworks';
import { translations } from '@/constants/i18n';
import { Spacing, FontSize, BorderRadius } from '@/constants/theme';

export default function DashboardScreen() {
  const colors = useColors();
  const { lang } = useApp();
  const { stats, loading, reload } = useDashboard();
  const tr = translations.dashboard;

  const getStatusCount = (status: string) => {
    return stats?.byStatus?.find((s: any) => s.status === status)?.count || 0;
  };

  const alerts = [
    ...(stats?.duplicateIPs || []).map((d: any) => ({
      type: 'ip', message: `${tr.duplicateIP[lang]}: ${d.ip} (${d.count}x)`, color: colors.error
    })),
    ...(stats?.duplicateMACs || []).map((d: any) => ({
      type: 'mac', message: `${tr.duplicateMAC[lang]}: ${d.mac} (${d.count}x)`, color: colors.warning
    })),
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      {/* الرأس */}
      <View style={[styles.header, { backgroundColor: colors.header, borderBottomColor: colors.cardBorder }]}>
        <View style={styles.headerIcon}>
          <MaterialIcons name="router" size={22} color={colors.primary} />
        </View>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Net Manager</Text>
        <Text style={[styles.headerSub, { color: colors.primary }]}>v1.0</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} tintColor={colors.primary} />}
      >
        {/* تنبيهات */}
        {alerts.length > 0 ? (
          <View style={[styles.alertBox, { backgroundColor: colors.error + '15', borderColor: colors.error + '40' }]}>
            <MaterialIcons name="warning" size={20} color={colors.error} />
            <View style={{ flex: 1 }}>
              {alerts.slice(0, 3).map((a, i) => (
                <Text key={i} style={[styles.alertText, { color: a.color }]}>{a.message}</Text>
              ))}
              {alerts.length > 3 ? <Text style={[styles.alertText, { color: colors.textSecondary }]}>+{alerts.length - 3} {lang === 'ar' ? 'أخرى' : 'more'}</Text> : null}
            </View>
          </View>
        ) : null}

        {/* البطاقات الإحصائية */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{lang === 'ar' ? 'نظرة عامة' : 'Overview'}</Text>
        <View style={styles.statsGrid}>
          <StatCard title={tr.totalModems[lang]} value={stats?.total || 0} icon="router" color={colors.primary} />
          <StatCard title={tr.activeModems[lang]} value={getStatusCount('active')} icon="check-circle" color={colors.success} />
        </View>
        <View style={styles.statsGrid}>
          <StatCard title={tr.inactiveModems[lang]} value={getStatusCount('inactive')} icon="cancel" color={colors.error} />
          <StatCard title={tr.maintenance[lang]} value={getStatusCount('maintenance')} icon="build" color={colors.warning} />
        </View>
        <View style={styles.statsGrid}>
          <StatCard title={tr.disconnected[lang]} value={getStatusCount('disconnected')} icon="wifi-off" color={colors.textSecondary} />
        </View>

        {/* الرسوم البيانية */}
        {(stats?.byNetwork || []).length > 0 ? (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{tr.byNetwork[lang]}</Text>
            <SimplePieChart data={stats.byNetwork.filter((d: any) => d.count > 0)} title={tr.byNetwork[lang]} />
          </>
        ) : null}

        {(stats?.byArea || []).length > 0 ? (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{tr.byArea[lang]}</Text>
            <SimpleBarChart data={stats.byArea.filter((d: any) => d.count > 0)} color={colors.accent} />
          </>
        ) : null}

        {(stats?.byManufacturer || []).length > 0 ? (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{tr.byManufacturer[lang]}</Text>
            <SimplePieChart data={stats.byManufacturer.filter((d: any) => d.count > 0)} />
          </>
        ) : null}

        {/* رسالة فارغة */}
        {(stats?.total || 0) === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <MaterialIcons name="router" size={64} color={colors.primary + '60'} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>{lang === 'ar' ? 'ابدأ بإضافة شبكاتك' : 'Start adding your networks'}</Text>
            <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
              {lang === 'ar' ? 'انتقل إلى تبويب الشبكات لإضافة شبكة ومناطق ومودمات' : 'Go to Networks tab to add networks, areas and modems'}
            </Text>
          </View>
        ) : null}

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderBottomWidth: 1, gap: Spacing.sm },
  headerIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#00B4D820', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: FontSize.xl, fontWeight: '800' },
  headerSub: { fontSize: FontSize.sm, fontWeight: '600' },
  content: { padding: Spacing.md, gap: Spacing.sm },
  alertBox: { flexDirection: 'row', alignItems: 'flex-start', padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1, gap: Spacing.sm },
  alertText: { fontSize: FontSize.sm, lineHeight: 20 },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '700', marginTop: Spacing.sm },
  statsGrid: { flexDirection: 'row', gap: Spacing.sm },
  emptyCard: { borderRadius: BorderRadius.xl, padding: Spacing.xxl, alignItems: 'center', borderWidth: 1, gap: Spacing.md, marginTop: Spacing.xl },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: '700', textAlign: 'center' },
  emptyDesc: { fontSize: FontSize.md, textAlign: 'center', lineHeight: 24 },
});
