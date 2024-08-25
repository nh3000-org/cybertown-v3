import { Messages } from "./Messages";
import { useRooms } from "@/hooks/queries/useRooms";
import { Participants } from "./Participants";
import { useState } from "react";
import { User } from "@/types";
import * as Tabs from '@radix-ui/react-tabs';
import { Settings as SettingsIcon, Mail as MessagesIcon } from 'lucide-react';
import { WelcomeMessage } from "./WelcomeMessage";
import { useAppStore } from "@/stores/appStore";

type Props = {
  roomID: number
}

export function Room(props: Props) {
  const { data: rooms, isLoading } = useRooms()
  const room = rooms?.find(room => room.id === props.roomID)
  const [pm, setPM] = useState<User | null>(null)
  const user = useAppStore().user
  const [tab, setTab] = useState("messages")

  return (
    <main className="h-full w-full p-4 grid grid-cols-[1fr_400px] bg-sidebar gap-4">
      <div className="border border-border rounded-md bg-bg flex flex-col">
        <div className="min-h-[100px]">
        </div>
        <div className="flex-1 border-y border-border flex items-center justify-center">
          {room?.welcomeMessage && (
            <p className="text-yellow-500 max-w-[500px]">
              {room.welcomeMessage.replace('{username}', user?.username ?? '')}
            </p>
          )}
        </div>
        <div className="min-h-[100px] p-4">
          {(!isLoading && room) && <Participants room={room} setPM={setPM} setTab={setTab} />}
        </div>
      </div>
      <div className="border border-border rounded-md bg-bg overflow-hidden">
        <Tabs.Root className="flex flex-col h-full" value={tab} onValueChange={setTab}>
          <Tabs.List className="flex justify-between border-b border-border p-1">
            <Tabs.Trigger value="messages" className="px-2 py-1 rounded-md flex-1 text-muted data-[state=active]:bg-highlight/30 data-[state=active]:text-fg data-[state=active]:ring-0 flex gap-2 items-center justify-center">
              <MessagesIcon size={18} className="text-muted" />
              <p>Messages</p>
            </Tabs.Trigger>
            <Tabs.Trigger value="settings" className="px-2 py-1 rounded-md flex-1 text-muted data-[state=active]:bg-highlight/30 data-[state=active]:text-fg data-[state=active]:ring-0 flex gap-2 items-center justify-center">
              <SettingsIcon size={18} className="text-muted" />
              <p>Settings</p>
            </Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content asChild value="messages">
            <Messages pm={pm} setPM={setPM} />
          </Tabs.Content>
          <Tabs.Content asChild value="settings">
            <div className="p-4 focus:outline-none">
              {room && <WelcomeMessage room={room} />}
            </div>
          </Tabs.Content>
        </Tabs.Root>
      </div>
    </main>
  )
}
