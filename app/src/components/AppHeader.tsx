import { useState } from "react";
import { Appbar, Divider, Menu } from "react-native-paper";
import { useAuth } from "@/lib/auth";
import { palette } from "@/lib/theme";

export function AppHeader({ title }: { title: string }) {
  const { session, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <Appbar.Header style={{ backgroundColor: palette.charcoal }} elevated>
      <Appbar.Content title={title} titleStyle={{ color: "#FFFFFF", fontWeight: "700" }} />
      <Menu
        visible={open}
        onDismiss={() => setOpen(false)}
        anchorPosition="bottom"
        anchor={<Appbar.Action icon="account-circle" color="#FFFFFF" accessibilityLabel="Account menu" onPress={() => setOpen(true)} />}
      >
        <Menu.Item leadingIcon="account" title={session?.user.name ?? "Rider"} disabled />
        {session?.user.vehicle ? <Menu.Item leadingIcon="moped" title={session.user.vehicle} disabled /> : null}
        <Divider />
        <Menu.Item
          leadingIcon="logout"
          title="Sign out"
          onPress={() => {
            setOpen(false);
            void signOut();
          }}
        />
      </Menu>
    </Appbar.Header>
  );
}
