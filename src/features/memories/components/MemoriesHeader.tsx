import React from 'react';
import { ScreenTitleBar } from '@/components/ui';

interface MemoriesHeaderProps {
  topInset: number;
  count: number;
  hasMore: boolean;
  onAddMemory: () => void;
}

export function MemoriesHeader({ topInset, count, hasMore, onAddMemory }: MemoriesHeaderProps) {
  const counter =
    count === 0
      ? 'Seus momentos vão morar aqui'
      : `${count}${hasMore ? '+' : ''} ${count === 1 && !hasMore ? 'momento eternizado' : 'momentos eternizados'}`;

  return (
    <ScreenTitleBar
      title="Memórias"
      subtitle={counter}
      topInset={topInset}
      actionLabel="Adicionar"
      actionAccessibilityLabel="Adicionar nova memória"
      onAction={onAddMemory}
    />
  );
}
