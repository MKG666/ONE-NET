// حقل إدخال مخصص
import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, Pressable, TextInputProps } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useApp';
import { BorderRadius, Spacing, FontSize } from '@/constants/theme';

interface InputFieldProps extends TextInputProps {
  label?: string;
  error?: string;
  rightIcon?: keyof typeof MaterialIcons.glyphMap;
  onRightIconPress?: () => void;
  isPassword?: boolean;
  hint?: string;
  borderColor?: string; // لون الإطار المخصص (للتحقق من التكرار)
}

export function InputField({ label, error, rightIcon, onRightIconPress, isPassword, hint, style, borderColor, ...props }: InputFieldProps) {
  const colors = useColors();
  const [showPass, setShowPass] = useState(false);

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text> : null}
      <View style={[
        styles.inputWrap,
        { backgroundColor: colors.surfaceVariant, borderColor: error ? colors.error : (borderColor || colors.cardBorder) },
      ]}>
        <TextInput
          style={[
            styles.input,
            { color: colors.text },
            style as any,
          ]}
          placeholderTextColor={colors.textSecondary}
          secureTextEntry={isPassword && !showPass}
          {...props}
        />
        {isPassword ? (
          <Pressable onPress={() => setShowPass(p => !p)} hitSlop={8}>
            <MaterialIcons name={showPass ? 'visibility' : 'visibility-off'} size={20} color={colors.textSecondary} />
          </Pressable>
        ) : rightIcon ? (
          <Pressable onPress={onRightIconPress} hitSlop={8}>
            <MaterialIcons name={rightIcon} size={20} color={colors.primary} />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}
      {hint && !error ? <Text style={[styles.hint, { color: colors.textSecondary }]}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 4, marginBottom: Spacing.sm },
  label: { fontSize: FontSize.sm, fontWeight: '500', marginLeft: 2 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    gap: Spacing.xs,
  },
  input: { flex: 1, fontSize: FontSize.md, includeFontPadding: false, minHeight: 22 },
  error: { fontSize: FontSize.xs, marginLeft: 2 },
  hint: { fontSize: FontSize.xs, marginLeft: 2 },
});
