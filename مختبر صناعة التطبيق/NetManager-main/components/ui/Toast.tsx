// مكون Toast/Snackbar للإشعارات
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BorderRadius, Spacing, FontSize } from '@/constants/theme';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  onHide: () => void;
  duration?: number;
}

const TYPE_CONFIG = {
  success: { color: '#00D68F', icon: 'check-circle' as const },
  error: { color: '#FF4D4D', icon: 'error' as const },
  warning: { color: '#FFB800', icon: 'warning' as const },
  info: { color: '#00B4D8', icon: 'info' as const },
};

export function Toast({ visible, message, type = 'success', onHide, duration = 3000 }: ToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const config = TYPE_CONFIG[type];

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.delay(duration),
        Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start(() => onHide());
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { opacity, borderLeftColor: config.color }]}>
      <MaterialIcons name={config.icon} size={20} color={config.color} />
      <Text style={styles.text} numberOfLines={2}>{message}</Text>
      <Pressable onPress={onHide} hitSlop={8}>
        <MaterialIcons name="close" size={18} color="#8F9BB3" />
      </Pressable>
    </Animated.View>
  );
}

// هوك للـ Toast
import { useState, useCallback } from 'react';
export function useToast() {
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as any });
  const show = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setToast({ visible: true, message, type });
  }, []);
  const hide = useCallback(() => setToast(p => ({ ...p, visible: false })), []);
  return { toast, show, hide };
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute', bottom: 100, left: 16, right: 16,
    backgroundColor: '#1A3060', flexDirection: 'row', alignItems: 'center',
    padding: Spacing.md, borderRadius: BorderRadius.md, gap: Spacing.sm,
    borderLeftWidth: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 10,
  },
  text: { flex: 1, color: '#fff', fontSize: FontSize.md, lineHeight: 20 },
});
