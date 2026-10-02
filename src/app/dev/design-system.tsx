import React from 'react';
import { View, ScrollView } from 'react-native';
import {
  Screen,
  SectionTitle,
  Button,
  IconButton,
  Card,
  Chip,
  Avatar,
  EmptyState,
  Skeleton,
} from '@/components/ui';

export default function DesignSystemScreen() {
  return (
    <Screen style={{ paddingHorizontal: 0 }}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 32 }}>
        <SectionTitle title="Design System" subtitle="Página de testes dos componentes base." />

        <View style={{ gap: 16 }}>
          <SectionTitle title="Tipografia" />
          <SectionTitle title="Títulos e Subtítulos" subtitle="Exemplo de SectionTitle" />
        </View>

        <View style={{ gap: 16 }}>
          <SectionTitle title="Botões" />
          <Button onPress={() => {}}>Primary Button</Button>
          <Button variant="secondary" onPress={() => {}}>Secondary Button</Button>
          <Button variant="ghost" onPress={() => {}}>Ghost Button</Button>
          <Button loading onPress={() => {}}>Loading</Button>
          <Button disabled onPress={() => {}}>Disabled</Button>
        </View>

        <View style={{ gap: 16 }}>
          <SectionTitle title="Icon Buttons" />
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <IconButton icon="heart" variant="primary" onPress={() => {}} />
            <IconButton icon="share" variant="secondary" onPress={() => {}} />
            <IconButton icon="more-vertical" variant="ghost" onPress={() => {}} />
          </View>
        </View>

        <View style={{ gap: 16 }}>
          <SectionTitle title="Cards" />
          <Card variant="elevated">
            <SectionTitle title="Elevated Card" subtitle="Sombra suave" />
          </Card>
          <Card variant="outlined">
            <SectionTitle title="Outlined Card" subtitle="Com borda sutil" />
          </Card>
        </View>

        <View style={{ gap: 16 }}>
          <SectionTitle title="Chips" />
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            <Chip label="Chip Padrão" />
            <Chip label="Chip Ativo" active />
            <Chip label="Com ícone" icon="star" />
          </View>
        </View>

        <View style={{ gap: 16 }}>
          <SectionTitle title="Avatars" />
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <Avatar name="João Silva" size={48} />
            <Avatar name="Maria" size={64} />
          </View>
        </View>

        <View style={{ gap: 16 }}>
          <SectionTitle title="Skeletons" />
          <Skeleton width="100%" height={120} />
          <Skeleton width={80} height={80} borderRadius={40} />
          <Skeleton width="70%" height={24} />
        </View>

        <View style={{ gap: 16 }}>
          <SectionTitle title="Empty State" />
          <Card>
            <EmptyState
              icon="inbox"
              title="Nada por aqui"
              description="Ainda não temos dados para mostrar."
              actionLabel="Adicionar"
              onAction={() => {}}
            />
          </Card>
        </View>

      </ScrollView>
    </Screen>
  );
}
