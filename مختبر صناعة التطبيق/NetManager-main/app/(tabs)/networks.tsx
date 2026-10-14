// شاشة الشبكات - عرض هرمي
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable,
  RefreshControl, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNetworks, useAreas, useModems } from '@/hooks/useNetworks';
import { useColors } from '@/hooks/useApp';
import { useApp } from '@/hooks/useApp';
import { translations } from '@/constants/i18n';
import { NetworkModal } from '@/components/modals/NetworkModal';
import { AreaModal } from '@/components/modals/AreaModal';
import { ModemFormModal } from '@/components/modals/ModemFormModal';
import { ModemDetailModal } from '@/components/modals/ModemDetailModal';
import { ModemCard } from '@/components/ui/ModemCard';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Toast, useToast } from '@/components/ui/Toast';
import { Modem, deleteModem, getAreas, updateModem, createModem, getModemById } from '@/services/database';
import { Spacing, FontSize, BorderRadius, Shadow } from '@/constants/theme';

type View_ = 'networks' | 'areas' | 'modems';

export default function NetworksScreen() {
  const colors = useColors();
  const { lang } = useApp();
  const tr = translations;
  const { toast, show: showToast, hide: hideToast } = useToast();

  // الشبكات
  const { networks, loading: nLoading, reload: reloadNetworks, createNetwork, updateNetwork, deleteNetwork } = useNetworks();
  const [selectedNetwork, setSelectedNetwork] = useState<any>(null);
  const [showNetworkModal, setShowNetworkModal] = useState(false);
  const [editNetwork, setEditNetwork] = useState<any>(null);

  // المناطق
  const { areas, loading: aLoading, reload: reloadAreas, createArea, updateArea, deleteArea } = useAreas(selectedNetwork?.id);
  const [selectedArea, setSelectedArea] = useState<any>(null);
  const [showAreaModal, setShowAreaModal] = useState(false);
  const [editArea, setEditArea] = useState<any>(null);

  // المودمات
  const { modems, loading: mLoading, reload: reloadModems } = useModems(selectedArea?.id);
  const [showModemForm, setShowModemForm] = useState(false);
  const [editModem, setEditModem] = useState<Partial<Modem> | null>(null);
  const [viewModem, setViewModem] = useState<Modem | null>(null);

  // تأكيد الحذف
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; item: any } | null>(null);

  const currentView: View_ = selectedArea ? 'modems' : selectedNetwork ? 'areas' : 'networks';

  // ═══════════════════
  // عمليات الحذف
  // ═══════════════════
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'network') {
        await deleteNetwork(deleteTarget.item.id);
        if (selectedNetwork?.id === deleteTarget.item.id) setSelectedNetwork(null);
        showToast(lang === 'ar' ? 'تم حذف الشبكة' : 'Network deleted', 'success');
      } else if (deleteTarget.type === 'area') {
        await deleteArea(deleteTarget.item.id);
        if (selectedArea?.id === deleteTarget.item.id) setSelectedArea(null);
        showToast(lang === 'ar' ? 'تم حذف المنطقة' : 'Area deleted', 'success');
      } else if (deleteTarget.type === 'modem') {
        await deleteModem(deleteTarget.item.id);
        await reloadModems();
        showToast(lang === 'ar' ? 'تم حذف المودم' : 'Modem deleted', 'success');
      }
    } catch {
      showToast(lang === 'ar' ? 'فشل الحذف' : 'Delete failed', 'error');
    }
    setDeleteTarget(null);
  };

  // ═══════════════════
  // حفظ المودم
  // ═══════════════════
  const handleSaveModem = async (data: Partial<Modem>) => {
    if (editModem?.id) {
      await updateModem(editModem.id, data as any);
      showToast(lang === 'ar' ? 'تم تحديث المودم' : 'Modem updated', 'success');
    } else {
      await createModem({ ...data, area_id: data.area_id || selectedArea?.id } as any);
      showToast(lang === 'ar' ? 'تم إضافة المودم' : 'Modem added', 'success');
    }
    await reloadModems();
  };

  // ═══════════════════
  // الرأس مع التنقل
  // ═══════════════════
  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: colors.header, borderBottomColor: colors.cardBorder }]}>
      {currentView !== 'networks' ? (
        <Pressable onPress={() => { if (currentView === 'modems') setSelectedArea(null); else setSelectedNetwork(null); }} hitSlop={8}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
      ) : <View style={{ width: 24 }} />}

      <View style={{ flex: 1, marginHorizontal: 8 }}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {currentView === 'networks' ? tr.nav.networks[lang]
            : currentView === 'areas' ? selectedNetwork?.name
            : selectedArea?.name}
        </Text>
        {currentView === 'modems' ? (
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>{selectedNetwork?.name}</Text>
        ) : null}
      </View>

      <Pressable
        style={[styles.addBtn, { backgroundColor: colors.primary }]}
        onPress={() => {
          if (currentView === 'networks') { setEditNetwork(null); setShowNetworkModal(true); }
          else if (currentView === 'areas') { setEditArea(null); setShowAreaModal(true); }
          else { setEditModem(null); setShowModemForm(true); }
        }}
      >
        <MaterialIcons name="add" size={20} color="#fff" />
        <Text style={styles.addBtnText}>
          {currentView === 'networks' ? tr.network.addNetwork[lang]
            : currentView === 'areas' ? tr.area.addArea[lang]
            : tr.modem.addModem[lang]}
        </Text>
      </Pressable>
    </View>
  );

  // ═══════════════════
  // قائمة الشبكات
  // ═══════════════════
  const renderNetworkItem = ({ item }: { item: any }) => (
    <Pressable
      style={({ pressed }) => [styles.networkCard, { backgroundColor: colors.card, borderColor: colors.cardBorder, opacity: pressed ? 0.85 : 1 }]}
      onPress={() => setSelectedNetwork(item)}
    >
      <View style={[styles.networkIcon, { backgroundColor: colors.primary + '20' }]}>
        <MaterialIcons name="lan" size={24} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.networkName, { color: colors.text }]}>{item.name}</Text>
        {item.description ? <Text style={[styles.networkDesc, { color: colors.textSecondary }]} numberOfLines={1}>{item.description}</Text> : null}
        <View style={styles.networkStats}>
          <Text style={[styles.statChip, { color: colors.primary }]}>{item.area_count || 0} {lang === 'ar' ? 'منطقة' : 'areas'}</Text>
          <Text style={[styles.statChip, { color: colors.accent }]}>{item.modem_count || 0} {lang === 'ar' ? 'مودم' : 'modems'}</Text>
        </View>
      </View>
      <View style={styles.cardActions}>
        <Pressable hitSlop={8} onPress={() => { setEditNetwork(item); setShowNetworkModal(true); }}>
          <MaterialIcons name="edit" size={18} color={colors.textSecondary} />
        </Pressable>
        <Pressable hitSlop={8} onPress={() => setDeleteTarget({ type: 'network', item })}>
          <MaterialIcons name="delete-outline" size={18} color={colors.error} />
        </Pressable>
        <MaterialIcons name="chevron-right" size={22} color={colors.textSecondary} />
      </View>
    </Pressable>
  );

  // ═══════════════════
  // قائمة المناطق
  // ═══════════════════
  const renderAreaItem = ({ item }: { item: any }) => (
    <Pressable
      style={({ pressed }) => [styles.networkCard, { backgroundColor: colors.card, borderColor: colors.cardBorder, opacity: pressed ? 0.85 : 1 }]}
      onPress={() => setSelectedArea(item)}
    >
      <View style={[styles.networkIcon, { backgroundColor: colors.accent + '20' }]}>
        <MaterialIcons name="location-on" size={24} color={colors.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.networkName, { color: colors.text }]}>{item.name}</Text>
        {item.description ? <Text style={[styles.networkDesc, { color: colors.textSecondary }]} numberOfLines={1}>{item.description}</Text> : null}
        <Text style={[styles.statChip, { color: colors.primary }]}>{item.modem_count || 0} {lang === 'ar' ? 'مودم' : 'modems'}</Text>
      </View>
      <View style={styles.cardActions}>
        <Pressable hitSlop={8} onPress={() => { setEditArea(item); setShowAreaModal(true); }}>
          <MaterialIcons name="edit" size={18} color={colors.textSecondary} />
        </Pressable>
        <Pressable hitSlop={8} onPress={() => setDeleteTarget({ type: 'area', item })}>
          <MaterialIcons name="delete-outline" size={18} color={colors.error} />
        </Pressable>
        <MaterialIcons name="chevron-right" size={22} color={colors.textSecondary} />
      </View>
    </Pressable>
  );

  const allAreas = useAreas().areas;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      {renderHeader()}

      {currentView === 'networks' ? (
        <FlatList
          data={networks}
          keyExtractor={i => String(i.id)}
          renderItem={renderNetworkItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={nLoading} onRefresh={reloadNetworks} tintColor={colors.primary} />}
          ListEmptyComponent={!nLoading ? (
            <View style={styles.empty}>
              <MaterialIcons name="lan" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{tr.common.noData[lang]}</Text>
            </View>
          ) : null}
        />
      ) : currentView === 'areas' ? (
        <FlatList
          data={areas}
          keyExtractor={i => String(i.id)}
          renderItem={renderAreaItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={aLoading} onRefresh={reloadAreas} tintColor={colors.primary} />}
          ListEmptyComponent={!aLoading ? (
            <View style={styles.empty}>
              <MaterialIcons name="location-on" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{tr.common.noData[lang]}</Text>
            </View>
          ) : null}
        />
      ) : (
        <FlatList
          data={modems}
          keyExtractor={i => String(i.id)}
          renderItem={({ item }) => (
            <ModemCard
              modem={item}
              onPress={() => setViewModem(item)}
              onEdit={() => { setEditModem(item); setShowModemForm(true); }}
              onDelete={() => setDeleteTarget({ type: 'modem', item })}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={mLoading} onRefresh={reloadModems} tintColor={colors.primary} />}
          ListEmptyComponent={!mLoading ? (
            <View style={styles.empty}>
              <MaterialIcons name="router" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{tr.common.noData[lang]}</Text>
            </View>
          ) : null}
        />
      )}

      {/* النوافذ */}
      <NetworkModal visible={showNetworkModal} network={editNetwork}
        onSave={async (n, d) => { if (editNetwork) await updateNetwork(editNetwork.id, n, d); else await createNetwork(n, d); showToast(lang === 'ar' ? 'تم الحفظ' : 'Saved'); }}
        onClose={() => setShowNetworkModal(false)} />

      <AreaModal visible={showAreaModal} area={editArea} networkName={selectedNetwork?.name}
        onSave={async (n, d) => { if (editArea) await updateArea(editArea.id, n, d); else await createArea(n, d); showToast(lang === 'ar' ? 'تم الحفظ' : 'Saved'); }}
        onClose={() => setShowAreaModal(false)} />

      <ModemFormModal visible={showModemForm} modem={editModem} areas={allAreas}
        defaultAreaId={selectedArea?.id} onSave={handleSaveModem} onClose={() => setShowModemForm(false)} />

      <ModemDetailModal visible={!!viewModem} modem={viewModem} onClose={() => setViewModem(null)}
        onEdit={() => { setEditModem(viewModem); setViewModem(null); setShowModemForm(true); }} />

      <ConfirmDialog visible={!!deleteTarget} title={tr.common.delete[lang]}
        message={deleteTarget?.type === 'network' ? tr.network.deleteConfirm[lang]
          : deleteTarget?.type === 'area' ? tr.area.deleteConfirm[lang]
          : tr.modem.deleteConfirm[lang]}
        onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />

      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hideToast} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderBottomWidth: 1, gap: Spacing.sm },
  headerTitle: { fontSize: FontSize.xl, fontWeight: '700' },
  headerSub: { fontSize: FontSize.sm, marginTop: 1 },
  addBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, gap: 4 },
  addBtnText: { color: '#fff', fontSize: FontSize.sm, fontWeight: '600' },
  list: { padding: Spacing.md, gap: Spacing.sm, flexGrow: 1 },
  networkCard: { flexDirection: 'row', alignItems: 'center', borderRadius: BorderRadius.lg, borderWidth: 1, padding: Spacing.md, gap: Spacing.md, ...Shadow.sm },
  networkIcon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  networkName: { fontSize: FontSize.md, fontWeight: '600' },
  networkDesc: { fontSize: FontSize.sm, marginTop: 2 },
  networkStats: { flexDirection: 'row', gap: Spacing.sm, marginTop: 4 },
  statChip: { fontSize: FontSize.xs, fontWeight: '600' },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: FontSize.md },
});
