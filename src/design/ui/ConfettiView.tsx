import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  useReducedMotion,
  Easing,
} from 'react-native-reanimated';

interface ConfettiPieceProps {
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  targetRotate: number;
  color: string;
  size: number;
  delay: number;
  duration: number;
}

function ConfettiPiece({
  startX,
  startY,
  targetX,
  targetY,
  targetRotate,
  color,
  size,
  delay,
  duration,
}: ConfettiPieceProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      progress.value = withTiming(1, {
        duration,
        easing: Easing.out(Easing.quad),
      });
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, duration, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    const currentY = startY + (targetY - startY) * progress.value;
    const currentX = startX + (targetX - startX) * progress.value;
    const currentRot = targetRotate * progress.value;
    const opacity = progress.value > 0.75 ? 1 - (progress.value - 0.75) / 0.25 : 1;

    return {
      transform: [
        { translateX: currentX },
        { translateY: currentY },
        { rotate: `${currentRot}deg` },
      ],
      opacity,
    };
  });

  return (
    <Animated.View
      style={[
        styles.piece,
        {
          width: size,
          height: size * 1.6,
          backgroundColor: color,
          borderRadius: 2,
        },
        animatedStyle,
      ]}
    />
  );
}

const CONFETTI_COLORS = ['#7C6FE0', '#F58FA8', '#FBC02D', '#A797FF', '#F7A6BB', '#E0E7FF'];

export function ConfettiView({ onComplete }: { onComplete?: () => void }) {
  const reducedMotion = useReducedMotion();

  const pieces = useMemo(() => {
    const count = 28;
    return Array.from({ length: count }, (_, i) => {
      const startX = Math.random() * 260 - 130;
      const startY = -20;
      const targetX = startX + (Math.random() * 120 - 60);
      const targetY = 160 + Math.random() * 140;
      const targetRotate = (Math.random() - 0.5) * 720;
      const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
      const size = 6 + Math.random() * 5;
      const delay = Math.random() * 200;
      const duration = 850 + Math.random() * 250;

      return {
        id: i,
        startX,
        startY,
        targetX,
        targetY,
        targetRotate,
        color,
        size,
        delay,
        duration,
      };
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 1250);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (reducedMotion) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {pieces.map((p) => (
        <ConfettiPiece key={p.id} {...p} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'flex-start',
    zIndex: 99,
  },
  piece: {
    position: 'absolute',
  },
});
