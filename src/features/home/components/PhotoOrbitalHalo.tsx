import React from 'react';
import { BorderBeam } from '@/components/ui';
import { useTheme } from '@/theme';

interface PhotoOrbitalHaloProps {
  radius: number;
}

// Halo orbital sobre a foto do HeroCard: borda de vidro + feixe que percorre o contorno.
export function PhotoOrbitalHalo({ radius }: PhotoOrbitalHaloProps) {
  const { colors } = useTheme();

  return <BorderBeam radius={radius} color={colors.primaryText} />;
}
