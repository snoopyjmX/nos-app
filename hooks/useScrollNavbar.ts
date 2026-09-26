import { useRef } from 'react';
import { NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { useNavbar } from '../context/NavbarContext';

export function useScrollNavbar() {
  const { setIsVisible } = useNavbar();
  const lastOffsetY = useRef(0);

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentOffsetY = event.nativeEvent.contentOffset.y;
    
    // Ignore bounce at top
    if (currentOffsetY < 0) return;

    // Small threshold to avoid hiding/showing on tiny scrolls
    const diff = currentOffsetY - lastOffsetY.current;

    if (diff > 15) {
      // Scrolling down -> hide navbar
      setIsVisible(false);
      lastOffsetY.current = currentOffsetY;
    } else if (diff < -15) {
      // Scrolling up -> show navbar
      setIsVisible(true);
      lastOffsetY.current = currentOffsetY;
    }
  };

  return { onScroll };
}
