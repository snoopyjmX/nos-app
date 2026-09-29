import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

/**
 * Custom root HTML for Web and iOS Safari PWA Standalone Mode
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"
        />

        {/* Nome do Aplicativo */}
        <title>NÓS — Um espaço só nosso</title>
        <meta name="description" content="Um espaço só nosso." />
        <meta name="application-name" content="NÓS" />

        {/* iOS Safari PWA (Remove guias, URLs e habilita modo Standalone) */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="NÓS" />

        {/* Cores de Tema da Barra de Sistema */}
        <meta name="theme-color" content="#0F0D18" />
        <meta name="msapplication-navbutton-color" content="#0F0D18" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

        {/* Ícone da Tela de Início no iPhone (Add to Home Screen) */}
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />

        {/* Favicon & Web Manifest */}
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="manifest" href="/manifest.json" />

        {/* Estilo base do Expo Router */}
        <ScrollViewStyleReset />

        {/* Estilos para experiência fluida nativa no iOS Safari */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              html, body, #root {
                height: 100%;
                width: 100%;
                background-color: #0F0D18;
                user-select: none;
                -webkit-user-select: none;
                -webkit-touch-callout: none;
                -webkit-tap-highlight-color: transparent;
                overscroll-behavior-y: none;
              }
              /* Garante que safe areas fiquem preenchidas */
              body {
                margin: 0;
                padding: 0;
                overflow: hidden;
              }
              /* Evita seleção acidental de texto durante toques */
              input, textarea {
                user-select: auto;
                -webkit-user-select: auto;
              }
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
