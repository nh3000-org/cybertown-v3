import { useRoom } from "@/hooks/queries/useRoom"
import { ws } from "@/lib/ws"
import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { Onboarding } from "@/pages/room/components/Onboarding"
import { RoomError, UserError } from "@/pages/room/components/Error"
import { Room } from "@/pages/room/components/Room"
import { useAppStore } from "@/stores/appStore"

export function RoomPage() {
  const [isOnboarding, setIsOnBoarding] = useState(true)
  const roomID = Number(useParams().roomID)
  const user = useAppStore().user
  const { data: room, isLoading: isRoomLoading, error: roomError } = useRoom(roomID!, user !== null)

  useEffect(() => {
    if (room) {
      ws.joinRoom(roomID!)
    }
  }, [room, roomID])

  if (isRoomLoading) {
    return null
  }

  if (!user) {
    return <UserError />
  }

  if (roomError) {
    return <RoomError />
  }

  if (isOnboarding && user) {
    return <Onboarding user={user} setIsOnboarding={setIsOnBoarding} />
  }

  return <Room roomID={roomID!} />
}
