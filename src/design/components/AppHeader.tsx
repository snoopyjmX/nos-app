import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { AnimatedTouchable } from '@/design/components/AnimatedTouchable';
import { NotificationsModal } from '@/design/components/NotificationsModal';
import { useAppTheme } from '@/lib/context/ThemeContext';

interface AppHeaderProps {
  sectionTitle?: string;
  coupleSubtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  showNotification?: boolean;
  rightAction?: React.ReactNode;
  containerStyle?: any;
}

export function AppHeader({
  sectionTitle,
  coupleSubtitle,
  showBack = false,
  onBack,
  showNotification = false,
  rightAction,
  containerStyle,
}: AppHeaderProps) {
  const { isDark } = useAppTheme();
  const [notifModalVisible, setNotifModalVisible] = useState(false);

  const handleOpenNotifications = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setNotifModalVisible(true);
  };

  return (
    <>
      <View style={[styles.header, containerStyle]}>
        <View style={styles.leftContainer}>
          {showBack && onBack && (
            <AnimatedTouchable
              style={[
                styles.glassCircleButton,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(124, 111, 224, 0.08)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(255, 255, 255, 0.75)',
                  borderTopColor: isDark ? 'rgba(255, 255, 255, 0.28)' : 'rgba(255, 255, 255, 0.95)',
                },
              ]}
              onPress={onBack}
              accessibilityLabel="Voltar"
            >
              <LinearGradient
                colors={
                  isDark
                    ? ['rgba(255, 255, 255, 0.16)', 'transparent']
                    : ['rgba(255, 255, 255, 0.70)', 'transparent']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 0.8 }}
                style={styles.specularHighlight}
                pointerEvents="none"
              />
              <Ionicons name="arrow-back" size={20} color={isDark ? '#F7F5FF' : '#16151E'} />
            </AnimatedTouchable>
          )}

          <View style={styles.brandWrapper}>
            <Text style={[styles.brandTitle, { color: isDark ? '#A797FF' : '#7C3AED' }]}>nós.</Text>
            {coupleSubtitle ? (
              <Text
                style={[styles.coupleSubtitle, { color: isDark ? '#AAA5B8' : '#7E7699' }]}
                numberOfLines={2}
              >
                {coupleSubtitle}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.rightContainer}>
          {rightAction ? (
            rightAction
          ) : showNotification ? (
            <AnimatedTouchable
              style={[
                styles.glassCircleButton,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(124, 111, 224, 0.08)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(255, 255, 255, 0.75)',
                  borderTopColor: isDark ? 'rgba(255, 255, 255, 0.28)' : 'rgba(255, 255, 255, 0.95)',
                },
              ]}
              onPress={handleOpenNotifications}
              accessibilityLabel="Notificações"
            >
              <LinearGradient
                colors={
                  isDark
                    ? ['rgba(255, 255, 255, 0.16)', 'transparent']
                    : ['rgba(255, 255, 255, 0.70)', 'transparent']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 0.8 }}
                style={styles.specularHighlight}
                pointerEvents="none"
              />
              <Ionicons
                name="notifications-outline"
                size={20}
                color={isDark ? '#A797FF' : '#6A56A8'}
              />
              {/* Badge indicativo de atividade */}
              <View style={styles.notifDot} />
            </AnimatedTouchable>
          ) : null}
        </View>
      </View>

      {/* Modal de Alertas e Notificações do Casal */}
      <NotificationsModal
        visible={notifModalVisible}
        onClose={() => setNotifModalVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 6,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },
  brandWrapper: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 29,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  coupleSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 1,
  },
  rightContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    flexShrink: 0,
    marginLeft: 8,
  },
  glassCircleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: '#5B4294',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 3,
    position: 'relative',
  },
  specularHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '60%',
    borderRadius: 22,
  },
  notifDot: {
    position: 'absolute',
    top: 9,
    right: 11,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#7C3AED',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
});
