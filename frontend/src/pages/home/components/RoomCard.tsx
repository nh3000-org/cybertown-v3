import { RoomRes } from '@/types'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/stores/appStore'

type Props = {
  room: RoomRes
}

export function RoomCard(props: Props) {
  const user = useAppStore().user
  const setAlert = useAppStore().setAlert
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
      <p className="text-lg font-semibold mb-1">{room.topic}</p>
      <p className="text-muted">{room.language}</p>

      <div className="min-h-[60px] mt-4 flex flex-wrap gap-4">
        {room.participants.map(p => {
          return <img key={p.id} src={p.avatar} referrerPolicy="no-referrer" style={style} className="rounded-full" />
        })}
        {Array.from({ length: room.maxParticipants - room.participants.length }).map((_, i) => {
          return <div key={i} style={style} className="rounded-full border border-border border-dashed" />
        })}
      </div>

      <button className="mt-12 bg-accent/50 border border-accent text-accent-fg px-4 py-1 rounded-lg rounded-md focus:ring-accent focus:ring-1 focus:ring-offset-2 focus:ring-offset-bg self-center" onClick={() => {
        joinRoom(room.id)
      }}>Join Room</button>
    </div>
  )
}
