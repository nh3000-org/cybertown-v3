import { useMe } from '@/hooks/queries/useMe'
import { useAppStore } from '@/stores/appStore'
import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Toast } from './Toast'
import { CreateRoom } from '@/pages/home/components/CreateRoom'
import { LogoutAlert } from '@/pages/home/components/LogoutAlert'
import { LoginAlert } from '@/pages/home/components/LoginAlert'

type Props = {
  children?: React.ReactNode
}

export function App(props: Props) {
  const { data: user, isLoading, error } = useMe()
  const setUser = useAppStore().setUser

  useEffect(() => {
    if (isLoading) {
      return
    }
    setUser(error ? null : user)
  }, [user, isLoading, error])

  if (isLoading) {
    return null
  }

  return (
    <>
      {props.children ?? <Outlet />}
      <Toast />
      <CreateRoom />
      <LogoutAlert />
      <LoginAlert />
    </>
  )
}
