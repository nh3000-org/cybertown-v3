import { RoomRes } from '@/types'
import { useAppStore } from '@/stores/appStore'
import * as Popover from '@radix-ui/react-popover';
import { Info as InfoIcon, SquarePen as PencilIcon, Ban as BanIcon } from 'lucide-react'
import { Profile } from '@/components/Profile';
import { useState } from 'react';
import { cn, formatDate } from '@/lib/utils';

type Props = {
  room: RoomRes
}

export function RoomCard(props: Props) {
  const user = useAppStore().user
  const setAlert = useAppStore().setAlert
  const setUpdateRoom = useAppStore().setCreateOrUpdateRoom
  const { room } = props
  const [open, setOpen] = useState<Record<number, boolean>>({})
  const isRoomFull = room.participants.length >= room.maxParticipants

  const style = {
    width: room.maxParticipants > 3 ? 58 : 96,
    height: room.maxParticipants > 3 ? 58 : 96,
  }

  function joinRoom(roomID: number) {
    if (!user) {
      setAlert('login', true)
      return
    }
    window.open(`${window.location.origin}/room/${roomID}`)
  }

  return (
    <div className="p-4 border border-border rounded-md bg-bg-2 text-fg-2 flex flex-col">
      <div className="flex items-center justify-between">
        <p className="text-lg font-semibold mb-1 flex-1">{room.topic}</p>
        <Popover.Root>
          <Popover.Trigger className="rounded-lg">
            <InfoIcon size={18} className="text-muted" />
          </Popover.Trigger>
          <Popover.Anchor />
          <Popover.Portal>
            <Popover.Content side='bottom' align='end' sideOffset={12} className='focus:outline-none rounded-lg p-6 shadow-md bg-bg-2 text-fg-2 flex flex-col gap-2 border border-border min-w-[150px]'>
              <div className="flex flex-col items-center justify-center gap-3 relative">
                <p className="text-muted">Host</p>
                <img src={room.settings.host.avatar} className="w-12 h-12 rounded-full" />
                <div className="text-center">
                  <p className="font-semibold pb-1">{room.settings.host.username}</p>
                  <p className="text-muted text-sm">{formatDate(room.createdAt)}</p>
                </div>
              </div>
              {user?.id === room.settings.host.id && (
                <button className='absolute top-4 right-4 p-[2px] rounded-lg' onClick={() => {
                  setUpdateRoom(true, room)
                }}>
                  <span><PencilIcon className='text-muted' size={18} /></span>
                </button>
              )}
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      </div>

      <p className="text-muted">{room.languages.join(" + ")}</p>

      <div className="min-h-[60px] my-8 flex flex-wrap gap-4">
        {room.participants.map(p => {
          return <Profile key={p.id} user={p} style={style} open={open[p.id]} setOpen={open => {
            setOpen(prev => ({
              ...prev,
              [p.id]: open
            }))
          }} />
        })}
        {Array.from({ length: room.maxParticipants - room.participants.length }).map((_, i) => {
          return <div key={i} style={style} className="rounded-full border border-border border-dashed" />
        })}
      </div>

      <button disabled={isRoomFull} className={cn("flex items-center gap-2 bg-accent/50 border border-accent text-accent-fg px-4 py-1 rounded-lg rounded-md focus:ring-accent focus:ring-1 focus:ring-offset-2 focus:ring-offset-bg self-center mt-auto", {
        "border border-highlight bg-transparent text-muted border-dashed": isRoomFull
      })} onClick={() => {
        joinRoom(room.id)
      }}>
        {!isRoomFull ? <span>Join room</span> :
          <>
            <BanIcon size={16} className='text-muted' />
            <span>Room is full</span>
          </>
        }
      </button>
    </div>
  )
}
