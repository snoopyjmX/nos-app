import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/core/supabase';
import { logger } from '@/lib/core/logger';
import { MemoryItem, MemberProfile } from '../types';
import { resolveBatchMemoryUrls } from '../utils/storage';
import { getFirstName } from '../utils/formatting';

const PAGE_SIZE = 20;
let cachedMemories: MemoryItem[] | null = null;

export function useMemories(coupleId?: string | null, user?: any) {
  const [memories, setMemories] = useState<MemoryItem[]>(() => cachedMemories || []);
  const [loading, setLoading] = useState(() => !cachedMemories);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profileMap, setProfileMap] = useState<Map<string, MemberProfile>>(new Map());

  const loadMemberProfiles = useCallback(async () => {
    if (!coupleId) return;
    try {
      const { data: members } = await supabase
        .from('couple_members')
        .select('user_id')
        .eq('couple_id', coupleId);

      const userIds = new Set<string>();
      if (user?.id) userIds.add(user.id);
      (members || []).forEach((m) => {
        if (m.user_id) userIds.add(m.user_id);
      });

      if (userIds.size === 0) return;

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, push_token')
        .in('id', Array.from(userIds));

      const map = new Map<string, MemberProfile>();
      if (profiles && profiles.length > 0) {
        profiles.forEach((p) => {
          map.set(p.id, {
            name: getFirstName(p.display_name) || (p.id === user?.id ? 'Você' : 'Amor'),
            push_token: (p as any).push_token || null,
          });
        });
      }
      setProfileMap(map);
    } catch (err) {
      logger.warn('Erro ao carregar perfis para memórias:', err);
    }
  }, [coupleId, user?.id]);

  const loadMemories = useCallback(async (silent = false) => {
    if (!coupleId) return;
    try {
      if (!silent && !cachedMemories) setLoading(true);

      let { data, error } = await supabase
        .from('memories')
        .select('id, couple_id, title, memory_date, image_url, thumb_path, created_at, created_by')
        .eq('couple_id', coupleId)
        .order('memory_date', { ascending: false })
        .order('id', { ascending: false })
        .limit(PAGE_SIZE);

      if (error && (error.code === '42703' || error.message?.includes('thumb_path'))) {
        const fallback = await supabase
          .from('memories')
          .select('id, couple_id, title, memory_date, image_url, created_at, created_by')
          .eq('couple_id', coupleId)
          .order('memory_date', { ascending: false })
          .order('id', { ascending: false })
          .limit(PAGE_SIZE);
        data = (fallback.data as any) || null;
        error = fallback.error;
      }

      if (error) throw error;

      const rawList = data || [];
      setHasMore(rawList.length === PAGE_SIZE);

      const resolvedList = await resolveBatchMemoryUrls(rawList);

      setMemories((prevList) => {
        const optimisticItems = prevList.filter(
          (p) => p.id.startsWith('local-') && !resolvedList.some((n) => n.image_url === p.image_url)
        );
        const mergedList = resolvedList.map((newItem) => {
          const localMatch = prevList.find(
            (p) => (p.image_url === newItem.image_url || (p.title === newItem.title && p.memory_date === newItem.memory_date)) &&
                   p.displayUrl &&
                   (p.displayUrl.startsWith('file:') || p.displayUrl.startsWith('data:') || p.displayUrl.startsWith('blob:'))
          );
          if (localMatch && (!newItem.displayUrl || !newItem.displayUrl.startsWith('http'))) {
            return {
              ...newItem,
              displayUrl: localMatch.displayUrl,
              displayThumbUrl: localMatch.displayThumbUrl || localMatch.displayUrl,
            };
          }
          return newItem;
        });
        const combined = [...optimisticItems, ...mergedList];
        cachedMemories = combined;
        return combined;
      });
    } catch (err) {
      logger.warn('Erro ao carregar memórias:', err);
    } finally {
      setLoading(false);
    }
  }, [coupleId]);

  const loadMoreMemories = useCallback(async () => {
    if (!coupleId || loading || loadingMore || !hasMore) return;

    const lastPersisted = [...memories].reverse().find((m) => !m.id.startsWith('local-'));
    if (!lastPersisted) return;

    try {
      setLoadingMore(true);

      const lastDate = lastPersisted.memory_date;
      const lastId = lastPersisted.id;

      let { data, error } = await supabase
        .from('memories')
        .select('id, couple_id, title, memory_date, image_url, thumb_path, created_at, created_by')
        .eq('couple_id', coupleId)
        .or(`memory_date.lt.${lastDate},and(memory_date.eq.${lastDate},id.lt.${lastId})`)
        .order('memory_date', { ascending: false })
        .order('id', { ascending: false })
        .limit(PAGE_SIZE);

      if (error && (error.code === '42703' || error.message?.includes('thumb_path'))) {
        const fallback = await supabase
          .from('memories')
          .select('id, couple_id, title, memory_date, image_url, created_at, created_by')
          .eq('couple_id', coupleId)
          .or(`memory_date.lt.${lastDate},and(memory_date.eq.${lastDate},id.lt.${lastId})`)
          .order('memory_date', { ascending: false })
          .order('id', { ascending: false })
          .limit(PAGE_SIZE);
        data = (fallback.data as any) || null;
        error = fallback.error;
      }

      if (error) throw error;

      const rawList = data || [];
      if (rawList.length < PAGE_SIZE) setHasMore(false);

      if (rawList.length > 0) {
        const resolvedList = await resolveBatchMemoryUrls(rawList);
        setMemories((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const uniqueNew = resolvedList.filter((m) => !existingIds.has(m.id));
          return [...prev, ...uniqueNew];
        });
      }
    } catch {
      // Falha silenciosa
    } finally {
      setLoadingMore(false);
    }
  }, [coupleId, loading, loadingMore, hasMore, memories]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setHasMore(true);
    await Promise.all([loadMemories(true), loadMemberProfiles()]);
    setRefreshing(false);
  }, [loadMemories, loadMemberProfiles]);

  useEffect(() => {
    if (!coupleId) return;

    loadMemberProfiles();
    loadMemories();

    const channel = supabase
      .channel(`memories_tab_${coupleId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'memories',
          filter: `couple_id=eq.${coupleId}`,
        },
        () => {
          loadMemories(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [coupleId, loadMemberProfiles, loadMemories]);

  return {
    memories,
    setMemories,
    loading,
    loadingMore,
    hasMore,
    refreshing,
    profileMap,
    loadMoreMemories,
    onRefresh,
    loadMemories,
  };
}
