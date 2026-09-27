import { useRef } from 'react';
import { NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { useNavbar } from '../context/NavbarContext';

export function useScrollNavbar() {
  const onScroll = () => {};
  return { onScroll };
}
