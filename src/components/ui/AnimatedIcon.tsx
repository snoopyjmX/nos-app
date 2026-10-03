import React, { useEffect, useRef } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useReducedMotion } from '@/lib/hooks/useAccessibility';

const ACTIVE_SCALE = 1.22;
const SCALE_SPRING = { damping: 10, stiffness: 220 };
const ROTATION_TILT = -6;
const ROTATION_TILT_MS = 60;
const ROTATION_SPRING = { damping: 12 };

type IconName = keyof typeof Feather.glyphMap;

interface AnimatedIconProps {
  name: IconName;
  size: number;
  color: string;
  /** Estado ativo: o ícone cresce com mola e balança ao ativar. */
  active?: boolean;
  /** Incremente a cada toque para disparar o mesmo gesto sem mudar o estado. */
  pulseKey?: number;
  style?: StyleProp<ViewStyle>;
}

export function AnimatedIcon({ name, size, color, active = false, pulseKey = 0, style }: AnimatedIconProps) {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(active ? ACTIVE_SCALE : 1);
  const rotation = useSharedValue(0);
  const isFirstRender = useRef(true);

  const wiggle = () => {
    rotation.value = withSequence(
      withTiming(ROTATION_TILT, { duration: ROTATION_TILT_MS }),
      withSpring(0, ROTATION_SPRING)
    );
  };

  useEffect(() => {
    if (reducedMotion) {
      scale.value = 1;
      rotation.value = 0;
      return;
    }
    scale.value = withSpring(active ? ACTIVE_SCALE : 1, SCALE_SPRING);
    if (active && !isFirstRender.current) wiggle();
    isFirstRender.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- shared values e wiggle são estáveis
  }, [active, reducedMotion]);

  useEffect(() => {
    if (reducedMotion || pulseKey === 0) return;
    scale.value = withSequence(withSpring(ACTIVE_SCALE, SCALE_SPRING), withSpring(active ? ACTIVE_SCALE : 1, SCALE_SPRING));
    wiggle();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reage só ao pulseKey
  }, [pulseKey]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={[animatedStyle, style]}>
      <Feather name={name} size={size} color={color} />
    </Animated.View>
  );
}
