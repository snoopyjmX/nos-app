// Geometria da dock: cada aba ocupa [i*w, (i+1)*w) e o indicador fica centrado sob o dedo.

export function clamp(value: number, min: number, max: number) {
  'worklet';
  return Math.min(Math.max(value, min), max);
}

/** Aba sob o dedo. */
export function tabIndexAt(x: number, tabWidth: number, tabCount: number) {
  'worklet';
  return clamp(Math.floor(x / tabWidth), 0, tabCount - 1);
}

/** Índice contínuo do indicador (centro das abas = inteiros) para um dedo em `x`. */
export function lensIndexAt(x: number, tabWidth: number, tabCount: number) {
  'worklet';
  return clamp(x / tabWidth - 0.5, 0, tabCount - 1);
}

/** Posição X da borda esquerda do indicador com o centro sob o dedo. */
export function lensXAt(x: number, tabWidth: number, tabCount: number) {
  'worklet';
  return lensIndexAt(x, tabWidth, tabCount) * tabWidth;
}

/** Alongamento horizontal do indicador proporcional à velocidade, limitado a `1 + max`. */
export function stretchAt(velocityX: number, max: number) {
  'worklet';
  return 1 + Math.min(Math.abs(velocityX) / 3000, max);
}
