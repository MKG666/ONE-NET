// طبقة قاعدة البيانات - SQLite
import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

// فتح/إنشاء قاعدة البيانات
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('net_manager.db');
    await initializeDatabase(db);
  }
  return db;
}

// إنشاء الجداول
async function initializeDatabase(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS networks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS areas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      network_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (network_id) REFERENCES networks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS modems (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      area_id INTEGER NOT NULL,
      mesh_id TEXT,
      name TEXT NOT NULL,
      manufacturer TEXT,
      ip TEXT,
      mac TEXT,
      vlan INTEGER,
      admin_user TEXT,
      admin_pass TEXT,
      ssid TEXT,
      wifi_pass TEXT,
      serial TEXT,
      subscriber_name TEXT,
      subscriber_phone TEXT,
      latitude REAL,
      longitude REAL,
      install_date TEXT,
      notes TEXT,
      status TEXT DEFAULT 'active',
      photos TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (area_id) REFERENCES areas(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS manufacturers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    );

    CREATE INDEX IF NOT EXISTS idx_modems_ip ON modems(ip);
    CREATE INDEX IF NOT EXISTS idx_modems_mac ON modems(mac);
    CREATE INDEX IF NOT EXISTS idx_modems_phone ON modems(subscriber_phone);
    CREATE INDEX IF NOT EXISTS idx_modems_area ON modems(area_id);
    CREATE INDEX IF NOT EXISTS idx_areas_network ON areas(network_id);
  `);

  // إدراج الشركات الافتراضية
  const mfrs = await database.getAllAsync<{ count: number }>('SELECT COUNT(*) as count FROM manufacturers');
  if (mfrs[0]?.count === 0) {
    const defaults = ['Huawei','TP-Link','Mikrotik','ZTE','Cisco','D-Link','Ubiquiti','Asus','Netgear','Tenda','Ruijie','H3C','Nokia','Calix','Other'];
    for (const m of defaults) {
      await database.runAsync('INSERT OR IGNORE INTO manufacturers (name) VALUES (?)', [m]);
    }
  }
}

// ══════════════════════════════════════
// عمليات الشبكات
// ══════════════════════════════════════
export interface Network {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  area_count?: number;
  modem_count?: number;
}

export async function getNetworks(): Promise<Network[]> {
  const database = await getDatabase();
  return database.getAllAsync<Network>(`
    SELECT n.*, 
      (SELECT COUNT(*) FROM areas WHERE network_id = n.id) as area_count,
      (SELECT COUNT(*) FROM modems m JOIN areas a ON m.area_id = a.id WHERE a.network_id = n.id) as modem_count
    FROM networks n
    ORDER BY n.created_at DESC
  `);
}

export async function createNetwork(name: string, description?: string): Promise<number> {
  const database = await getDatabase();
  const result = await database.runAsync(
    'INSERT INTO networks (name, description) VALUES (?, ?)',
    [name, description || null]
  );
  return result.lastInsertRowId;
}

export async function updateNetwork(id: number, name: string, description?: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    'UPDATE networks SET name = ?, description = ? WHERE id = ?',
    [name, description || null, id]
  );
}

export async function deleteNetwork(id: number): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM networks WHERE id = ?', [id]);
}

// ══════════════════════════════════════
// عمليات المناطق
// ══════════════════════════════════════
export interface Area {
  id: number;
  network_id: number;
  name: string;
  description?: string;
  created_at: string;
  modem_count?: number;
  network_name?: string;
}

export async function getAreas(networkId?: number): Promise<Area[]> {
  const database = await getDatabase();
  if (networkId) {
    return database.getAllAsync<Area>(`
      SELECT a.*, n.name as network_name,
        (SELECT COUNT(*) FROM modems WHERE area_id = a.id) as modem_count
      FROM areas a
      JOIN networks n ON a.network_id = n.id
      WHERE a.network_id = ?
      ORDER BY a.created_at DESC
    `, [networkId]);
  }
  return database.getAllAsync<Area>(`
    SELECT a.*, n.name as network_name,
      (SELECT COUNT(*) FROM modems WHERE area_id = a.id) as modem_count
    FROM areas a
    JOIN networks n ON a.network_id = n.id
    ORDER BY n.name, a.name
  `);
}

export async function createArea(networkId: number, name: string, description?: string): Promise<number> {
  const database = await getDatabase();
  const result = await database.runAsync(
    'INSERT INTO areas (network_id, name, description) VALUES (?, ?, ?)',
    [networkId, name, description || null]
  );
  return result.lastInsertRowId;
}

export async function updateArea(id: number, name: string, description?: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    'UPDATE areas SET name = ?, description = ? WHERE id = ?',
    [name, description || null, id]
  );
}

export async function deleteArea(id: number): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM areas WHERE id = ?', [id]);
}

// ══════════════════════════════════════
// عمليات المودمات
// ══════════════════════════════════════
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

export async function getModems(areaId?: number): Promise<Modem[]> {
  const database = await getDatabase();
  if (areaId) {
    return database.getAllAsync<Modem>(`
      SELECT m.*, a.name as area_name, a.network_id, n.name as network_name
      FROM modems m
      JOIN areas a ON m.area_id = a.id
      JOIN networks n ON a.network_id = n.id
      WHERE m.area_id = ?
      ORDER BY m.created_at DESC
    `, [areaId]);
  }
  return database.getAllAsync<Modem>(`
    SELECT m.*, a.name as area_name, a.network_id, n.name as network_name
    FROM modems m
    JOIN areas a ON m.area_id = a.id
    JOIN networks n ON a.network_id = n.id
    ORDER BY m.created_at DESC
  `);
}

export async function getModemById(id: number): Promise<Modem | null> {
  const database = await getDatabase();
  const results = await database.getAllAsync<Modem>(`
    SELECT m.*, a.name as area_name, a.network_id, n.name as network_name
    FROM modems m
    JOIN areas a ON m.area_id = a.id
    JOIN networks n ON a.network_id = n.id
    WHERE m.id = ?
  `, [id]);
  return results[0] || null;
}

export async function createModem(modem: Omit<Modem, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
  const database = await getDatabase();
  const result = await database.runAsync(`
    INSERT INTO modems (area_id, mesh_id, name, manufacturer, ip, mac, vlan, admin_user, admin_pass, ssid, wifi_pass, serial, subscriber_name, subscriber_phone, latitude, longitude, install_date, notes, status, photos)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    modem.area_id, modem.mesh_id || null, modem.name, modem.manufacturer || null,
    modem.ip || null, modem.mac || null, modem.vlan || null,
    modem.admin_user || null, modem.admin_pass || null,
    modem.ssid || null, modem.wifi_pass || null, modem.serial || null,
    modem.subscriber_name || null, modem.subscriber_phone || null,
    modem.latitude || null, modem.longitude || null,
    modem.install_date || null, modem.notes || null,
    modem.status || 'active', modem.photos || '[]'
  ]);
  return result.lastInsertRowId;
}

