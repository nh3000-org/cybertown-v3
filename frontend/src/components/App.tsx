import { useMe } from '@/hooks/queries/useMe'
import { ws } from '@/lib/ws'
import { useAppStore } from '@/stores/appStore'
import { useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

type Props = {
  children?: React.ReactNode
}

export function App(props: Props) {
  const location = useLocation()
  const pathnameRef = useRef<string>()
  const { data: user, isLoading } = useMe()
  const setUser = useAppStore().setUser

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

  useEffect(() => {
    setUser(user ?? null)
  }, [user])

  if (isLoading) {
    return null
  }

  return props.children ?? <Outlet />
}
