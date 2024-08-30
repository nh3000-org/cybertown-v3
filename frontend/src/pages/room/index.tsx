import { useJoinRoom } from "@/hooks/queries/useJoinRoom"
import { ws } from "@/lib/ws"
import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { Onboarding } from "@/pages/room/components/Onboarding"
import { RoomError } from "@/pages/room/components/RoomError"
import { Room } from "@/pages/room/components/Room"
import { useAppStore } from "@/stores/appStore"
import { APIError } from "@/lib/utils"

export function RoomPage() {
  const [isOnboarding, setIsOnBoarding] = useState(true)
  const roomID = Number(useParams().roomID)
  const user = useAppStore().user
  const isKicked = useAppStore().isKicked
  const { isLoading, error } = useJoinRoom(roomID!, user !== null)

  useEffect(() => {
    if (!isOnboarding && user) {
      ws.joinRoom(roomID!)
    }
  }, [isOnboarding, user])

  if (isLoading) {
    return null
  }

  if (!user || error || isKicked) {
    return <RoomError error={error as APIError} user={user} isKicked={isKicked} />
  }

  if (isOnboarding && user) {
    return <Onboarding user={user} setIsOnboarding={setIsOnBoarding} />
  }

  return <Room roomID={roomID!} />
}