export async function updateModem(id: number, modem: Partial<Modem>): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(`
    UPDATE modems SET
      area_id = ?, mesh_id = ?, name = ?, manufacturer = ?, ip = ?, mac = ?,
      vlan = ?, admin_user = ?, admin_pass = ?, ssid = ?, wifi_pass = ?,
      serial = ?, subscriber_name = ?, subscriber_phone = ?,
      latitude = ?, longitude = ?, install_date = ?, notes = ?,
      status = ?, photos = ?, updated_at = datetime('now')
    WHERE id = ?
  `, [
    modem.area_id!, modem.mesh_id || null, modem.name!, modem.manufacturer || null,
    modem.ip || null, modem.mac || null, modem.vlan || null,
    modem.admin_user || null, modem.admin_pass || null,
    modem.ssid || null, modem.wifi_pass || null, modem.serial || null,
    modem.subscriber_name || null, modem.subscriber_phone || null,
    modem.latitude || null, modem.longitude || null,
    modem.install_date || null, modem.notes || null,
    modem.status || 'active', modem.photos || '[]', id
  ]);
}

export async function deleteModem(id: number): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM modems WHERE id = ?', [id]);
}

// البحث في المودمات
export async function searchModems(query: string, filters?: {
  status?: string;
  manufacturer?: string;
  networkId?: number;
  areaId?: number;
  vlan?: number;
}): Promise<Modem[]> {
  const database = await getDatabase();
  let sql = `
    SELECT m.*, a.name as area_name, a.network_id, n.name as network_name
    FROM modems m
    JOIN areas a ON m.area_id = a.id
    JOIN networks n ON a.network_id = n.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (query) {
    sql += ` AND (m.name LIKE ? OR m.ip LIKE ? OR m.mac LIKE ? OR m.subscriber_phone LIKE ? OR m.subscriber_name LIKE ? OR m.serial LIKE ? OR m.mesh_id LIKE ?)`;
    const q = `%${query}%`;
    params.push(q, q, q, q, q, q, q);
  }
  if (filters?.status) { sql += ` AND m.status = ?`; params.push(filters.status); }
  if (filters?.manufacturer) { sql += ` AND m.manufacturer = ?`; params.push(filters.manufacturer); }
  if (filters?.networkId) { sql += ` AND a.network_id = ?`; params.push(filters.networkId); }
  if (filters?.areaId) { sql += ` AND m.area_id = ?`; params.push(filters.areaId); }
  if (filters?.vlan !== undefined) { sql += ` AND m.vlan = ?`; params.push(filters.vlan); }

  sql += ` ORDER BY m.created_at DESC LIMIT 200`;
  return database.getAllAsync<Modem>(sql, params);
}

// التحقق من التكرار
export async function checkDuplicates(networkId: number, ip?: string, mac?: string, vlan?: number, excludeId?: number): Promise<{ ip: boolean; mac: boolean; vlan: boolean }> {
  const database = await getDatabase();
  const result = { ip: false, mac: false, vlan: false };
  const baseQuery = `
    FROM modems m JOIN areas a ON m.area_id = a.id
    WHERE a.network_id = ? AND m.id != ?
  `;
  const excl = excludeId || -1;

  if (ip) {
    const r = await database.getAllAsync<{ c: number }>(`SELECT COUNT(*) as c ${baseQuery} AND m.ip = ? AND m.ip != ''`, [networkId, excl, ip]);
    result.ip = (r[0]?.c || 0) > 0;
  }
  if (mac) {
    const r = await database.getAllAsync<{ c: number }>(`SELECT COUNT(*) as c ${baseQuery} AND m.mac = ? AND m.mac != ''`, [networkId, excl, mac]);
    result.mac = (r[0]?.c || 0) > 0;
  }
  if (vlan !== undefined && vlan > 0) {
    const r = await database.getAllAsync<{ c: number }>(`SELECT COUNT(*) as c ${baseQuery} AND m.vlan = ?`, [networkId, excl, vlan]);
    result.vlan = (r[0]?.c || 0) > 0;
  }
  return result;
}

// إحصائيات لوحة التحكم
export async function getDashboardStats() {
  const database = await getDatabase();
  const total = await database.getAllAsync<{ count: number }>('SELECT COUNT(*) as count FROM modems');
  const byStatus = await database.getAllAsync<{ status: string; count: number }>('SELECT status, COUNT(*) as count FROM modems GROUP BY status');
  const byNetwork = await database.getAllAsync<{ name: string; count: number }>(`
    SELECT n.name, COUNT(m.id) as count FROM networks n
    LEFT JOIN areas a ON a.network_id = n.id
    LEFT JOIN modems m ON m.area_id = a.id
    GROUP BY n.id, n.name
  `);
  const byArea = await database.getAllAsync<{ name: string; count: number }>(`
    SELECT a.name, COUNT(m.id) as count FROM areas a
    LEFT JOIN modems m ON m.area_id = a.id
    GROUP BY a.id, a.name
    ORDER BY count DESC LIMIT 10
  `);
  const byManufacturer = await database.getAllAsync<{ name: string; count: number }>(`
    SELECT COALESCE(manufacturer, 'Unknown') as name, COUNT(*) as count
    FROM modems GROUP BY manufacturer ORDER BY count DESC LIMIT 8
  `);
  const duplicateIPs = await database.getAllAsync<{ ip: string; count: number }>(`
    SELECT m.ip, COUNT(*) as count FROM modems m
    JOIN areas a ON m.area_id = a.id
    WHERE m.ip IS NOT NULL AND m.ip != ''
    GROUP BY a.network_id, m.ip HAVING count > 1
  `);
  const duplicateMACs = await database.getAllAsync<{ mac: string; count: number }>(`
    SELECT m.mac, COUNT(*) as count FROM modems m
    JOIN areas a ON m.area_id = a.id
    WHERE m.mac IS NOT NULL AND m.mac != ''
    GROUP BY a.network_id, m.mac HAVING count > 1
  `);

  return {
    total: total[0]?.count || 0,
    byStatus,
    byNetwork,
    byArea,
    byManufacturer,
    duplicateIPs,
    duplicateMACs,
  };
}

// قائمة الشركات
export async function getManufacturers(): Promise<string[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<{ name: string }>('SELECT name FROM manufacturers ORDER BY name');
  return rows.map(r => r.name);
}

export async function addManufacturer(name: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('INSERT OR IGNORE INTO manufacturers (name) VALUES (?)', [name]);
}

export async function deleteManufacturer(name: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM manufacturers WHERE name = ?', [name]);
}

// تصدير واستيراد قاعدة البيانات كـ JSON
export async function exportDatabaseJSON(): Promise<string> {
  const database = await getDatabase();
  const networks = await database.getAllAsync('SELECT * FROM networks');
  const areas = await database.getAllAsync('SELECT * FROM areas');
  const modems = await database.getAllAsync('SELECT * FROM modems');
  const manufacturers = await database.getAllAsync('SELECT * FROM manufacturers');
  return JSON.stringify({ networks, areas, modems, manufacturers, exportedAt: new Date().toISOString() }, null, 2);
}

export async function importDatabaseJSON(jsonStr: string): Promise<void> {
  const database = await getDatabase();
  const data = JSON.parse(jsonStr);
  await database.execAsync('DELETE FROM modems; DELETE FROM areas; DELETE FROM networks; DELETE FROM manufacturers;');
  for (const n of (data.networks || [])) {
    await database.runAsync('INSERT INTO networks (id, name, description, created_at) VALUES (?, ?, ?, ?)', [n.id, n.name, n.description, n.created_at]);
  }
  for (const a of (data.areas || [])) {
    await database.runAsync('INSERT INTO areas (id, network_id, name, description, created_at) VALUES (?, ?, ?, ?, ?)', [a.id, a.network_id, a.name, a.description, a.created_at]);
  }
  for (const m of (data.modems || [])) {
    await database.runAsync(`INSERT INTO modems VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [
      m.id, m.area_id, m.mesh_id, m.name, m.manufacturer, m.ip, m.mac, m.vlan,
      m.admin_user, m.admin_pass, m.ssid, m.wifi_pass, m.serial,
      m.subscriber_name, m.subscriber_phone, m.latitude, m.longitude,
      m.install_date, m.notes, m.status, m.photos, m.created_at, m.updated_at
    ]);
  }
  for (const mfr of (data.manufacturers || [])) {
    await database.runAsync('INSERT OR IGNORE INTO manufacturers (name) VALUES (?)', [mfr.name]);
  }
}
