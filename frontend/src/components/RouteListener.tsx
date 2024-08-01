import { ws } from '@/lib/ws'
import { useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

type Props = {
  children?: React.ReactNode
}

export function RouteListener(props: Props) {
  const location = useLocation()
  const pathnameRef = useRef<string>()

  useEffect(() => {
    if (pathnameRef.current) {
      const isHomeRoute = location.pathname === '/'

      const paths = pathnameRef.current.split("/")
      const isRoomRoute = paths.length === 3 && ws.currentRoomID === paths[2]

      if (isHomeRoute && isRoomRoute) {
        ws.leaveRoom(paths[2])
      }
    }
    pathnameRef.current = location.pathname
  }, [location.pathname])

  return props.children ?? <Outlet />
}
