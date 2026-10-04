/**
 * milestones.ts - Cálculo de marcos automáticos no cliente
 * Não grava no banco de dados e não duplica special_dates.
 * Trata fuso horário America/Sao_Paulo e calcula aniversários e marcos numéricos de dias.
 */

export interface MilestoneInfo {
  days: number;
  label: string;
  isToday: boolean;
  isAnniversary: boolean;
}

export interface MilestoneCelebration {
  title: string;
  subtitle: string;
  badge: string;
  daysTogether: number;
}

// Lista de marcos marcantes em dias
const DAY_MILESTONES = [
  50, 100, 150, 200, 250, 300, 365, 400, 500, 600, 700, 730, 800, 900, 1000, 1500, 2000, 2500, 3000,
];

/**
 * Converte string 'YYYY-MM-DD' para objeto Date no fuso local sem deslocamento de UTC
 */
export function parseDateSafe(dateString?: string | null): Date | null {
  if (!dateString) return null;
  const clean = dateString.split('T')[0];
  const parts = clean.split('-');
  if (parts.length !== 3) return null;

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  return new Date(year, month, day, 0, 0, 0);
}

/**
 * Retorna o total de dias corridos entre a data inicial e hoje
 */
export function getDaysTogether(startDate: Date, today = new Date()): number {
  const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const now = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diffMs = now.getTime() - start.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

/**
 * Verifica se hoje é um marco especial (ex: 100 dias, 1 ano, mêsversário)
 */
export function checkTodayCelebration(startDateStr?: string | null, today = new Date()): MilestoneCelebration | null {
  const startDate = parseDateSafe(startDateStr);
  if (!startDate) return null;

  const days = getDaysTogether(startDate, today);
  const isSameDayOfMonth = startDate.getDate() === today.getDate();
  const yearsDiff = today.getFullYear() - startDate.getFullYear();
  const monthsDiff = (today.getFullYear() - startDate.getFullYear()) * 12 + (today.getMonth() - startDate.getMonth());

  // 1. Aniversário de Anos (mesmo mês e mesmo dia)
  if (isSameDayOfMonth && startDate.getMonth() === today.getMonth() && yearsDiff > 0) {
    const anosLabel = yearsDiff === 1 ? '1 ano' : `${yearsDiff} anos`;
    return {
      title: `Feliz ${anosLabel} juntos! 🎉`,
      subtitle: `Hoje vocês completam ${anosLabel} de amor e companheirismo (${days} dias).`,
      badge: 'Celebração',
      daysTogether: days,
    };
  }

  // 2. Marcos de dias redondos (100 dias, 200 dias, etc.)
  if (DAY_MILESTONES.includes(days) && days > 0) {
    return {
      title: `${days} dias de amor! 💖`,
      subtitle: `Uma história linda que só está começando. Parabéns por essa marca!`,
      badge: 'Marco Especial',
      daysTogether: days,
    };
  }

  // 3. Mêsversário (mesmo dia do mês nos primeiros 11 meses)
  if (isSameDayOfMonth && monthsDiff > 0 && monthsDiff < 12) {
    const mesesLabel = monthsDiff === 1 ? '1 mês' : `${monthsDiff} meses`;
    return {
      title: `${mesesLabel} de namoro! ✨`,
      subtitle: `Mais um mês comemorando cada momento e sorriso juntos.`,
      badge: 'Mêsversário',
      daysTogether: days,
    };
  }

  return null;
}

/**
 * Retorna o próximo marco automático a ser atingido
 */
export function getNextAutomaticMilestone(startDateStr?: string | null, today = new Date()) {
  const startDate = parseDateSafe(startDateStr);
  if (!startDate) return null;

  const days = getDaysTogether(startDate, today);

  // Próximo marco de dias
  const nextDay = DAY_MILESTONES.find((m) => m > days);
  if (!nextDay) return null;

  const daysRemaining = nextDay - days;
  return {
    targetDays: nextDay,
    daysRemaining,
    label: `${nextDay} dias juntos`,
  };
}
