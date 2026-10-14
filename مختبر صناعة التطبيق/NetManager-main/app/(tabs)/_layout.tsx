// تخطيط التبويبات - مع إضافة تبويب "الجيران"
import { MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform } from 'react-native';
import { useApp, useColors } from '@/hooks/useApp';
import { translations } from '@/constants/i18n';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { lang } = useApp();
  const colors = useColors();
  const nav = translations.nav;

  const tabBarStyle = {
    height: Platform.select({ ios: insets.bottom + 60, android: insets.bottom + 60, default: 70 }),
    paddingTop: 8,
    paddingBottom: Platform.select({ ios: insets.bottom + 8, android: insets.bottom + 8, default: 8 }),
    paddingHorizontal: 2,
    backgroundColor: colors.header,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginBottom: 2 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: nav.home[lang],
          tabBarIcon: ({ color, size }) => <MaterialIcons name="dashboard" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="networks"
        options={{
          title: nav.networks[lang],
          tabBarIcon: ({ color, size }) => <MaterialIcons name="lan" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: nav.search[lang],
          tabBarIcon: ({ color, size }) => <MaterialIcons name="search" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="neighbors"
        options={{
          title: lang === 'ar' ? 'الجيران' : 'Neighbors',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="device-hub" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: nav.reports[lang],
          tabBarIcon: ({ color, size }) => <MaterialIcons name="assessment" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: nav.settings[lang],
          tabBarIcon: ({ color, size }) => <MaterialIcons name="settings" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
