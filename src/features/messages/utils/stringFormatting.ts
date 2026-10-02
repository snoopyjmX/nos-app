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
