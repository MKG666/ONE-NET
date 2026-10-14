// هوك إدارة الشبكات
import { useState, useEffect, useCallback } from 'react';
import * as DB from '@/services/database';
import { useApp } from './useApp';

export function useNetworks() {
  const [networks, setNetworks] = useState<DB.Network[]>([]);
  const [loading, setLoading] = useState(false);
  const { refreshTrigger } = useApp();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await DB.getNetworks();
      setNetworks(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load, refreshTrigger]);

  const createNetwork = async (name: string, desc?: string) => {
    await DB.createNetwork(name, desc);
    await load();
  };

  const updateNetwork = async (id: number, name: string, desc?: string) => {
    await DB.updateNetwork(id, name, desc);
    await load();
  };

  const deleteNetwork = async (id: number) => {
    await DB.deleteNetwork(id);
    await load();
  };

  return { networks, loading, reload: load, createNetwork, updateNetwork, deleteNetwork };
}

export function useAreas(networkId?: number) {
  const [areas, setAreas] = useState<DB.Area[]>([]);
  const [loading, setLoading] = useState(false);
  const { refreshTrigger } = useApp();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await DB.getAreas(networkId);
      setAreas(data);
    } finally {
      setLoading(false);
    }
  }, [networkId]);

  useEffect(() => { load(); }, [load, refreshTrigger]);

  const createArea = async (name: string, desc?: string) => {
    if (!networkId) return;
    await DB.createArea(networkId, name, desc);
    await load();
  };

  const updateArea = async (id: number, name: string, desc?: string) => {
    await DB.updateArea(id, name, desc);
    await load();
  };

  const deleteArea = async (id: number) => {
    await DB.deleteArea(id);
    await load();
  };

  return { areas, loading, reload: load, createArea, updateArea, deleteArea };
}

export function useModems(areaId?: number) {
  const [modems, setModems] = useState<DB.Modem[]>([]);
  const [loading, setLoading] = useState(false);
  const { refreshTrigger } = useApp();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await DB.getModems(areaId);
      setModems(data);
    } finally {
      setLoading(false);
    }
  }, [areaId]);

  useEffect(() => { load(); }, [load, refreshTrigger]);

  return { modems, loading, reload: load };
}

export function useDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { refreshTrigger } = useApp();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await DB.getDashboardStats();
      setStats(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load, refreshTrigger]);

  return { stats, loading, reload: load };
}
