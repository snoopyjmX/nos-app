import { CategoryOption } from '../types';
import { colors as themeColors } from '@/theme/colors';
const colors = themeColors.light;

export const CATEGORIES: CategoryOption[] = [
  { id: 'Viagem', label: 'Viagem', icon: 'map-pin', color: colors.catTravel, bg: colors.catTravelBg },
  { id: 'Encontro', label: 'Encontro', icon: 'coffee', color: colors.catDate, bg: colors.catDateBg },
  { id: 'Comemoração', label: 'Comemoração', icon: 'award', color: colors.catCeleb, bg: colors.catCelebBg },
  { id: 'Aniversário', label: 'Aniversário', icon: 'gift', color: colors.catBday, bg: colors.catBdayBg },
  { id: 'Outro', label: 'Outro', icon: 'bookmark', color: colors.catOther, bg: colors.catOtherBg },
];

export const getCategoryMeta = (catName?: string): CategoryOption => {
  const found = CATEGORIES.find((c) => c.id.toLowerCase() === (catName || '').toLowerCase());
  return (
    found || {
      id: catName || 'Outro',
      label: catName || 'Outro',
      icon: 'award',
      color: colors.catCeleb,
      bg: colors.catCelebBg,
    }
  );
};

export const parseEventDate = (dateString?: string): Date => {
  if (!dateString) return new Date();
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return new Date();
  if (dateString.includes('T00:00:00')) {
    return new Date(d.getTime() + d.getTimezoneOffset() * 60000);
  }
  return d;
};

export const formatFullDatePTBR = (dateString?: string): string => {
  if (!dateString) return '';
  const d = parseEventDate(dateString);
  return d.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const formatTimePTBR = (dateString?: string): string => {
  if (!dateString) return '';
  if (dateString.includes('T00:00:00')) return '';
  const d = parseEventDate(dateString);
  return d.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatHeroDatePTBR = (dateString?: string): string => {
  if (!dateString) return '';
  const d = parseEventDate(dateString);
  const dateStr = d.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const isMidnightUtc = dateString.includes('T00:00:00');
  if (isMidnightUtc) {
    return dateStr;
  }
  const timeStr = d.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return timeStr ? `${dateStr} às ${timeStr}` : dateStr;
};

export const formatListItemDateTime = (dateString?: string): string => {
  if (!dateString) return '';
  const d = parseEventDate(dateString);
  const dateStr = d.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const isMidnightUtc = dateString.includes('T00:00:00');
  if (isMidnightUtc) {
    return dateStr;
  }
  const timeStr = d.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return timeStr ? `${dateStr} • ${timeStr}` : dateStr;
};

export const formatEventDateTime = (dateString?: string): string => {
  return formatListItemDateTime(dateString);
};

const MS_PER_DAY = 86400000;

export const formatLongDatePTBR = (dateString?: string): string => {
  if (!dateString) return '';
  const d = parseEventDate(dateString);
  const dateStr = d.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const time = formatTimePTBR(dateString);
  return time ? `${dateStr} às ${time}` : dateStr;
};

// Diferença em dias de calendário entre o evento e hoje (negativa para eventos passados).
export const daysFromToday = (dateString?: string): number => {
  const d = parseEventDate(dateString);
  const now = new Date();
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target.getTime() - today.getTime()) / MS_PER_DAY);
};

export const formatEventBadge = (dateString?: string): string => {
  const days = daysFromToday(dateString);
  if (days === 0) return 'Hoje';
  if (days === 1) return 'Amanhã';
  if (days === -1) return 'Ontem';
  if (days > 1) return `Em ${days} dias`;
  return `Há ${Math.abs(days)} dias`;
};

// Ciclo anual: quanto dos 365 dias que antecedem o momento já foi vivido (0 a 1).
export const yearCycleProgress = (dateString?: string, now: number = Date.now()): number => {
  const target = parseEventDate(dateString).getTime();
  const start = target - 365 * MS_PER_DAY;
  return Math.max(0, Math.min(1, (now - start) / (target - start)));
};
