// طبقة قاعدة البيانات - Web stub (بدون SQLite)
// يستخدم AsyncStorage بديلاً لـ SQLite على Web

import AsyncStorage from '@react-native-async-storage/async-storage';

// ══════════════════════════════════════
// أنواع البيانات
// ══════════════════════════════════════
export interface Network {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  area_count?: number;
  modem_count?: number;
}

export interface Area {
  id: number;
  network_id: number;
  name: string;
  description?: string;
  created_at: string;
  modem_count?: number;
  network_name?: string;
}

export interface Modem {
  id: number;
  area_id: number;
  mesh_id?: string;
  name: string;
  manufacturer?: string;
  ip?: string;
  mac?: string;
  vlan?: number;
  admin_user?: string;
  admin_pass?: string;
  ssid?: string;
  wifi_pass?: string;
  serial?: string;
  subscriber_name?: string;
  subscriber_phone?: string;
  latitude?: number;
  longitude?: number;
  install_date?: string;
  notes?: string;
  status: string;
  photos: string;
  created_at: string;
  updated_at: string;
  area_name?: string;
  network_id?: number;
  network_name?: string;
}

// ══════════════════════════════════════
// مساعدات التخزين
// ══════════════════════════════════════
async function getStore<T>(key: string): Promise<T[]> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

async function setStore<T>(key: string, data: T[]): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(data));
}

async function nextId(key: string): Promise<number> {
  const items: any[] = await getStore(key);
  return items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1;
}

const now = () => new Date().toISOString().replace('T', ' ').substring(0, 19);

// ══════════════════════════════════════
// الشبكات
// ══════════════════════════════════════
export async function getNetworks(): Promise<Network[]> {
  const networks: Network[] = await getStore('networks');
  const areas: Area[] = await getStore('areas');
  const modems: Modem[] = await getStore('modems');
  return networks.map(n => ({
    ...n,
    area_count: areas.filter(a => a.network_id === n.id).length,
    modem_count: modems.filter(m => areas.find(a => a.id === m.area_id)?.network_id === n.id).length,
  })).sort((a, b) => b.id - a.id);
}

export async function createNetwork(name: string, description?: string): Promise<number> {
  const networks: Network[] = await getStore('networks');
  const id = await nextId('networks');
  networks.push({ id, name, description, created_at: now() });
  await setStore('networks', networks);
  return id;
}

export async function updateNetwork(id: number, name: string, description?: string): Promise<void> {
  const networks: Network[] = await getStore('networks');
  const idx = networks.findIndex(n => n.id === id);
  if (idx >= 0) { networks[idx] = { ...networks[idx], name, description }; await setStore('networks', networks); }
}

export async function deleteNetwork(id: number): Promise<void> {
  const networks: Network[] = await getStore('networks');
  await setStore('networks', networks.filter(n => n.id !== id));
  const areas: Area[] = await getStore('areas');
  const deletedAreaIds = areas.filter(a => a.network_id === id).map(a => a.id);
  await setStore('areas', areas.filter(a => a.network_id !== id));
  const modems: Modem[] = await getStore('modems');
  await setStore('modems', modems.filter(m => !deletedAreaIds.includes(m.area_id)));
}

// ══════════════════════════════════════
// المناطق
// ══════════════════════════════════════
export async function getAreas(networkId?: number): Promise<Area[]> {
  const areas: Area[] = await getStore('areas');
  const networks: Network[] = await getStore('networks');
  const modems: Modem[] = await getStore('modems');
  let result = areas.map(a => ({
    ...a,
    network_name: networks.find(n => n.id === a.network_id)?.name,
    modem_count: modems.filter(m => m.area_id === a.id).length,
  }));
  if (networkId) result = result.filter(a => a.network_id === networkId);
  return result.sort((a, b) => b.id - a.id);
}

export async function createArea(networkId: number, name: string, description?: string): Promise<number> {
  const areas: Area[] = await getStore('areas');
  const id = await nextId('areas');
  areas.push({ id, network_id: networkId, name, description, created_at: now() });
  await setStore('areas', areas);
  return id;
}

export async function updateArea(id: number, name: string, description?: string): Promise<void> {
  const areas: Area[] = await getStore('areas');
  const idx = areas.findIndex(a => a.id === id);
  if (idx >= 0) { areas[idx] = { ...areas[idx], name, description }; await setStore('areas', areas); }
}

export async function deleteArea(id: number): Promise<void> {
  const areas: Area[] = await getStore('areas');
  await setStore('areas', areas.filter(a => a.id !== id));
  const modems: Modem[] = await getStore('modems');
  await setStore('modems', modems.filter(m => m.area_id !== id));
}

// ══════════════════════════════════════
// المودمات
// ══════════════════════════════════════
export async function getModems(areaId?: number): Promise<Modem[]> {
  const modems: Modem[] = await getStore('modems');
  const areas: Area[] = await getStore('areas');
  const networks: Network[] = await getStore('networks');
  let result = modems.map(m => {
    const area = areas.find(a => a.id === m.area_id);
    const network = networks.find(n => n.id === area?.network_id);
    return { ...m, area_name: area?.name, network_id: area?.network_id, network_name: network?.name };
  });
  if (areaId) result = result.filter(m => m.area_id === areaId);
  return result.sort((a, b) => b.id - a.id);
}

export async function getModemById(id: number): Promise<Modem | null> {
  const modems = await getModems();
  return modems.find(m => m.id === id) || null;
}

export async function createModem(modem: Omit<Modem, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
  const modems: Modem[] = await getStore('modems');
  const id = await nextId('modems');
  modems.push({ ...modem, id, created_at: now(), updated_at: now() } as Modem);
  await setStore('modems', modems);
  return id;
}

