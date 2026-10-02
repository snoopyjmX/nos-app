import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/core/supabase';
import { ProfileData } from '../types';

let cachedProfileData: {
  myProfile: ProfileData | null;
  partnerProfile: ProfileData | null;
  partnerId: string | null;
  anniversaryDate: string | null;
  coupleCode: string | null;
} | null = null;

export const resolveAvatarUrl = async (pathOrUrl?: string | null): Promise<string | null> => {
  if (!pathOrUrl) return null;
  const trimmed = pathOrUrl.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('file:') || trimmed.startsWith('data:')) {
    return trimmed;
  }

  if ((trimmed.startsWith('http://') || trimmed.startsWith('https://')) && !trimmed.includes('/avatars/')) {
    return trimmed;
  }

  let cleanPath = trimmed;
  if (cleanPath.includes('/avatars/')) {
    cleanPath = cleanPath.split('/avatars/')[1].split('?')[0];
  }
  cleanPath = cleanPath.replace(/^\/+/, '');

  try {
    const { data: signedData, error: signError } = await supabase.storage
      .from('avatars')
      .createSignedUrl(cleanPath, 60 * 60 * 24);

    if (!signError && signedData?.signedUrl) {
      return signedData.signedUrl;
    }
  } catch {
    // Ignora e tenta URL pública
  }

  const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(cleanPath);
  return publicData?.publicUrl || trimmed;
};

export function useProfile(coupleId?: string | null, user?: any) {
  const [myProfile, setMyProfile] = useState<ProfileData | null>(() => cachedProfileData?.myProfile ?? null);
  const [partnerProfile, setPartnerProfile] = useState<ProfileData | null>(() => cachedProfileData?.partnerProfile ?? null);
  const [partnerId, setPartnerId] = useState<string | null>(() => cachedProfileData?.partnerId ?? null);
  const [anniversaryDate, setAnniversaryDate] = useState<string | null>(() => cachedProfileData?.anniversaryDate ?? null);
  const [coupleCode, setCoupleCode] = useState<string | null>(() => cachedProfileData?.coupleCode ?? null);

  const [loading, setLoading] = useState(() => !cachedProfileData);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (myProfile || partnerProfile || coupleCode) {
      cachedProfileData = {
        myProfile,
        partnerProfile,
        partnerId,
        anniversaryDate,
        coupleCode,
      };
    }
  }, [myProfile, partnerProfile, partnerId, anniversaryDate, coupleCode]);

  const loadProfileData = useCallback(async (silent = false) => {
    if (!user || !coupleId) return;

    try {
      if (!silent && !cachedProfileData) setLoading(true);

      const { data: members, error: membersError } = await supabase
        .from('couple_members')
        .select('user_id')
        .eq('couple_id', coupleId);

      if (membersError) throw membersError;

      const userIds = (members || []).map((m) => m.user_id);

      if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url')
          .in('id', userIds);

        if (profilesError) {
          // Ignora silenciosamente
        }

        const profilesWithUrls: ProfileData[] = await Promise.all(
          (profiles || []).map(async (p) => {
            const displayAvatarUrl = await resolveAvatarUrl(p.avatar_url);
            return {
              ...p,
              displayAvatarUrl,
            };
          })
        );

        const myData = profilesWithUrls.find((p) => p.id === user.id);
        setMyProfile(
          myData || {
            id: user.id,
            display_name: user.user_metadata?.display_name || user.email?.split('@')[0] || 'Você',
            avatar_url: null,
            displayAvatarUrl: null,
          }
        );

        const partnerData = profilesWithUrls.find((p) => p.id !== user.id);
        if (partnerData) {
          setPartnerProfile(partnerData);
          setPartnerId(partnerData.id);
        } else {
          setPartnerProfile(null);
          setPartnerId(null);
        }
      }

      const { data: coupleData } = await supabase
        .from('couples')
        .select('id, anniversary_date, created_at')
        .eq('id', coupleId)
        .single();

      if (coupleData) {
        setAnniversaryDate(coupleData.anniversary_date || coupleData.created_at);
      }

      const { data: inviteData } = await supabase
        .from('couple_invites')
        .select('code')
        .eq('couple_id', coupleId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (inviteData?.code) {
        setCoupleCode(inviteData.code);
      }
    } catch {
      // Ignora silenciosamente
    } finally {
      setLoading(false);
    }
  }, [user, coupleId]);

  const handleProfileUpdate = useCallback(
    async (newProfile: { id: string; display_name?: string | null; avatar_url?: string | null }) => {
      const displayAvatarUrl = await resolveAvatarUrl(newProfile.avatar_url);
      const updatedData: Partial<ProfileData> = {
        id: newProfile.id,
        display_name: newProfile.display_name || '',
        avatar_url: newProfile.avatar_url || null,
        displayAvatarUrl,
      };

      if (newProfile.id === user?.id) {
        setMyProfile((prev) => (prev ? { ...prev, ...updatedData } : null));
      } else if (newProfile.id === partnerId) {
        setPartnerProfile((prev) => (prev ? { ...prev, ...updatedData } : null));
      }
    },
    [user?.id, partnerId]
  );

  useEffect(() => {
    loadProfileData();

    if (!coupleId || !user?.id) return;

    const channel = supabase.channel(`profile_tab_${coupleId}`);

    channel.on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'couples', filter: `id=eq.${coupleId}` },
      (payload: any) => {
        if (payload?.new && payload.new.anniversary_date) {
          setAnniversaryDate(payload.new.anniversary_date);
        }
      }
    );

    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
      (payload: any) => {
        if (payload?.new) handleProfileUpdate(payload.new);
      }
    );

    if (partnerId) {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${partnerId}` },
        (payload: any) => {
          if (payload?.new) handleProfileUpdate(payload.new);
        }
      );
    }

    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'couple_members', filter: `couple_id=eq.${coupleId}` },
      () => {
        loadProfileData(true);
      }
    );

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [coupleId, user?.id, partnerId, handleProfileUpdate, loadProfileData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfileData();
    setRefreshing(false);
  };

  return {
    myProfile,
    partnerProfile,
    partnerId,
    anniversaryDate,
    setAnniversaryDate,
    coupleCode,
    loading,
    refreshing,
    onRefresh,
    loadProfileData,
  };
}
