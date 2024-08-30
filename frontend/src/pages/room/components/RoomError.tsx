import { APIError, secondsToHHMMSS, getGoogleOAuthURL } from "@/lib/utils"
import { User } from "@/types"
import { Link } from "react-router-dom"
import { Ban as BanIcon, Key as KeyIcon, IceCreamCone as ConeIcon, BatteryFull as FullIcon } from 'lucide-react';
import { useEffect, useState } from "react";

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
    return <Error status={401} />
  }

  if (error?.status === 400) {
    return <Error status={error.status} />
  }

  if (error?.status === 404) {
    return <Error status={error.status} />
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


export function Error(props: { status: number }) {
  const contentMap: Record<number, Record<string, any>> = {
    404: {
      title: "Hey, this room doesn't exist",
      desc: 'Return to home page and explore other rooms.',
      icon: <ConeIcon className="stroke-pink-500 mb-2" />,
    },
    401: {
      title: "Log in to join the room",
      desc: "You'll be redirected to google to login",
      icon: <KeyIcon className="stroke-accent mb-2" />,
    },
    400: {
      title: "No spots left in this room",
      desc: "Return to home page and explore other rooms",
      icon: <FullIcon className="stroke-yellow-500 mb-2" />,
    }
  }

  const content = contentMap[props.status]

  return (
    <main className="h-full w-full grid place-items-center">
      <div className="max-w-[600px] grid place-items-center text-center px-4">
        {content.icon}
        <h1 className="text-4xl font-bold mb-3">{content.title}</h1>
        <p className="text-muted mb-5">{content.desc}</p>
        <Link to={props.status === 401 ? getGoogleOAuthURL() : '/'} className="bg-accent text-accent-fg px-4 py-2 rounded-md flex gap-2 focus:ring-accent focus:ring-1 focus:ring-offset-2 focus:ring-offset-bg">
          {props.status === 401 ? 'Login' : 'Go to Home'}
        </Link>
      </div>
    </main>
  )
}

export function Kicked(props: {
  kickedAt: string
  duration: number
}) {
  const { kickedAt, duration } = props
  const [timeLeft, setTimeLeft] = useState(-1)
  const endTime = new Date(kickedAt).getTime() + (duration * 1000)

  useEffect(() => {
    function updateTimer() {
      const diff = endTime - new Date().getTime()
      if (diff > 0) {
        setTimeLeft(diff / 1000)
      } else {
        setTimeLeft(-1)
        // NOTE: the SPA brain can't be happy with this
        window.location.reload()
      }
    }
    const interval = setInterval(updateTimer, 1000)
    return function() {
      clearInterval(interval)
    }
  }, [kickedAt, duration])

  return (
    <main className="h-full w-full grid place-items-center">
      <div className="max-w-[600px] grid place-items-center text-center px-4">
        <BanIcon className="stroke-danger mb-2" />
        <h1 className="text-4xl font-bold mb-3">You got kicked from the room</h1>
        {duration !== -1 && timeLeft !== -1 && (
          <p className="mb-3 font-bold text-2xl">{secondsToHHMMSS(timeLeft)}</p>
        )}
        <p className="text-muted mb-5">Return to home page and explore other rooms</p>
        <Link to="/" className="bg-accent text-accent-fg px-4 py-2 rounded-md flex gap-2 focus:ring-accent focus:ring-1 focus:ring-offset-2 focus:ring-offset-bg">
          Go to Home
        </Link>
      </div>
    </main>
  )
}
