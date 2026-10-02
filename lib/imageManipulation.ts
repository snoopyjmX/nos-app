import { Platform } from 'react-native';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

/**
 * Normaliza a imagem (orientação EXIF e proporção) e a comprime.
 * - No nativo: `manipulateAsync` já aplica a orientação nos pixels e remove os metadados EXIF na saída.
 * - Na web: `createImageBitmap` com `imageOrientation: 'from-image'` aplica a orientação EXIF.
 * Em ambos, preserva-se a proporção original omitindo a altura no redimensionamento.
 */
export async function normalizeAndCompressImage(
  uri: string,
  targetWidth: number,
  quality: number = 0.8
): Promise<string> {
  if (Platform.OS === 'web') {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();

      // createImageBitmap com 'from-image' resolve a orientação EXIF nos pixels no navegador.
      const bitmap = await createImageBitmap(blob, { imageOrientation: 'from-image' });

      // Calcula as dimensões mantendo a proporção original
      const scale = targetWidth / bitmap.width;
      const finalWidth = targetWidth;
      const finalHeight = Math.round(bitmap.height * scale);

      const canvas = document.createElement('canvas');
      canvas.width = finalWidth;
      canvas.height = finalHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Canvas 2D não suportado neste navegador.');
      }

      ctx.drawImage(bitmap, 0, 0, finalWidth, finalHeight);

      // Converte o canvas para Blob JPEG (sem EXIF)
      return new Promise<string>((resolve, reject) => {
        canvas.toBlob(
          (newBlob) => {
            if (newBlob) {
              // Retorna uma URI temporária para o blob processado
              resolve(URL.createObjectURL(newBlob));
            } else {
              reject(new Error('Falha ao gerar o blob da imagem.'));
            }
          },
          'image/jpeg',
          quality
        );
      });
    } catch (error) {
      console.warn('Erro ao processar imagem no web:', error);
      // Fallback: tenta rodar o manipulateAsync caso o createImageBitmap falhe (embora no web o manipulateAsync possa ter o bug do EXIF dependendo da engine)
      const fallback = await manipulateAsync(
        uri,
        [{ resize: { width: targetWidth } }],
        { compress: quality, format: SaveFormat.JPEG }
      );
      return fallback.uri;
    }
  } else {
    // Nativo (iOS/Android): manipulateAsync lê a imagem, rotaciona conforme o EXIF, redimensiona mantendo aspecto e salva sem EXIF.
    const manipulated = await manipulateAsync(
      uri,
      [{ resize: { width: targetWidth } }],
      { compress: quality, format: SaveFormat.JPEG }
    );
    return manipulated.uri;
  }
}
