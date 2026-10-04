import React, { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { View, StyleSheet, Platform, Keyboard } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDockInset, useDockTop } from '@/lib/hooks/useDockInset';
import { useReducedMotion } from 'react-native-reanimated';
import { useAuth } from '@/lib/context/AuthContext';
import { useCouple } from '@/lib/context/CoupleContext';
import { useTheme } from '@/theme';

import { useMessages } from '@/features/messages/api/useMessages';
import { MessagesHeader } from '@/features/messages/components/MessagesHeader';
import { PinnedNote } from '@/features/messages/components/PinnedNote';
import { MessageInput, getInputOffset } from '@/features/messages/components/MessageInput';
import { isSameDay, formatDaySeparator } from '@/features/messages/utils/dateFormatting';
import { MessagesSkeleton } from '@/features/messages/components/MessagesSkeleton';
import { MessageList } from '@/features/messages/components/MessageList';

export default function MessagesScreen() {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const { user } = useAuth();
  const { coupleId } = useCouple();
  const insets = useSafeAreaInsets();
  // PWA iOS: insets.top pode vir 0 e colar o header na barra de status; a web ganha um piso de 47 (notch do iPhone 12).
  const safeTop = Math.max(insets.top, Platform.OS === 'web' ? 47 : 0);
  const dockInset = useDockInset();
  const dockTop = useDockTop();
  const { colors, spacing } = useTheme();
  const reducedMotion = useReducedMotion();

  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [visualKeyboardHeight, setVisualKeyboardHeight] = useState(0);
  const [nativeKeyboardHeight, setNativeKeyboardHeight] = useState(0);
  const [topOverlayHeight, setTopOverlayHeight] = useState(0);
  const [inputHeight, setInputHeight] = useState(0);
  const [isNoteMode, setIsNoteMode] = useState(false);
  const [focusSignal, setFocusSignal] = useState(0);

  const flatListRef = useRef<any>(null);

  const {
    messages,
    profileMap,
    loading,
    loadingOlder,
    hasMoreOlder,
    sending,
    latestNote,
    noteLoaded,
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

    const showSub = Keyboard.addListener(showEvent, (event) => {
      setNativeKeyboardHeight(event.endCoordinates.height);
      setIsKeyboardVisible(true);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      setNativeKeyboardHeight(0);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const handleGoBack = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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

  // Bilhete fixo no topo: último bilhete (is_note) do casal; "do dia" só quando é de hoje.
  // Sem bilhete, mostra o estado vazio; antes da consulta terminar, não mostra nada.
  const pinnedNote = useMemo(() => {
    if (latestNote) {
      const isToday = isSameDay(latestNote.created_at, new Date().toISOString());
      const isMine = latestNote.created_by === user?.id;
      const authorName = isMine ? 'Você' : partnerName;
      return {
        label: isToday ? 'Bilhete do dia' : isMine ? 'Seu último bilhete' : `Último bilhete de ${partnerName}`,
        content: latestNote.content,
        meta: `${authorName} · ${formatDaySeparator(latestNote.created_at)}`,
      };
    }
    return noteLoaded ? { label: 'Bilhete do dia' } : null;
  }, [latestNote, noteLoaded, partnerName, user?.id]);

  // Vindo do atalho "Recado" da Home: abre já em modo bilhete e com o teclado.
  useEffect(() => {
    if (mode !== 'note') return;
    setIsNoteMode(true);
    setFocusSignal((value) => value + 1);
    router.setParams({ mode: undefined });
  }, [mode, router]);

  const handleSend = async () => {
    const wasNote = isNoteMode;
    if (wasNote) setIsNoteMode(false);
    const delivered = await handleSendMessage(flatListRef, wasNote);
    if (!delivered && wasNote) setIsNoteMode(true);
  };

  const keyboardHeight = Platform.OS === 'web' ? visualKeyboardHeight : nativeKeyboardHeight;
  const inputOffset = getInputOffset(isKeyboardVisible, keyboardHeight, dockTop);
  // A última mensagem fica sempre acima do input flutuante (e da dock, com o teclado fechado).
  const listBottomInset = Math.max(dockInset, inputOffset + inputHeight + spacing[8]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.contentFlex}>
        {loading ? (
          <MessagesSkeleton topInset={topOverlayHeight} />
        ) : (
          <MessageList
            topInset={topOverlayHeight}
            bottomInset={listBottomInset}
            messages={messages}
            user={user}
            profileMap={profileMap}
            loadingOlder={loadingOlder}
            isInitialLoadDoneRef={isInitialLoadDoneRef}
            initialMessageIdsRef={initialMessageIdsRef}
            reducedMotion={reducedMotion}
            flatListRef={flatListRef}
            handleScroll={handleScroll}
            handleContentSizeChange={handleContentSizeChange}
          />
        )}
      </View>

      <View
        style={styles.topOverlay}
        onLayout={(event) => setTopOverlayHeight(event.nativeEvent.layout.height)}
        pointerEvents="box-none"
      >
        <MessagesHeader
          topInset={safeTop}
          onGoBack={handleGoBack}
          partnerName={partnerName}
          partnerAvatarUri={partnerProfile?.avatar_url}
        />
        {/* Fixo sob o header; sua altura entra em topOverlayHeight e empurra a lista. */}
        {pinnedNote ? (
          <View style={{ paddingHorizontal: spacing[16], marginTop: spacing[8] }}>
            <PinnedNote {...pinnedNote} />
          </View>
        ) : null}
      </View>

      <MessageInput
        inputText={inputText}
        setInputText={setInputText}
        sending={sending}
        onSend={handleSend}
        isNoteMode={isNoteMode}
        onToggleNoteMode={() => setIsNoteMode((value) => !value)}
        focusSignal={focusSignal}
        isKeyboardVisible={isKeyboardVisible}
        keyboardHeight={keyboardHeight}
        dockTop={dockTop}
        onLayout={(event) => setInputHeight(event.nativeEvent.layout.height)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentFlex: { flex: 1 },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 30,
  },
});
