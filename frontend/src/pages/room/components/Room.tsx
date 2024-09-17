import { Messages } from "@/components/messages";
import { useRooms } from "@/hooks/queries/useRooms";
import { Participants } from "./Participants";
import { useState } from "react";
import { User } from "@/types";
import * as Tabs from '@radix-ui/react-tabs';
import { Settings as SettingsIcon, Mail as MessagesIcon, SquarePen as PencilIcon, Webhook as WebhookIcon } from 'lucide-react';
import { WelcomeMessage } from "./WelcomeMessage";
import { useAppStore } from "@/stores/appStore";
import { Status } from "./Status";
import { useDMs } from "@/hooks/queries/useDMs";
import { Social } from "@/components/social";
import { Tooltip } from "@/components/Tooltip";

type Props = {
  roomID: number
}

export function Room(props: Props) {
  const dmUnread = useAppStore().dmUnread
  const { data: rooms, isLoading } = useRooms()
  const room = rooms?.find(room => room.id === props.roomID)
  const [pm, setPM] = useState<User | null>(null)
  const user = useAppStore().user
  const [tab, setTab] = useState("messages")
  const setUpdateRoom = useAppStore().setCreateOrUpdateRoom
  const messages = useAppStore().messages
  const isHost = room?.settings.host.id === user?.id
  useDMs(Boolean(user))
  const hasUnread = Object.values(dmUnread).some(isUnread => isUnread)

  if (!room) {
    return
  }

  return (
    <main className="h-full w-full p-4 grid grid-cols-[1fr_400px] bg-sidebar gap-4">
      <div className="border border-border rounded-md bg-bg flex flex-col">
        <div className="min-h-[100px]">
        </div>
        <div className="flex-1 border-y border-border flex items-center justify-center">
          {room.settings.welcomeMessage && (
            <p className="text-yellow-500 max-w-[500px] px-4 whitespace-pre-wrap">
              {room.settings.welcomeMessage.replace('{username}', user?.username ?? '')}
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
            <Tabs.Trigger value="messages" className="px-2 py-1 rounded-md flex-1 text-muted data-[state=active]:bg-highlight/30 data-[state=active]:text-fg data-[state=active]:ring-0 flex gap-2 items-center justify-center" asChild>
              <Tooltip title="Messages">
                <MessagesIcon size={18} className="text-muted" />
              </Tooltip>
            </Tabs.Trigger>
            <Tabs.Trigger value="social" className="px-2 py-1 rounded-md flex-1 text-muted data-[state=active]:bg-highlight/30 data-[state=active]:text-fg data-[state=active]:ring-0 flex gap-2 items-center justify-center" asChild>
              <Tooltip title="Social">
                <WebhookIcon size={18} className="text-muted" />
                {hasUnread && <span className="w-2 h-2 rounded-full rounded-full block bg-danger" />}
              </Tooltip>
            </Tabs.Trigger>
            <Tabs.Trigger value="settings" className="px-2 py-1 rounded-md flex-1 text-muted data-[state=active]:bg-highlight/30 data-[state=active]:text-fg data-[state=active]:ring-0 flex gap-2 items-center justify-center" asChild>
              <Tooltip title="Settings">
                <SettingsIcon size={18} className="text-muted" />
              </Tooltip>
            </Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content asChild value="messages">
            {room && <Messages pm={pm} setPM={setPM} room={room} messages={messages} dm={null} prevMsg={null} />}
          </Tabs.Content>
          <Tabs.Content asChild value="social">
            <div className="flex-1 h-full overflow-hidden focus:outline-none">
              <Social hasUnread={hasUnread} />
            </div>
          </Tabs.Content>
          <Tabs.Content asChild value="settings">
            <div className="flex-1 p-4 focus:outline-none flex flex-col gap-6">
              <WelcomeMessage room={room} />
              <Status room={room} />
              {isHost && (
                <button onClick={() => {
                  setUpdateRoom(true, room)
                }} className="mt-auto p-2 rounded-full border border-border self-end shadow">
                  <PencilIcon size={20} className="text-muted" />
                </button>
              )}
            </div>
          </Tabs.Content>
        </Tabs.Root>
      </div>
    </main>
  )
}
