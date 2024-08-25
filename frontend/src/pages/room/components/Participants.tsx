import { RoomRes, User } from "@/types"
import { ParticipantOptions } from "./ParticipantOptions"
import { useAppStore } from "@/stores/appStore"

type Props = {
  room: RoomRes
  setPM: (pm: User | null) => void
  setTab: (tab: string) => void
}

export function Participants(props: Props) {
  const { room } = props
  const user = useAppStore().user

  return (
    <div className="flex gap-4 justify-center">
      {room.participants.map(p => {
        const isHost = room?.host.id === p.id
        const isCoHost = room?.coHosts?.includes(p.id)
        return (
          <div key={p.id} className="bg-cover group participant h-[96px] w-[96px] rounded-sm shadow-sm text-center place-content-center text-sm relative" style={{
            backgroundImage: `url(${p.avatar})`
          }}>
            {(isHost || isCoHost || p.status !== 'None') && (
              <div className="px-[4px] py-[0.5px] bg-accent/90 group-hover:bg-accent absolute bottom-0 left-0 rounded-tr-md text-[11px]">
                {p.status !== 'None' && (
                  <>
                    <p>{p.status}</p>
                    {(isHost || isCoHost) && <hr />}
                  </>
                )}
                {isHost && <p>Host</p>}
                {isCoHost && <p>Co-Host</p>}
              </div>
            )}
            <p className="invisible group-hover:visible">{p.username}</p>
            {user?.id !== p.id && (
              <ParticipantOptions participant={p} room={room} setPM={props.setPM} setTab={props.setTab} />
            )}
          </div>
        )
      })}
    </div>
  )
}
