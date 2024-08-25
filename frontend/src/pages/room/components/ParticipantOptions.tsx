import { Ellipsis as OptionsIcon, Mail as MsgIcon, Crown as HostIcon, Ghost as CoHostIcon, Ban as KickIcon, MessageSquareOff as ClearChatIcon } from 'lucide-react';
import * as Dropdown from '@radix-ui/react-dropdown-menu';
import { RoomRes, User } from '@/types';
import { useAppStore } from '@/stores/appStore';
import { ws } from '@/lib/ws';

type Props = {
  participant: User
  room: RoomRes
  setPM: (pm: User | null) => void
  setTab: (tab: string) => void
}

export function ParticipantOptions(props: Props) {
  const { room } = props
  const user = useAppStore().user
  const isHost = room.host.id === user?.id
  const isCoHost = room.coHosts?.includes(user?.id as unknown as number)
  const isParticipantCoHost = room.coHosts?.includes(props.participant.id)
  const isParticipantHost = props.participant.id === room.host.id
  const hasPermissions = (isHost || isCoHost) && !isParticipantHost

  return (
    <Dropdown.Root>
      <Dropdown.Trigger asChild>
        <button className="p-[2px] bg-accent/30 group-hover:bg-accent absolute right-0 top-0 rounded-bl-md">
          <OptionsIcon size={14} />
        </button>
      </Dropdown.Trigger>
      <Dropdown.Portal>
        <Dropdown.Content className="min-w-[100px] rounded-lg p-2 shadow-md bg-bg-2 text-fg-2 flex flex-col gap-2 border border-border" side='top' sideOffset={10} onCloseAutoFocus={e => e.preventDefault()}>
          <Dropdown.Item className="flex gap-3 items-center data-[highlighted]:outline-none data-[highlighted]:bg-highlight px-2 py-1 rounded-md" onClick={() => {
            props.setTab("messages")
            props.setPM(props.participant)
            setTimeout(() => {
              const el = document.getElementById("messages-textarea")
              if (el) {
                el.focus()
              }
            }, 0)
          }}>
            <MsgIcon size={18} className="text-muted" />
            <p>PM</p>
          </Dropdown.Item>
          {isHost && (
            <Dropdown.Item className="flex gap-3 items-center data-[highlighted]:outline-none data-[highlighted]:bg-highlight px-2 py-1 rounded-md" onClick={() => {
              ws.assignRole(isParticipantCoHost ? "guest" : 'coHost', props.participant.id)
            }}>
              <CoHostIcon size={18} className="text-muted" />
              <p>{isParticipantCoHost ? 'Unset' : 'Set'} Co-Host</p>
            </Dropdown.Item>
          )}
          {isHost && (
            <Dropdown.Item className="flex gap-3 items-center data-[highlighted]:outline-none data-[highlighted]:bg-highlight px-2 py-1 rounded-md" onClick={() => {
              ws.transferRoom(props.participant.id)
            }}>
              <HostIcon size={18} className="text-muted" />
              <p>Transfer Room</p>
            </Dropdown.Item>
          )}
          {hasPermissions && (
            <Dropdown.Item className="flex gap-3 items-center data-[highlighted]:outline-none data-[highlighted]:bg-highlight px-2 py-1 rounded-md">
              <KickIcon size={18} className="text-muted" />
              <p>Kick</p>
            </Dropdown.Item>
          )}
          {hasPermissions && (
            <Dropdown.Item className="flex gap-3 items-center data-[highlighted]:outline-none data-[highlighted]:bg-highlight px-2 py-1 rounded-md" onClick={() => {
              ws.clearChat(props.participant.id)
            }}>
              <ClearChatIcon size={18} className="text-muted" />
              <p>Clear Chat</p>
            </Dropdown.Item>
          )}
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  )
}
