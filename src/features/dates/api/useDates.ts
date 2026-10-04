import { useState, useCallback, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/core/supabase';
import { SpecialDate } from '../types';
import { parseEventDate } from '../utils/formatting';

interface SpecialDateInput {
  title: string;
  category: string;
  date: Date;
  time: Date | null;
}

const SPECIAL_DATE_COLUMNS = 'id, couple_id, title, event_date, category, created_at, created_by';

let cachedDates: SpecialDate[] | null = null;

export function clearDatesCache() {
  cachedDates = null;
}

// Data/hora local sem fuso; 'T00:00:00' significa "sem horário" (ver parseEventDate).
const toEventDateString = (date: Date, time: Date | null): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  if (!time) return `${year}-${month}-${day}T00:00:00`;

  const h = String(time.getHours()).padStart(2, '0');
  const m = String(time.getMinutes()).padStart(2, '0');
  const s = String(time.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}T${h}:${m}:${s}`;
};

export function useDates(coupleId: string | null, userId?: string) {
  const [dates, setDates] = useState<SpecialDate[]>(() => cachedDates || []);
  const [loading, setLoading] = useState(() => !cachedDates);
  const [refreshing, setRefreshing] = useState(false);

  // Estado e cache andam juntos, para a próxima montagem não abrir com a lista antiga.
  const applyDates = useCallback((update: (prev: SpecialDate[]) => SpecialDate[]) => {
    setDates((prev) => {
      const next = update(prev);
      cachedDates = next;
      return next;
    });
  }, []);

  const loadDates = useCallback(async (silent = false) => {
    if (!coupleId) return;

    try {
      if (!silent && !cachedDates) setLoading(true);
      const { data, error } = await supabase
        .from('special_dates')
        .select(SPECIAL_DATE_COLUMNS)
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

  const addDate = useCallback(async ({ title, category, date, time }: SpecialDateInput) => {
    if (!coupleId || !userId) throw new Error('Casal ou usuário não identificado.');

    const { data, error } = await supabase
      .from('special_dates')
      .insert([
        {
          couple_id: coupleId,
          title: title.trim(),
          category,
          event_date: toEventDateString(date, time),
          created_by: userId,
        },
      ])
      .select(SPECIAL_DATE_COLUMNS)
      .single();
    if (error) throw error;

    // O realtime pode ter recarregado a lista antes desta resposta.
    applyDates((prev) => (prev.some((d) => d.id === data.id) ? prev : [...prev, data]));
  }, [coupleId, userId, applyDates]);

  const updateDate = useCallback(async (id: string, { title, category, date, time }: SpecialDateInput) => {
    if (!coupleId) throw new Error('Casal não identificado.');

    const { data, error } = await supabase
      .from('special_dates')
      .update({
        title: title.trim(),
        category,
        event_date: toEventDateString(date, time),
      })
      .eq('id', id)
      .eq('couple_id', coupleId)
      .select(SPECIAL_DATE_COLUMNS);
    if (error) throw error;

    const updated = data?.[0];
    if (updated) applyDates((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
  }, [coupleId, applyDates]);

  const removeDate = useCallback(async (item: SpecialDate) => {
    if (!coupleId) throw new Error('Casal não identificado.');

    applyDates((prev) => prev.filter((d) => d.id !== item.id));

    try {
      const { error } = await supabase
        .from('special_dates')
        .delete()
        .eq('id', item.id)
        .eq('couple_id', coupleId);
      if (error) throw error;
    } catch (err) {
      // Desfaz localmente: não depende da rede que acabou de falhar.
      applyDates((prev) => (prev.some((d) => d.id === item.id) ? prev : [...prev, item]));
      throw err;
    }
  }, [coupleId, applyDates]);

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
    addDate,
    updateDate,
    removeDate,
  };
}
