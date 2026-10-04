export const getFirstName = (name?: string | null): string => {
  if (!name) return '';
  const trimmed = name.trim();
  if (!trimmed) return '';
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return parts[0];

  const firstLower = parts[0].toLowerCase();
  const compoundFirst = ['maria', 'joao', 'joão', 'ana', 'pedro', 'vitor', 'victor', 'luiz', 'luís', 'luis'];
  if (compoundFirst.includes(firstLower) && parts.length > 1) {
    return `${parts[0]} ${parts[1]}`;
  }

  return parts[0];
};

export const formatFullDatePTBR = (dateString?: string | null): string => {
  if (!dateString) return '';
  const clean = dateString.split('T')[0];
  const parts = clean.split('-');

  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    return date.toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  const date = new Date(dateString);
  return isNaN(date.getTime())
    ? ''
    : date.toLocaleDateString('pt-BR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
};

export const formatSavedAtDateTime = (dateString?: string | null): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} às ${hours}:${minutes}`;
};

// "30 de setembro" (ano só quando difere do atual), lendo 'YYYY-MM-DD' como data de calendário.
export const formatDayMonthPTBR = (dateString?: string | null): string => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('T')[0].split('-').map(Number);
  if (!year || !month || !day) return '';
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    ...(year !== new Date().getFullYear() ? { year: 'numeric' as const } : {}),
  });
};
