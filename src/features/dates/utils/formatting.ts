import { CategoryOption } from '../types';
import { colors as themeColors } from '@/theme/colors';
const colors = themeColors.light;

export const CATEGORIES: CategoryOption[] = [
  { id: 'Viagem', label: 'Viagem', icon: 'airplane-outline', color: colors.catTravel, bg: colors.catTravelBg },
  { id: 'Encontro', label: 'Encontro', icon: 'restaurant-outline', color: colors.catDate, bg: colors.catDateBg },
  { id: 'Comemoração', label: 'Comemoração', icon: 'sparkles', color: colors.catCeleb, bg: colors.catCelebBg },
  { id: 'Aniversário', label: 'Aniversário', icon: 'gift-outline', color: colors.catBday, bg: colors.catBdayBg },
  { id: 'Outro', label: 'Outro', icon: 'bookmark-outline', color: colors.catOther, bg: colors.catOtherBg },
];

export const getCategoryMeta = (catName?: string): CategoryOption => {
  const found = CATEGORIES.find((c) => c.id.toLowerCase() === (catName || '').toLowerCase());
  return (
    found || {
      id: catName || 'Outro',
      label: catName || 'Outro',
      icon: 'sparkles',
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
