import { logger } from './logger';
import { Platform } from 'react-native';
import { manipulateAsync, SaveFormat, Action } from 'expo-image-manipulator';

export async function normalizeAndCompressImage(
  uri: string,
  targetWidth: number,
  quality: number = 0.8,
  cropSquare: boolean = false,
  originalWidth: number = 0,
  originalHeight: number = 0
): Promise<string> {
  if (Platform.OS === 'web') {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();

      const bitmap = await createImageBitmap(blob, { imageOrientation: 'from-image' });

      let sourceX = 0;
      let sourceY = 0;
      let sourceSize = bitmap.width;

      if (cropSquare) {
        sourceSize = Math.min(bitmap.width, bitmap.height);
        sourceX = Math.round((bitmap.width - sourceSize) / 2);
        sourceY = Math.round((bitmap.height - sourceSize) / 2);
      } else {
        sourceSize = bitmap.width;
      }

      const finalWidth = targetWidth;
      const finalHeight = cropSquare ? targetWidth : Math.round(bitmap.height * (targetWidth / bitmap.width));

      const canvas = document.createElement('canvas');
      canvas.width = finalWidth;
      canvas.height = finalHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 2D não suportado.');

      if (cropSquare) {
        ctx.drawImage(bitmap, sourceX, sourceY, sourceSize, sourceSize, 0, 0, finalWidth, finalHeight);
      } else {
        ctx.drawImage(bitmap, 0, 0, finalWidth, finalHeight);
      }

      return new Promise<string>((resolve, reject) => {
        canvas.toBlob(
          (newBlob) => {
            if (newBlob) resolve(URL.createObjectURL(newBlob));
            else reject(new Error('Falha ao gerar o blob da imagem.'));
          },
          'image/jpeg',
          quality
        );
      });
    } catch (error) {
      logger.warn('Erro ao processar imagem no web:', error);
      return uri; // fallback simples
    }
  } else {
    const actions: Action[] = [];

    // Se precisamos forçar o quadrado e temos dimensões reais
    if (cropSquare && originalWidth > 0 && originalHeight > 0) {
      const minDim = Math.min(originalWidth, originalHeight);
      const originX = Math.round((originalWidth - minDim) / 2);
      const originY = Math.round((originalHeight - minDim) / 2);
      
      actions.push({
        crop: {
          originX,
          originY,
          width: minDim,
          height: minDim,
        }
      });
    }

    actions.push({ resize: { width: targetWidth } });

    const manipulated = await manipulateAsync(uri, actions, { compress: quality, format: SaveFormat.JPEG });
    return manipulated.uri;
  }
}
