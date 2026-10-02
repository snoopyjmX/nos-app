import React, { useEffect, useRef, useCallback, useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useReducedMotion } from 'react-native-reanimated';
import { useAuth } from '@/lib/context/AuthContext';
import { useCouple } from '@/lib/context/CoupleContext';
import { useTheme } from '@/theme';
import { useTabBarHeight } from '@/lib/hooks/useTabBarHeight';

import { useMessages } from '@/features/messages/api/useMessages';
import { MessagesHeader } from '@/features/messages/components/MessagesHeader';
import { MessageInput } from '@/features/messages/components/MessageInput';
import { MessagesSkeleton } from '@/features/messages/components/MessagesSkeleton';
import { MessageList } from '@/features/messages/components/MessageList';

export default function MessagesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { coupleId } = useCouple();
  const insets = useSafeAreaInsets();
  const { colors, typography, isDark } = useTheme();
  const { tabBarHeight } = useTabBarHeight();
  const reducedMotion = useReducedMotion();

  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [visualKeyboardHeight, setVisualKeyboardHeight] = useState(0);

  const flatListRef = useRef<any>(null);

  const {
    messages,
    profileMap,
    loading,
    loadingOlder,
    hasMoreOlder,
    sending,
    inputText,
    setInputText,
    initRealtime,
    loadOlderMessages,
    handleSendMessage,
    isInitialLoadDoneRef,
    initialMessageIdsRef,
    isPrependRef,
    previousScrollYRef,
    previousScrollHeightRef,
  } = useMessages(coupleId, user);

  useEffect(() => {
    const cleanup = initRealtime(flatListRef);
    return cleanup;
  }, [initRealtime]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, () => {
      setIsKeyboardVisible(true);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || !window.visualViewport) {
      return;
    }

    const vv = window.visualViewport;
    const handleViewportChange = () => {
      if (!vv) return;
      const offset = Math.max(0, window.innerHeight - vv.height);
      setVisualKeyboardHeight(offset);
      if (offset > 120) {
        setIsKeyboardVisible(true);
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } else {
        setIsKeyboardVisible(false);
      }
    };

    vv.addEventListener('resize', handleViewportChange);
    vv.addEventListener('scroll', handleViewportChange);

    return () => {
      vv.removeEventListener('resize', handleViewportChange);
      vv.removeEventListener('scroll', handleViewportChange);
    };
  }, []);

  const handleScroll = useCallback(
    (event: any) => {
      const { contentOffset } = event.nativeEvent;
      previousScrollYRef.current = contentOffset.y;
      if (
        contentOffset.y <= 50 &&
        hasMoreOlder &&
        !loadingOlder &&
        !loading &&
        isInitialLoadDoneRef.current
      ) {
        loadOlderMessages();
      }
    },
    [hasMoreOlder, loading, loadingOlder, loadOlderMessages]
  );

  const handleContentSizeChange = useCallback(
    (_newWidth: number, newHeight: number) => {
      if (isPrependRef.current) {
        const deltaY = newHeight - previousScrollHeightRef.current;
        if (deltaY > 0) {
          flatListRef.current?.scrollToOffset({
            offset: previousScrollYRef.current + deltaY,
            animated: false,
          });
        }
        isPrependRef.current = false;
      }
      previousScrollHeightRef.current = newHeight;
    },
    []
  );

  const handleGoBack = () => {
    Keyboard.dismiss();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  const partnerId = Array.from(profileMap.keys()).find(id => id !== user?.id);
  const partnerProfile = partnerId ? profileMap.get(partnerId) : null;
  const partnerName = partnerProfile?.name ? partnerProfile.name.split(' ')[0] : 'Meu Amor';
  const presenceText = 'Online agora'; // Presença opcional exibida

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        style={styles.keyboardAvoid}
      >
        <View style={styles.contentFlex}>
          {loading ? (
            <MessagesSkeleton insets={insets} />
          ) : (
            <MessageList
              messages={messages}
              user={user}
              profileMap={profileMap}
              loadingOlder={loadingOlder}
              isInitialLoadDoneRef={isInitialLoadDoneRef}
              initialMessageIdsRef={initialMessageIdsRef}
              reducedMotion={reducedMotion}
              insets={insets}
              flatListRef={flatListRef}
              handleScroll={handleScroll}
              handleContentSizeChange={handleContentSizeChange}
            />
          )}
        </View>

        <MessagesHeader
          insets={insets}
          onGoBack={handleGoBack}
          partnerName={partnerName}
          presenceText={presenceText}
        />

        <MessageInput
          inputText={inputText}
          setInputText={setInputText}
          sending={sending}
          onSend={() => handleSendMessage(flatListRef)}
          isKeyboardVisible={isKeyboardVisible}
          visualKeyboardHeight={visualKeyboardHeight}
          tabBarHeight={tabBarHeight}
        />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardAvoid: { flex: 1 },
  contentFlex: { flex: 1 },
});
