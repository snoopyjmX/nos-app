import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/lib/core/supabase';
import { getFirstName } from '@/features/profile/utils/formatting';
import { RecentMemory, LatestMessage, NextMilestone } from '../types';

let homeDataCache: {
  coupleTitle: string;
  ownerFirstName: string;
  partnerFirstName: string;
  effectiveStartDateStr: string | null;
  recentMemory: RecentMemory | null;
  throwbackMemory: any;
  latestMessage: LatestMessage | null;
  nextMilestone: NextMilestone | null;
} | null = null;

export function clearHomeDataCache() {
  homeDataCache = null;
}

export function useHomeData(coupleId: string | null, user: any) {
  const [coupleTitle, setCoupleTitle] = useState<string>(() => homeDataCache?.coupleTitle || 'Você & Meu Amor');
  const [ownerFirstName, setOwnerFirstName] = useState<string>(
    () => homeDataCache?.ownerFirstName || getFirstName(user?.user_metadata?.display_name || user?.email?.split('@')[0]) || ''
  );
  const [partnerFirstName, setPartnerFirstName] = useState<string>(() => homeDataCache?.partnerFirstName || '');
  const [effectiveStartDateStr, setEffectiveStartDateStr] = useState<string | null>(() => homeDataCache?.effectiveStartDateStr ?? null);
  const [recentMemory, setRecentMemory] = useState<RecentMemory | null>(() => homeDataCache?.recentMemory ?? null);
  const [throwbackMemory, setThrowbackMemory] = useState<{
    id: string;
    title: string;
    memory_date: string;
    displayUrl: string | null;
    label: string;
  } | null>(() => homeDataCache?.throwbackMemory ?? null);
  const [latestMessage, setLatestMessage] = useState<LatestMessage | null>(() => homeDataCache?.latestMessage ?? null);
  const [nextMilestone, setNextMilestone] = useState<NextMilestone | null>(() => homeDataCache?.nextMilestone ?? null);
  const [loading, setLoading] = useState(() => !homeDataCache);
  const [refreshing, setRefreshing] = useState(false);

  const loadCoupleDetails = useCallback(async () => {
    if (!user || !coupleId) return;

    try {
      const { data: members } = await supabase
        .from('couple_members')
        .select('user_id')
        .eq('couple_id', coupleId);

      const userIds = (members || []).map((m) => m.user_id);
      if (userIds.length === 0) return;

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', userIds);

      const profileMap = new Map<string, { name: string; avatar: string | null }>();
      profiles?.forEach((p) => {
        if (p.id) {
          profileMap.set(p.id, {
            name: p.display_name || '',
            avatar: p.avatar_url || null,
          });
        }
      });

      const myProfile = profileMap.get(user.id);
      const myDisplayName =
        myProfile?.name ||
        user.user_metadata?.display_name ||
        user.email?.split('@')[0] ||
        'Você';
      const myFirstName = getFirstName(myDisplayName) || 'Você';

      const otherMember = members?.find((m) => m.user_id !== user.id);
      let partnerFirst = 'Meu Amor';

      if (otherMember) {
        const partnerProfile = profileMap.get(otherMember.user_id);
        if (partnerProfile?.name) {
          partnerFirst = getFirstName(partnerProfile.name) || 'Meu Amor';
        }
      }

      setCoupleTitle(`${myFirstName} & ${partnerFirst}`);
      setOwnerFirstName(myFirstName);
      setPartnerFirstName(partnerFirst);
    } catch {
      // Ignora silenciosamente
    }
  }, [user, coupleId]);

  const loadCoupleDays = useCallback(async () => {
    if (!coupleId) return;

    try {
      const { data: coupleData } = await supabase
        .from('couples')
        .select('id, anniversary_date, created_at')
        .eq('id', coupleId)
        .single();

      const customDateStr = coupleData?.anniversary_date;
      const effectiveDate = customDateStr || coupleData?.created_at;
      setEffectiveStartDateStr(effectiveDate || null);
    } catch {
      // Ignora silenciosamente
    }
  }, [coupleId]);

  const loadRecentMemory = useCallback(async () => {
    if (!coupleId) return;

    try {
      const { data: memoryData } = await supabase
        .from('memories')
        .select('id, title, memory_date, image_url, created_at')
        .eq('couple_id', coupleId)
        .order('memory_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!memoryData) {
        setRecentMemory(null);
        return;
      }

      let displayUrl = memoryData.image_url;
      if (memoryData.image_url) {
        let cleanPath = memoryData.image_url.trim();
        if (
          cleanPath.startsWith('file:') ||
          cleanPath.startsWith('data:') ||
          cleanPath.startsWith('http://') ||
          cleanPath.startsWith('https://')
        ) {
          displayUrl = cleanPath;
        } else {
          if (cleanPath.includes('/memories/')) {
            cleanPath = cleanPath.split('/memories/')[1].split('?')[0];
          }
          cleanPath = cleanPath.replace(/^\/+/, '');

          try {
            const { data: signedData } = await supabase.storage
              .from('memories')
              .createSignedUrl(cleanPath, 60 * 60 * 24);

            if (signedData?.signedUrl) {
              displayUrl = signedData.signedUrl;
            } else {
              const { data: publicData } = supabase.storage
                .from('memories')
                .getPublicUrl(cleanPath);
              if (publicData?.publicUrl) {
                displayUrl = publicData.publicUrl;
              }
            }
          } catch {
            const { data: publicData } = supabase.storage
              .from('memories')
              .getPublicUrl(cleanPath);
            if (publicData?.publicUrl) {
              displayUrl = publicData.publicUrl;
            }
          }
        }
      }

      setRecentMemory({
        ...memoryData,
        displayUrl,
      });
    } catch {
      // Ignora silenciosamente
    }
  }, [coupleId]);

  const loadThrowbackMemory = useCallback(async () => {
    if (!coupleId) return;

    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 25);
      const dateLimitStr = thirtyDaysAgo.toISOString().split('T')[0];

      const { data: pastMemories } = await supabase
        .from('memories')
        .select('id, couple_id, title, memory_date, image_url, thumb_path, created_at')
        .eq('couple_id', coupleId)
        .lte('memory_date', dateLimitStr)
        .order('memory_date', { ascending: false })
        .limit(8);

      if (pastMemories && pastMemories.length > 0) {
        const now = Date.now();
        let best = pastMemories[0];
        let bestLabel = 'Há algum tempo:';

        for (const m of pastMemories) {
          const memTime = new Date(m.memory_date).getTime();
          const diffDays = Math.floor((now - memTime) / (1000 * 60 * 60 * 24));
          if (diffDays >= 340 && diffDays <= 390) {
            best = m;
            bestLabel = 'Há 1 ano vocês viveram isso:';
            break;
          } else if (diffDays >= 165 && diffDays <= 200) {
            best = m;
            bestLabel = 'Há 6 meses vocês viveram isso:';
            break;
          } else if (diffDays >= 75 && diffDays <= 110) {
            best = m;
            bestLabel = 'Há 3 meses vocês viveram isso:';
            break;
          } else if (diffDays >= 25 && diffDays <= 45) {
            best = m;
            bestLabel = 'Há 1 mês vocês viveram isso:';
            break;
          } else {
            const months = Math.floor(diffDays / 30);
            bestLabel = months > 1 ? `Há ${months} meses vocês viveram isso:` : 'Há algum tempo:';
          }
        }

        let displayUrl: string | null = null;
        const rawPath = (best.thumb_path || best.image_url)?.trim();
        if (rawPath) {
          let cleanPath = rawPath;
          if (cleanPath.includes('/memories/')) {
            cleanPath = cleanPath.split('/memories/')[1].split('?')[0];
          }
          cleanPath = cleanPath.replace(/^\/+/, '');
          try {
            const { data: signed } = await supabase.storage
              .from('memories')
              .createSignedUrl(cleanPath, 3600);
            if (signed?.signedUrl) {
              displayUrl = signed.signedUrl;
            }
          } catch {}
        }

        setThrowbackMemory({
          id: best.id,
          title: best.title,
          memory_date: best.memory_date,
          displayUrl,
          label: bestLabel,
        });
      } else {
        setThrowbackMemory(null);
      }
    } catch {
      // Ignora silenciosamente
    }
  }, [coupleId]);

  const loadLatestMessage = useCallback(async () => {
    if (!coupleId || !user) return;

    try {
      const { data: msg } = await supabase
        .from('messages')
        .select('id, content, created_at, created_by')
        .eq('couple_id', coupleId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!msg) {
        setLatestMessage(null);
        return;
      }

      const isMe = msg.created_by === user.id;

      let authorName = isMe ? 'Você' : 'Meu Amor';
      let authorAvatarUrl: string | null = null;

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name, avatar_url')
          .eq('id', msg.created_by)
          .maybeSingle();

        if (profile) {
          authorName = isMe ? 'Você' : getFirstName(profile.display_name) || 'Meu Amor';
          if (profile.avatar_url) {
            let cleanPath = profile.avatar_url.trim();
            if (cleanPath.includes('/avatars/')) {
              cleanPath = cleanPath.split('/avatars/')[1].split('?')[0];
            }
            cleanPath = cleanPath.replace(/^\/+/, '');
            const { data: signedAvatar } = await supabase.storage
              .from('avatars')
              .createSignedUrl(cleanPath, 60 * 60 * 24);
            authorAvatarUrl = signedAvatar?.signedUrl || profile.avatar_url;
          }
        }
      } catch {
        // Fallback silencioso
      }

      setLatestMessage({
        id: msg.id,
        content: msg.content,
        created_at: msg.created_at,
        created_by: msg.created_by,
        isMe,
        authorName,
        authorAvatarUrl,
      });
    } catch {
      // Ignora silenciosamente
    }
  }, [coupleId, user]);

  const loadNextMilestone = useCallback(async () => {
    if (!coupleId) return;

    try {
      const nowIso = new Date().toISOString();
      const { data: nextDate } = await supabase
        .from('special_dates')
        .select('id, title, category, event_date')
        .eq('couple_id', coupleId)
        .gte('event_date', nowIso)
        .order('event_date', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (nextDate) {
        const targetTime = new Date(nextDate.event_date).getTime();
        const diffMs = Math.max(0, targetTime - Date.now());
        const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        setNextMilestone({
          ...nextDate,
          daysRemaining,
        });
      } else {
        setNextMilestone(null);
      }
    } catch {
      // Ignora silenciosamente
    }
  }, [coupleId]);

  useEffect(() => {
    homeDataCache = {
      coupleTitle,
      ownerFirstName,
      partnerFirstName,
      effectiveStartDateStr,
      recentMemory,
      throwbackMemory,
      latestMessage,
      nextMilestone,
    };
  }, [coupleTitle, ownerFirstName, partnerFirstName, effectiveStartDateStr, recentMemory, throwbackMemory, latestMessage, nextMilestone]);

  const loadAllData = useCallback(async (silent = false) => {
    if (!silent && !homeDataCache) {
      setLoading(true);
    }
    try {
      await Promise.all([
        loadCoupleDetails(),
        loadCoupleDays(),
        loadRecentMemory(),
        loadThrowbackMemory(),
        loadLatestMessage(),
        loadNextMilestone(),
      ]);
    } finally {
      setLoading(false);
    }
  }, [loadCoupleDetails, loadCoupleDays, loadRecentMemory, loadThrowbackMemory, loadLatestMessage, loadNextMilestone]);

  const callbacksRef = useRef({
    loadCoupleDetails,
    loadCoupleDays,
    loadRecentMemory,
    loadThrowbackMemory,
    loadLatestMessage,
    loadNextMilestone,
  });
  callbacksRef.current = {
    loadCoupleDetails,
    loadCoupleDays,
    loadRecentMemory,
    loadThrowbackMemory,
    loadLatestMessage,
    loadNextMilestone,
  };

  // Recarrega o vínculo e a data de início sem spinner (ex.: ao voltar de Ajustes)
  const refreshCouple = useCallback(async () => {
    await Promise.all([callbacksRef.current.loadCoupleDays(), callbacksRef.current.loadCoupleDetails()]);
  }, []);

  useEffect(() => {
    if (!coupleId) return;

    loadAllData();

    const channel = supabase
      .channel(`home_channel_${coupleId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'couple_members', filter: `couple_id=eq.${coupleId}` },
        () => callbacksRef.current.loadCoupleDetails()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'couples', filter: `id=eq.${coupleId}` },
        () => callbacksRef.current.loadCoupleDays()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'memories', filter: `couple_id=eq.${coupleId}` },
        () => {
          callbacksRef.current.loadRecentMemory();
          callbacksRef.current.loadThrowbackMemory();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages', filter: `couple_id=eq.${coupleId}` },
        () => callbacksRef.current.loadLatestMessage()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'special_dates', filter: `couple_id=eq.${coupleId}` },
        () => callbacksRef.current.loadNextMilestone()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [coupleId, loadAllData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  };

  return {
    coupleTitle,
    ownerFirstName,
    partnerFirstName,
    effectiveStartDateStr,
    recentMemory,
    throwbackMemory,
    latestMessage,
    nextMilestone,
    loading,
    refreshing,
    onRefresh,
    refreshCouple,
  };
}
