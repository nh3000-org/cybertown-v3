import { RoomRes } from '@/types'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/stores/appStore'
import * as Popover from '@radix-ui/react-popover';
import { Info as InfoIcon, SquarePen as PencilIcon } from 'lucide-react'
import { formatRelative } from 'date-fns'

type Props = {
  room: RoomRes
}

export function RoomCard(props: Props) {
  const user = useAppStore().user
  const setAlert = useAppStore().setAlert
  const setUpdateRoom = useAppStore().setCreateOrUpdateRoom
  const { room } = props
  const navigate = useNavigate()

  const style = {
    width: room.maxParticipants > 3 ? 58 : 96,
    height: room.maxParticipants > 3 ? 58 : 96,
  }

  function joinRoom(roomID: number) {
    if (!user) {
      setAlert('login', true)
      return
    }
    navigate(`/room/${roomID}`)
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
            <Popover.Content side='bottom' align='end' sideOffset={12} className='focus:outline-none rounded-lg p-6 shadow-md bg-bg-2 text-fg-2 flex flex-col gap-2 border border-border'>
              <div className="flex flex-col items-center justify-center gap-3 relative">
                <p className="text-muted">Host</p>
                <img src={room.settings.host.avatar} className="w-12 h-12 rounded-full" />
                <div className="text-center">
                  <p className="font-semibold pb-1">{room.settings.host.username}</p>
                  <p className="text-muted text-sm">{formatRelative(new Date(room.createdAt), new Date())}</p>
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
          return <img key={p.id} src={p.avatar} referrerPolicy="no-referrer" style={style} className="rounded-full" />
        })}
        {Array.from({ length: room.maxParticipants - room.participants.length }).map((_, i) => {
          return <div key={i} style={style} className="rounded-full border border-border border-dashed" />
        })}
      </div>

      <button className="bg-accent/50 border border-accent text-accent-fg px-4 py-1 rounded-lg rounded-md focus:ring-accent focus:ring-1 focus:ring-offset-2 focus:ring-offset-bg self-center mt-auto" onClick={() => {
        joinRoom(room.id)
      }}>Join Room</button>
    </div>
  )
}
