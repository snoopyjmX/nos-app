export const getFirstName = (fullName?: string | null): string => {
  if (!fullName) return '';
  const trimmed = fullName.trim();
  if (!trimmed) return '';
  const parts = trimmed.split(/\s+/);
  if (parts.length > 1) {
    const compoundFirst = ['maria', 'joao', 'joão', 'ana', 'pedro', 'vitor', 'victor', 'luiz', 'luís', 'luis'];
    if (compoundFirst.includes(parts[0].toLowerCase())) {
      return `${parts[0]} ${parts[1]}`;
    }
  }
  return parts[0];
};

export const formatFullDatePTBR = (dateString?: string | null): string => {
  if (!dateString) return 'Não definida';
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

  const d = new Date(dateString);
  if (isNaN(d.getTime())) return 'Não definida';
  return d.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};