export async function updateModem(id: number, modem: Partial<Modem>): Promise<void> {
  const modems: Modem[] = await getStore('modems');
  const idx = modems.findIndex(m => m.id === id);
  if (idx >= 0) { modems[idx] = { ...modems[idx], ...modem, id, updated_at: now() }; await setStore('modems', modems); }
}

export async function deleteModem(id: number): Promise<void> {
  const modems: Modem[] = await getStore('modems');
  await setStore('modems', modems.filter(m => m.id !== id));
}

export async function searchModems(query: string, filters?: {
  status?: string; manufacturer?: string; networkId?: number; areaId?: number; vlan?: number;
}): Promise<Modem[]> {
  let modems = await getModems();
  if (query) {
    const q = query.toLowerCase();
    modems = modems.filter(m =>
      m.name?.toLowerCase().includes(q) || m.ip?.includes(q) || m.mac?.toLowerCase().includes(q) ||
      m.subscriber_phone?.includes(q) || m.subscriber_name?.toLowerCase().includes(q) ||
      m.serial?.toLowerCase().includes(q) || m.mesh_id?.toLowerCase().includes(q)
    );
  }
  if (filters?.status) modems = modems.filter(m => m.status === filters.status);
  if (filters?.manufacturer) modems = modems.filter(m => m.manufacturer === filters.manufacturer);
  if (filters?.networkId) modems = modems.filter(m => m.network_id === filters.networkId);
  if (filters?.areaId) modems = modems.filter(m => m.area_id === filters.areaId);
  if (filters?.vlan !== undefined) modems = modems.filter(m => m.vlan === filters.vlan);
  return modems.slice(0, 200);
}

export async function checkDuplicates(networkId: number, ip?: string, mac?: string, vlan?: number, excludeId?: number): Promise<{ ip: boolean; mac: boolean; vlan: boolean }> {
  const modems = await getModems();
  const sameNet = modems.filter(m => m.network_id === networkId && m.id !== excludeId);
  return {
    ip: ip ? sameNet.some(m => m.ip === ip && ip !== '') : false,
    mac: mac ? sameNet.some(m => m.mac === mac && mac !== '') : false,
    vlan: vlan ? sameNet.some(m => m.vlan === vlan) : false,
  };
}

export async function getDashboardStats() {
  const modems = await getModems();
  const areas = await getAreas();
  const networks = await getNetworks();
  const manufacturers: string[] = [...new Set(modems.map(m => m.manufacturer || 'Unknown'))];

  const byStatus = ['active', 'inactive', 'maintenance', 'disconnected'].map(s => ({
    status: s, count: modems.filter(m => m.status === s).length
  }));
  const byNetwork = networks.map(n => ({ name: n.name, count: n.modem_count || 0 }));
  const byArea = areas.map(a => ({ name: a.name, count: a.modem_count || 0 })).sort((a, b) => b.count - a.count).slice(0, 10);
  const mfrCounts = manufacturers.map(mfr => ({ name: mfr, count: modems.filter(m => (m.manufacturer || 'Unknown') === mfr).length })).sort((a, b) => b.count - a.count).slice(0, 8);

  // تكرار IP
  const ipGroups: Record<string, number> = {};
  modems.forEach(m => { if (m.ip) ipGroups[`${m.network_id}_${m.ip}`] = (ipGroups[`${m.network_id}_${m.ip}`] || 0) + 1; });
  const duplicateIPs = Object.entries(ipGroups).filter(([, c]) => c > 1).map(([k, count]) => ({ ip: k.split('_')[1], count }));

  const macGroups: Record<string, number> = {};
  modems.forEach(m => { if (m.mac) macGroups[`${m.network_id}_${m.mac}`] = (macGroups[`${m.network_id}_${m.mac}`] || 0) + 1; });
  const duplicateMACs = Object.entries(macGroups).filter(([, c]) => c > 1).map(([k, count]) => ({ mac: k.split('_')[1], count }));

  return { total: modems.length, byStatus, byNetwork, byArea, byManufacturer: mfrCounts, duplicateIPs, duplicateMACs };
}

export async function getManufacturers(): Promise<string[]> {
  const stored = await getStore<{ name: string }>('manufacturers');
  if (stored.length === 0) {
    const defaults = ['Huawei','TP-Link','Mikrotik','ZTE','Cisco','D-Link','Ubiquiti','Asus','Netgear','Tenda','Ruijie','H3C','Nokia','Calix','Other'];
    await setStore('manufacturers', defaults.map(name => ({ name })));
    return defaults;
  }
  return stored.map(m => m.name).sort();
}

export async function addManufacturer(name: string): Promise<void> {
  const stored = await getStore<{ name: string }>('manufacturers');
  if (!stored.find(m => m.name === name)) { stored.push({ name }); await setStore('manufacturers', stored); }
}

export async function deleteManufacturer(name: string): Promise<void> {
  const stored = await getStore<{ name: string }>('manufacturers');
  await setStore('manufacturers', stored.filter(m => m.name !== name));
}

export async function exportDatabaseJSON(): Promise<string> {
  const [networks, areas, modems, manufacturers] = await Promise.all([
    getStore('networks'), getStore('areas'), getStore('modems'), getStore('manufacturers')
  ]);
  return JSON.stringify({ networks, areas, modems, manufacturers, exportedAt: new Date().toISOString() }, null, 2);
}

export async function importDatabaseJSON(jsonStr: string): Promise<void> {
  const data = JSON.parse(jsonStr);
  await Promise.all([
    setStore('networks', data.networks || []),
    setStore('areas', data.areas || []),
    setStore('modems', data.modems || []),
    setStore('manufacturers', data.manufacturers || []),
  ]);
}

// تهيئة (لا شيء مطلوب على Web)
export async function getDatabase() { return null; }
