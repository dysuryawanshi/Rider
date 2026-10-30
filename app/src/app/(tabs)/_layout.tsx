import { Tabs } from "expo-router";
import { Icon } from "react-native-paper";
import { palette } from "@/lib/theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.red,
        tabBarInactiveTintColor: palette.textMuted,
        tabBarStyle: { backgroundColor: palette.surface, borderTopColor: "#E1E4E9" },
        tabBarLabelStyle: { fontWeight: "600" },
        sceneStyle: { backgroundColor: palette.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Available",
          tabBarIcon: ({ color, size }) => <Icon source="clipboard-list-outline" color={String(color)} size={size} />,
        }}
      />
      <Tabs.Screen
        name="active"
        options={{
          title: "Active",
          tabBarIcon: ({ color, size }) => <Icon source="moped" color={String(color)} size={size} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color, size }) => <Icon source="history" color={String(color)} size={size} />,
        }}
      />
    </Tabs>
  );
}
