# 💜 nós. — Um Espaço Só Nosso

<p align="center">
  <img src="docs/redesign/refs/logo app.png" width="128" height="128" alt="nós. icon" style="border-radius: 32px; box-shadow: 0px 8px 24px rgba(0,0,0,0.12);" />
</p>

<p align="center">
  <strong>Um aplicativo íntimo, refinado e seguro desenvolvido exclusivamente para casais compartilharem suas vidas, memórias e momentos especiais.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Expo-SDK_57-000020?style=for-the-badge&logo=expo" alt="Expo SDK 57" />
  <img src="https://img.shields.io/badge/React_Native-0.86-61DAFB?style=for-the-badge&logo=react" alt="React Native" />
  <img src="https://img.shields.io/badge/Supabase-Auth_%26_PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/Design-Apple_Liquid_Glass-8E7CE8?style=for-the-badge" alt="Apple Liquid Glass" />
</p>

---

## ✨ Design & Experiência

O projeto segue um pilar estético rigoroso inspirado no **Apple Liquid Glass** (Minimalismo de Luxo). Cada componente foi desenhado para transmitir uma atmosfera noturna e serena (Lavanda, Ametista, Pêssego).

- **🪞 Vidro Líquido (Liquid Glass View)**: Blur nativo via `expo-blur` no iOS/Android e `-webkit-backdrop-filter` no PWA/Web. Sombras suaves isoladas do recorte do blur para máxima performance na thread de UI.
- **✨ Física e Motion**: Transições elásticas de mola (`withSpring`), micro-interações em botões e navegação com **React Native Reanimated 4**.
- **📳 Haptics**: Resposta tátil imersiva (`expo-haptics`) integrada harmonicamente às animações.
- **📱 Floating Dock**: Navegação em cápsula flutuante com cálculo dinâmico de `safe-area-inset`, perfeita para o Safari no iPhone (PWA) e dispositivos nativos.
- **🌗 Tema Dinâmico**: Sincronização em tempo real entre o esquema de cores do aparelho e as preferências do casal.

## 🚀 Funcionalidades

- **⏳ Início (Nossa Jornada)**: Contagem acumulada de tempo juntos em cápsulas de vidro com física fluida, status de conexão em tempo real e ações rápidas.
- **💬 Recados (Mensagens)**: Chat em tempo real via **Supabase Realtime**. Balões de mensagem assimétricos (vidro para recebidas, lavanda para enviadas) e teclado inteligente (`KeyboardAvoidingView`).
- **📸 Memórias (Galeria Privada)**: Upload seguro para o Supabase Storage. Visualização editorial de fotografias com cache otimizado.
- **🗓️ Datas & Celebrações**: Hero com contagem regressiva em displays independentes. Barra de progresso do ciclo anual e timeline de marcos do relacionamento.
- **👤 Perfil do Casal**: Avatares integrados e geração de código de convite único seguro para o pareamento de contas.

## 🛠️ Stack e Arquitetura

| Camada | Tecnologia |
|---|---|
| **Core** | [React Native](https://reactnative.dev/) + [Expo SDK 57](https://expo.dev/) + TypeScript Estrito |
| **Roteamento** | [Expo Router](https://docs.expo.dev/router/introduction/) (File-based routing) |
| **Backend** | [Supabase](https://supabase.com/) (Auth, PostgreSQL, Realtime, Storage) |
| **Animações** | [Reanimated 4](https://docs.swmansion.com/react-native-reanimated/) |
| **Design System** | Sistema de tokens customizado (Cores, Tipografia `Plus Jakarta Sans`, Radii, Spacing) |

---

## 🔒 Segurança e Privacidade (RLS)

A aplicação foi projetada do zero pensando na privacidade do casal (duas pessoas).
- **Isolamento de Dados**: Utilização estrita de **Row Level Security (RLS)** no PostgreSQL. Todas as operações de leitura e escrita são validadas contra o `couple_id` do usuário logado.
- **Ponta a Ponta (App)**: Acesso às memórias através de Signed URLs temporárias. Deleção em cascata e estado de `auth` limpo no lado do cliente.

---

## 💻 Como rodar o projeto localmente

### 1. Pré-requisitos
- **Node.js 18+** e **Git** instalados.
- Conta e Projeto configurado no [Supabase](https://supabase.com).

### 2. Instalação
```bash
git clone https://github.com/SEU-USUARIO/nos-app.git
cd nos-app
npm install
```

### 3. Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto:
```env
EXPO_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua-chave-publica
```

### 4. Executando (Web, iOS, Android)
```bash
npx expo start -c
```
- Pressione `i` para abrir no Simulador iOS do Mac.
- Pressione `w` para abrir no Navegador (Web/PWA).
- Use o app **Expo Go** para ler o QR Code no seu celular físico.

---

<p align="center">
  <small><em>"Um espaço só nosso."</em></small>
</p>
