// شاشة البحث المتقدم
import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable,
  TextInput, ScrollView, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { searchModems, Modem, getAreas, getNetworks, getManufacturers, updateModem, deleteModem } from '@/services/database';
import { ModemCard } from '@/components/ui/ModemCard';
import { ModemDetailModal } from '@/components/modals/ModemDetailModal';
import { ModemFormModal } from '@/components/modals/ModemFormModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Toast, useToast } from '@/components/ui/Toast';
import { useColors } from '@/hooks/useApp';
import { useApp } from '@/hooks/useApp';
import { translations } from '@/constants/i18n';
import { MODEM_STATUS, STATUS_LABELS } from '@/constants/config';
import { Spacing, FontSize, BorderRadius } from '@/constants/theme';

export default function SearchScreen() {
  const colors = useColors();
  const { lang } = useApp();
  const tr = translations.search;
  const { toast, show: showToast, hide: hideToast } = useToast();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Modem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // الفلاتر
  const [filterStatus, setFilterStatus] = useState('');
  const [filterManufacturer, setFilterManufacturer] = useState('');
  const [filterNetworkId, setFilterNetworkId] = useState<number | undefined>();
  const [filterAreaId, setFilterAreaId] = useState<number | undefined>();

  // البيانات للفلاتر
  const [networks, setNetworks] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [manufacturers, setManufacturers] = useState<string[]>([]);

  // المودم المحدد
  const [viewModem, setViewModem] = useState<Modem | null>(null);
  const [editModem, setEditModem] = useState<Partial<Modem> | null>(null);
  const [showModemForm, setShowModemForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Modem | null>(null);

  React.useEffect(() => {
    const load = async () => {
      const [n, a, m] = await Promise.all([getNetworks(), getAreas(), getManufacturers()]);
      setNetworks(n); setAreas(a); setManufacturers(m);
    };
    load();
  }, []);

  const doSearch = useCallback(async () => {
    setLoading(true);
    setSearched(true);
    try {
      const r = await searchModems(query, {
        status: filterStatus || undefined,
        manufacturer: filterManufacturer || undefined,
        networkId: filterNetworkId,
        areaId: filterAreaId,
      });
      setResults(r);
    } finally { setLoading(false); }
  }, [query, filterStatus, filterManufacturer, filterNetworkId, filterAreaId]);

  const clearFilters = () => {
    setFilterStatus(''); setFilterManufacturer('');
    setFilterNetworkId(undefined); setFilterAreaId(undefined);
  };

  const activeFilterCount = [filterStatus, filterManufacturer, filterNetworkId, filterAreaId].filter(Boolean).length;

  const handleSaveModem = async (data: Partial<Modem>) => {
    if (editModem?.id) {
      await updateModem(editModem.id, data as any);
      await doSearch();
      showToast(lang === 'ar' ? 'تم التحديث' : 'Updated', 'success');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteModem(deleteTarget.id);
    await doSearch();
    setDeleteTarget(null);
    showToast(lang === 'ar' ? 'تم الحذف' : 'Deleted', 'success');
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      {/* الرأس */}
      <View style={[styles.header, { backgroundColor: colors.header, borderBottomColor: colors.cardBorder }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{tr.title[lang]}</Text>
      </View>

      {/* شريط البحث */}
      <View style={[styles.searchBar, { backgroundColor: colors.surface, borderBottomColor: colors.cardBorder }]}>
        <View style={[styles.searchInput, { backgroundColor: colors.surfaceVariant, borderColor: colors.cardBorder }]}>
          <MaterialIcons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder={tr.placeholder[lang]}
            placeholderTextColor={colors.textSecondary}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={doSearch}
            returnKeyType="search"
          />
          {query ? (
            <Pressable onPress={() => { setQuery(''); setResults([]); setSearched(false); }}>
              <MaterialIcons name="close" size={18} color={colors.textSecondary} />
            </Pressable>
          ) : null}
        </View>

        <Pressable
          style={[styles.filterBtn, { backgroundColor: activeFilterCount > 0 ? colors.primary : colors.surfaceVariant }]}
          onPress={() => setShowFilters(p => !p)}
        >
          <MaterialIcons name="tune" size={20} color={activeFilterCount > 0 ? '#fff' : colors.textSecondary} />
          {activeFilterCount > 0 ? (
            <View style={styles.filterBadge}><Text style={styles.filterBadgeText}>{activeFilterCount}</Text></View>
          ) : null}
        </Pressable>

        <Pressable style={[styles.searchBtn, { backgroundColor: colors.primary }]} onPress={doSearch}>
          <Text style={styles.searchBtnText}>{lang === 'ar' ? 'بحث' : 'Search'}</Text>
        </Pressable>
      </View>

      {/* الفلاتر */}
      {showFilters ? (
        <View style={[styles.filtersPanel, { backgroundColor: colors.surface, borderBottomColor: colors.cardBorder }]}>
          <View style={styles.filterRow}>
            <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>{lang === 'ar' ? 'الحالة' : 'Status'}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row', gap: 6 }}>
              {['', ...Object.keys(MODEM_STATUS)].map(s => (
                <Pressable
                  key={s}
                  style={[styles.chip, { borderColor: filterStatus === s ? colors.primary : colors.cardBorder, backgroundColor: filterStatus === s ? colors.primary + '20' : 'transparent' }]}
                  onPress={() => setFilterStatus(s)}
                >
                  <Text style={[styles.chipText, { color: filterStatus === s ? colors.primary : colors.textSecondary }]}>
                    {s === '' ? (lang === 'ar' ? 'الكل' : 'All') : STATUS_LABELS[s]?.[lang] || s}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <View style={styles.filterRow}>
            <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>{lang === 'ar' ? 'الشبكة' : 'Network'}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row', gap: 6 }}>
              {[{ id: undefined, name: lang === 'ar' ? 'الكل' : 'All' }, ...networks].map(n => (
                <Pressable
                  key={String(n.id)}
                  style={[styles.chip, { borderColor: filterNetworkId === n.id ? colors.accent : colors.cardBorder, backgroundColor: filterNetworkId === n.id ? colors.accent + '20' : 'transparent' }]}
                  onPress={() => setFilterNetworkId(n.id)}
                >
                  <Text style={[styles.chipText, { color: filterNetworkId === n.id ? colors.accent : colors.textSecondary }]}>{n.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {activeFilterCount > 0 ? (
            <Pressable onPress={clearFilters} style={styles.clearBtn}>
              <MaterialIcons name="clear-all" size={16} color={colors.error} />
              <Text style={[styles.clearText, { color: colors.error }]}>{tr.clearFilters[lang]}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {/* النتائج */}
      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={i => String(i.id)}
          renderItem={({ item }) => (
            <ModemCard
              modem={item}
              onPress={() => setViewModem(item)}
              onEdit={() => { setEditModem(item); setViewModem(null); setShowModemForm(true); }}
              onDelete={() => setDeleteTarget(item)}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={searched && !loading ? (
            <Text style={[styles.resultsCount, { color: colors.textSecondary }]}>
              {results.length} {tr.results[lang]}
            </Text>
          ) : null}
          ListEmptyComponent={searched ? (
            <View style={styles.empty}>
              <MaterialIcons name="search-off" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {lang === 'ar' ? 'لا توجد نتائج' : 'No results found'}
              </Text>
            </View>
          ) : (
            <View style={styles.hint}>
              <MaterialIcons name="search" size={56} color={colors.primary + '40'} />
              <Text style={[styles.hintText, { color: colors.textSecondary }]}>
                {lang === 'ar' ? 'ابحث بالاسم، IP، MAC، الهاتف، الرقم التسلسلي...' : 'Search by name, IP, MAC, phone, serial...'}
              </Text>
            </View>
          )}
        />
      )}

      <ModemDetailModal visible={!!viewModem} modem={viewModem} onClose={() => setViewModem(null)}
        onEdit={() => { setEditModem(viewModem); setViewModem(null); setShowModemForm(true); }} />

      <ModemFormModal visible={showModemForm} modem={editModem} areas={areas}
        onSave={handleSaveModem} onClose={() => setShowModemForm(false)} />

      <ConfirmDialog visible={!!deleteTarget}
        title={translations.common.delete[lang]}
        message={translations.modem.deleteConfirm[lang]}
        onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />

      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hideToast} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { padding: Spacing.md, borderBottomWidth: 1 },
  headerTitle: { fontSize: FontSize.xl, fontWeight: '700' },
  searchBar: { flexDirection: 'row', padding: Spacing.md, gap: Spacing.sm, borderBottomWidth: 1, alignItems: 'center' },
  searchInput: { flex: 1, flexDirection: 'row', alignItems: 'center', borderRadius: BorderRadius.md, borderWidth: 1, paddingHorizontal: 12, gap: 8, height: 44 },
  input: { flex: 1, fontSize: FontSize.md, includeFontPadding: false },
  filterBtn: { width: 44, height: 44, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  filterBadge: { position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: 8, backgroundColor: '#FF4D4D', alignItems: 'center', justifyContent: 'center' },
  filterBadgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  searchBtn: { paddingHorizontal: 16, height: 44, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  searchBtnText: { color: '#fff', fontWeight: '700', fontSize: FontSize.md },
  filtersPanel: { padding: Spacing.md, borderBottomWidth: 1, gap: Spacing.sm },
  filterRow: { gap: 6 },
  filterLabel: { fontSize: FontSize.sm, fontWeight: '500' },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: FontSize.sm, fontWeight: '500' },
  clearBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-end' },
  clearText: { fontSize: FontSize.sm, fontWeight: '600' },
  list: { padding: Spacing.md, flexGrow: 1 },
  resultsCount: { fontSize: FontSize.sm, marginBottom: Spacing.sm },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: FontSize.md },
  hint: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 16, paddingHorizontal: 40 },
  hintText: { fontSize: FontSize.md, textAlign: 'center', lineHeight: 24 },
});
