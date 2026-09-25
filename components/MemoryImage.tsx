import React, { useEffect, useState } from 'react';
import {
  Image,
  ImageProps,
  View,
  StyleSheet,
  ActivityIndicator,
  StyleProp,
  ImageStyle,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCachedSignedMemoryUrl, getSignedMemoryUrl } from '../lib/storage';

interface MemoryImageProps extends Omit<ImageProps, 'source'> {
  path?: string | null;
  fallbackIcon?: keyof typeof Ionicons.glyphMap;
  placeholderColor?: string;
  showLoadingIndicator?: boolean;
}

export const MemoryImage: React.FC<MemoryImageProps> = ({
  path,
  style,
  fallbackIcon = 'images-outline',
  placeholderColor = 'rgba(142, 124, 232, 0.08)',
  showLoadingIndicator = true,
  resizeMode = 'cover',
  ...rest
}) => {
  const [signedUrl, setSignedUrl] = useState<string | null>(() =>
    getCachedSignedMemoryUrl(path)
  );
  const [loading, setLoading] = useState<boolean>(!signedUrl && !!path);
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    if (!path) {
      setSignedUrl(null);
      setLoading(false);
      return;
    }

    const cached = getCachedSignedMemoryUrl(path);
    if (cached) {
      setSignedUrl(cached);
      setLoading(false);
      return;
    }

    setLoading(true);
    setHasError(false);

    getSignedMemoryUrl(path)
      .then((url) => {
        if (!isMounted) return;
        if (url) {
          setSignedUrl(url);
        } else {
          setHasError(true);
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setHasError(true);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [path]);

  // Se não houver path ou falhou ao resolver signed url
  if (!path || hasError) {
    return (
      <View
        style={[
          styles.placeholderContainer,
          { backgroundColor: placeholderColor },
          style as ViewStyle,
        ]}
      >
        <Ionicons name={fallbackIcon} size={24} color="#8E7CE8" />
      </View>
    );
  }

  // Enquanto carrega a signed URL pela primeira vez (se não estava em cache)
  if (loading && !signedUrl) {
    return (
      <View
        style={[
          styles.placeholderContainer,
          { backgroundColor: placeholderColor },
          style as ViewStyle,
        ]}
      >
        {showLoadingIndicator ? (
          <ActivityIndicator size="small" color="#8E7CE8" />
        ) : (
          <Ionicons name={fallbackIcon} size={24} color="#8E7CE8" />
        )}
      </View>
    );
  }

  return (
    <Image
      source={{ uri: signedUrl || undefined }}
      style={style}
      resizeMode={resizeMode}
      onError={() => setHasError(true)}
      {...rest}
    />
  );
};

const styles = StyleSheet.create({
  placeholderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
