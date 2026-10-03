import { useState, useCallback, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/core/supabase';
import { SpecialDate } from '../types';
import { parseEventDate } from '../utils/formatting';

let cachedDates: SpecialDate[] | null = null;

export function useDates(coupleId: string | null) {
  const [dates, setDates] = useState<SpecialDate[]>(() => cachedDates || []);
  const [loading, setLoading] = useState(() => !cachedDates);
  const [refreshing, setRefreshing] = useState(false);

  const loadDates = useCallback(async (silent = false) => {
    if (!coupleId) return;

    try {
      if (!silent && !cachedDates) setLoading(true);
      const { data, error } = await supabase
        .from('special_dates')
        .select('id, couple_id, title, event_date, category, created_at, created_by')
        .eq('couple_id', coupleId)
        .order('event_date', { ascending: true });

      if (error) throw error;
      cachedDates = data || [];
      setDates(data || []);
    } catch {
      // Ignora silenciosamente
    } finally {
      setLoading(false);
    }
  }, [coupleId]);

  useEffect(() => {
    if (!coupleId) return;
    loadDates();

    const channel = supabase
      .channel(`special_dates_tab_${coupleId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'special_dates',
          filter: `couple_id=eq.${coupleId}`,
        },
        () => {
          loadDates(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [coupleId, loadDates]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDates();
    setRefreshing(false);
  };

  const { upcomingEvents, pastEvents, nextHeroEvent } = useMemo(() => {
    const nowTime = Date.now();
    const upcoming: SpecialDate[] = [];
    const past: SpecialDate[] = [];

    dates.forEach((item) => {
      const eventTime = parseEventDate(item.event_date).getTime();
      if (eventTime >= nowTime) {
        upcoming.push(item);
      } else {
        past.push(item);
      }
    });

    upcoming.sort(
      (a, b) => parseEventDate(a.event_date).getTime() - parseEventDate(b.event_date).getTime()
    );

    past.sort(
      (a, b) => parseEventDate(b.event_date).getTime() - parseEventDate(a.event_date).getTime()
    );

    return {
      upcomingEvents: upcoming,
      pastEvents: past,
      nextHeroEvent: upcoming.length > 0 ? upcoming[0] : null,
    };
  }, [dates]);

  return {
    dates,
    loading,
    refreshing,
    onRefresh,
    upcomingEvents,
    pastEvents,
    nextHeroEvent,
  };
}
