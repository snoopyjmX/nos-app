import { CategoryOption } from '../types';

export const CATEGORIES: CategoryOption[] = [
  { id: 'Viagem', label: 'Viagem', icon: 'airplane-outline', color: '#2B6CB0', bg: 'rgba(43, 108, 176, 0.12)' },
  { id: 'Encontro', label: 'Encontro', icon: 'restaurant-outline', color: '#C53030', bg: 'rgba(197, 48, 48, 0.12)' },
  { id: 'Comemoração', label: 'Comemoração', icon: 'sparkles', color: '#8E7CE8', bg: 'rgba(142, 124, 232, 0.15)' },
  { id: 'Aniversário', label: 'Aniversário', icon: 'gift-outline', color: '#DD6B20', bg: 'rgba(221, 107, 32, 0.12)' },
  { id: 'Outro', label: 'Outro', icon: 'bookmark-outline', color: '#4A5568', bg: 'rgba(74, 85, 104, 0.12)' },
];

export const getCategoryMeta = (catName?: string): CategoryOption => {
  const found = CATEGORIES.find((c) => c.id.toLowerCase() === (catName || '').toLowerCase());
  return (
    found || {
      id: catName || 'Outro',
      label: catName || 'Outro',
      icon: 'sparkles',
      color: '#8E7CE8',
      bg: 'rgba(142, 124, 232, 0.12)',
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
