# 💜 nós. — Nosso Espaço a Dois

<p align="center">
  <img src="assets/images/favicon.png" width="96" height="96" alt="nós icon" style="border-radius: 24px;" />
</p>

<p align="center">
  <strong>Um aplicativo íntimo, elegante e seguro desenvolvido exclusivamente para casais compartilharem suas vidas, memórias e momentos especiais.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Expo-SDK_57-000020?style=for-the-badge&logo=expo" alt="Expo SDK 57" />
  <img src="https://img.shields.io/badge/React_Native-0.86-61DAFB?style=for-the-badge&logo=react" alt="React Native" />
  <img src="https://img.shields.io/badge/Supabase-Database_%26_Auth-3ECF8E?style=for-the-badge&logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/Design-Apple_Liquid_Glass-8E7CE8?style=for-the-badge" alt="Apple Liquid Glass" />
</p>

---

## ✨ Experiência & Funcionalidades

- **💎 Estética Apple Liquid Glass**:
  - Dock flutuante suspensa em pílula vítrea com desfoque nativo (`expo-blur`).
  - Microinterações táteis e resposta háptica em todos os toques (`expo-haptics`).
  - Física fluida e transições elásticas de mola com **React Native Reanimated 4**.
  - Atmosfera com gradientes difusos (Lavanda & Pêssego).

- **⏳ Nossa Jornada (Home)**:
  - Indicador de status "Conectados" com pulsar orgânico em tempo real.
  - Contagem acumulada de tempo juntos em 4 cápsulas translúcidas (Meses, Dias, Horas e Minutos) animadas em cascata.
  - Definição e edição rápida da data de início do relacionamento com persistência no banco.

- **📸 Módulo de Memórias (Galeria Privada)**:
  - Upload direto para bucket privado no Supabase Storage.
  - Segurança reforçada: imagens protegidas com **Signed URLs** temporárias geradas sob demanda.
  - Visualização em cards elegantes com formatação de data localizada (PT-BR).

- **💬 Mensagens & Conexão**:
  - Troca de mensagens em tempo real via canais do **Supabase Realtime**.
  - Balões de conversa no padrão iOS com `KeyboardAvoidingView` e suporte inteligente ao teclado.

- **🗓️ Datas Especiais & Contagem Regressiva**:
  - Hero Card com contagem regressiva em tempo real (dias, horas, minutos e segundos) para o próximo grande evento.
  - Categorização dinâmica (Viagem, Encontro, Comemoração) com histórico de eventos concluídos.

- **👤 Perfil & Identidade do Casal**:
  - Avatares sincronizados lado a lado com indicador de conexão ativa.
  - Troca de foto de perfil via `expo-image-picker`.
  - Código de convite exclusivo para pareamento de contas.
  - Encerramento de sessão seguro e limpeza completa de estado.

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| **Framework** | [React Native](https://reactnative.dev/) com [Expo SDK 57](https://expo.dev/) |
| **Roteamento** | [Expo Router](https://docs.expo.dev/router/introduction/) (File-based routing) |
| **Backend & Autenticação** | [Supabase](https://supabase.com/) (Auth, PostgreSQL, Realtime, Storage) |
| **Animações & Gestos** | [React Native Reanimated 4](https://docs.swmansion.com/react-native-reanimated/) |
| **Efeitos Visuais** | `expo-blur`, `expo-linear-gradient`, `expo-haptics` |
| **Linguagem & Tipagem** | TypeScript |

---

## 🚀 Como Rodar o Projeto no MacBook (macOS)

Siga este passo a passo detalhado para rodar o app no seu MacBook em casa:

### 1. Pré-requisitos no Mac

Certifique-se de ter instalado no seu MacBook:
- **Node.js** (versão 18 ou superior LTS): [nodejs.org](https://nodejs.org/) ou via Homebrew:
  ```bash
  brew install node
  ```
- **Git**:
  ```bash
  brew install git
  ```
- No celular (iPhone ou Android), instale o aplicativo **Expo Go** disponível na App Store ou Google Play Store.
- *(Opcional)* Se quiser rodar no **Simulador iOS do Mac**:
  - Instale o **Xcode** pela Mac App Store.
  - Abra o Xcode uma vez e instale os componentes adicionais solicitados.

---

### 2. Clonando o Repositório

Abra o aplicativo **Terminal** (ou iTerm2) no seu Mac e clone o projeto:

```bash
# 1. Navegue até a pasta onde deseja salvar o projeto
cd ~/Documents

# 2. Clone o repositório
git clone https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git nos-app

# 3. Acesse a pasta do projeto
cd nos-app
```

---

### 3. Instalando as Dependências

Dentro da pasta do projeto no Mac, instale todas as dependências:

```bash
npm install
```

---

### 4. Configurando as Variáveis de Ambiente (`.env`)

Crie o arquivo `.env` na raiz do projeto com as credenciais do Supabase:

```bash
cp .env.example .env
```

Abra o arquivo `.env` no seu editor ou via terminal:
```bash
nano .env
```

Preencha com a URL e a chave pública anon do seu projeto Supabase:
```env
EXPO_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-aqui
```
*(No nano: pressione `Ctrl + O` e `Enter` para salvar, e `Ctrl + X` para sair)*.

---

### 5. Executando o Aplicativo

Para iniciar o servidor de desenvolvimento com o cache limpo:

```bash
npx expo start -c
```

Um QR Code será exibido no seu terminal.

#### 📱 Como abrir no celular:
- **iPhone**: Abra a câmera nativa do iOS, aponte para o QR Code e toque na notificação para abrir no **Expo Go**.
- **Android**: Abra o aplicativo **Expo Go**, toque em *"Scan QR code"* e aponte para a tela.
- *(Dica: Certifique-se de que o MacBook e o celular estejam conectados na mesma rede Wi-Fi de casa)*.

#### 💻 Como abrir no Simulador iOS do Mac:
Com o terminal do `npx expo start` aberto, basta pressionar a tecla **`i`**. O Expo abrirá automaticamente o Simulador do iPhone no seu Mac!

---

## 📂 Estrutura de Pastas

```text
nos-app/
├── app/                  # Telas e rotas (Expo Router)
│   ├── (auth)/           # Rotas de Login e Cadastro
│   ├── (tabs)/           # Abas principais (Início, Mensagens, Memórias, Datas, Perfil)
│   ├── onboarding.tsx    # Tela de criação e pareamento do casal
│   └── _layout.tsx       # Layout raiz e observador de autenticação
├── assets/               # Imagens, ícones e fontes
├── components/           # Componentes reutilizáveis (AnimatedTouchable, etc.)
├── context/              # Contextos globais (AuthContext, CoupleContext)
├── lib/                  # Configurações do Supabase e utilitários de storage
├── .env.example          # Exemplo de configuração de variáveis
├── babel.config.js       # Configuração do compilador Babel e Reanimated
└── package.json          # Dependências e scripts do projeto
```

---

## 🔒 Privacidade e Segurança

Todas as consultas e uploads de arquivos são protegidos no nível de banco de dados via **Row Level Security (RLS)** do PostgreSQL no Supabase. Apenas usuários que pertencem ao mesmo `couple_id` têm permissão de leitura e gravação em suas respectivas mensagens, memórias e datas comemorativas.
