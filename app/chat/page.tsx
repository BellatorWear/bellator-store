import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/actions";
import { getSetting, CHAT_ROLE_ACCESS_KEY } from "@/app/utils/settings";
import { hasChatAccess, CHAT_ROLE_ACCESS_DEFAULT } from "@/app/admin/permissions";
import { listMyChannels } from "./actions";
import ChatClient from "./ChatClient";

export const metadata = { title: "Team-Chat — Bellator Streetwear" };

export default async function ChatPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const roleDefaults = await getSetting(CHAT_ROLE_ACCESS_KEY, CHAT_ROLE_ACCESS_DEFAULT);
  if (!hasChatAccess(user, roleDefaults)) redirect("/");

  const channels = await listMyChannels();

  return (
    <ChatClient
      currentUser={{ id: user.id, username: user.username, isAdmin: user.isAdmin }}
      initialChannels={channels}
    />
  );
}
