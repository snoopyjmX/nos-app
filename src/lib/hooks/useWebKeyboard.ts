import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

// Perda de altura da viewport visível a partir da qual consideramos o teclado aberto.
const KEYBOARD_MIN_HEIGHT = 120;

export interface WebKeyboardState {
  visible: boolean;
  /**
   * Quanto o teclado cobre do layout atual, para elementos ancorados na base. É 0 quando o
   * navegador já encolheu o layout (Android com resizes-content): somar o teclado de novo
   * levantaria o campo em dobro.
   */
  inset: number;
}

const CLOSED: WebKeyboardState = { visible: false, inset: 0 };

function isEditableFocused() {
  const el = document.activeElement as HTMLElement | null;
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
}

// No web o Keyboard do React Native não dispara; o teclado só aparece como mudança na visualViewport.
export function useWebKeyboard(): WebKeyboardState {
  const [state, setState] = useState<WebKeyboardState>(CLOSED);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || !window.visualViewport) return;

    const vv = window.visualViewport;
    // Maior altura de layout vista: no Android o teclado pode encolher o próprio window.innerHeight,
    // e só comparando com a altura sem teclado dá para saber que ele abriu.
    let baseline = window.innerHeight;
    let baselineWidth = window.innerWidth;

    const update = () => {
      if (window.innerWidth !== baselineWidth) {
        baselineWidth = window.innerWidth;
        baseline = window.innerHeight;
      }
      baseline = Math.max(baseline, window.innerHeight);

      const visualBottom = vv.height + vv.offsetTop;
      // Exige campo de texto em foco: sem isso, pinça de zoom ou redimensionar a janela no desktop
      // pareceriam um teclado.
      const visible = baseline - visualBottom > KEYBOARD_MIN_HEIGHT && isEditableFocused();
      const inset = visible ? Math.max(0, window.innerHeight - visualBottom) : 0;

      setState((prev) => (prev.visible === visible && prev.inset === inset ? prev : { visible, inset }));
    };

    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    window.addEventListener('resize', update);

    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return state;
}
