import { APIError } from "@/lib/utils"
import { User } from "@/types"

type Props = {
  error: APIError | undefined
  user: User | null
  isKicked: {
    duration: number
    kickedAt: string
  } | null
}

export function RoomError(props: Props) {
  const { error, isKicked, user } = props

  if (!user) {
    return <Error msg="You need to be logged in to join room" />
  }

  if (error?.status === 400) {
    return <Error msg="All spots filled in this room" />
  }

  if (error?.status === 404) {
    return <Error msg="Hey, this room doesn't exists" />
  }

  if (error?.status === 403 || isKicked) {
    const errors = error?.errors ?? {}
    return <Kicked
      kickedAt={errors.kickedAt ?? isKicked?.kickedAt ?? ''}
      duration={errors.duration ?? isKicked?.duration ?? 0}
    />
  }

  return null
}


export function Error(props: { msg: string }) {
  return (
    <main className="h-full w-full flex items-center justify-center">
      <p className="text-lg font-semibold">{props.msg}</p>
    </main>
  )
}

export function Kicked(props: {
  kickedAt: string
  duration: number
}) {
  console.log("kicked:", props)
  return (
    <main className="h-full w-full flex items-center justify-center">
      <p className="text-lg font-semibold">Ooopsie, it seems you got kicked</p>
    </main>
  )
}
