import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />

        {/* Tipografia: Plus Jakarta Sans (Google Fonts) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />

        {/* PWA Tags for iOS */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        
        {/*
          Disable body scrolling on web. This makes ScrollView components work closer to how they do on native.
          However, body scrolling is often nice to have for web. If you want to enable it, remove this line.
        */}
        <ScrollViewStyleReset />

        {/* PWA iOS: garante que a raiz cubra a viewport inteira, inclusive sob o indicador de início */}
        <style
          dangerouslySetInnerHTML={{
            __html:
              'html,body{height:100%;min-height:-webkit-fill-available}#root{height:100%;min-height:100dvh}' +
              '[tabindex]:focus-visible,a:focus-visible,button:focus-visible{outline:2px solid #7C6FE0;outline-offset:2px;box-shadow:0 0 0 5px rgba(255,255,255,.75)}' +
              '@media (prefers-color-scheme:dark){[tabindex]:focus-visible,a:focus-visible,button:focus-visible{outline-color:#B3A7F5;box-shadow:0 0 0 5px rgba(21,18,42,.8)}}',
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
