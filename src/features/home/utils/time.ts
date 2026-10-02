import { AccumulatedTime } from '../types';

export const calculateAccumulatedTime = (startDateString?: string | null): AccumulatedTime => {
  if (!startDateString) {
    return {
      months: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      breakdownMonths: 0,
      breakdownDays: 0,
      breakdownHours: 0,
    };
  }

  const cleanDateStr = startDateString.split('T')[0];
  const parts = cleanDateStr.split('-');

  let start: Date;
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    start = new Date(year, month, day, 0, 0, 0, 0);
  } else {
    start = new Date(startDateString);
  }

  const now = new Date();
  if (isNaN(start.getTime()) || start > now) {
    return {
      months: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      breakdownMonths: 0,
      breakdownDays: 0,
      breakdownHours: 0,
    };
  }

  const diffMs = now.getTime() - start.getTime();

  const minutes = Math.max(0, Math.floor(diffMs / (1000 * 60)));
  const hours = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
  const days = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

  let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  if (now.getDate() < start.getDate()) {
    months--;
  }
  months = Math.max(0, months);

  const cursorDate = new Date(start.getTime());
  cursorDate.setMonth(cursorDate.getMonth() + months);
  if (cursorDate > now) {
    cursorDate.setMonth(cursorDate.getMonth() - 1);
  }
  const remainingMs = Math.max(0, now.getTime() - cursorDate.getTime());
  const breakdownDays = Math.floor(remainingMs / (1000 * 60 * 60 * 24));
  const breakdownHours = Math.floor((remainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  return {
    months,
    days,
    hours,
    minutes,
    breakdownMonths: months,
    breakdownDays,
    breakdownHours,
  };
};

export const formatMemoryDate = (dateString?: string | null): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  return date.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
  });
};
