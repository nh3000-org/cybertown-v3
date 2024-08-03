import { LoginAlert } from './components/LoginAlert'
import { useAppStore } from '@/stores/appStore'
import { UserMenu } from './components/UserMenu'
import { LogoutAlert } from './components/LogoutAlert'
import { CreateRoom } from './components/CreateRoom'
import { useState } from 'react'
import { useRooms } from '@/hooks/queries/useRooms'
import { RoomCard } from './components/RoomCard'

export function HomePage() {
  const user = useAppStore().user
  const [open, setOpen] = useState(false)
  const { data: rooms } = useRooms()

  return (
    <main className="max-w-7xl mx-auto p-4">
      <div className="flex justify-end">
        {user ? <UserMenu /> : <LoginAlert />}
      </div>
      <h1 className="text-4xl font-bold text-center my-8">Cybertown</h1>

      <CreateRoom open={open} setOpen={setOpen} />

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms?.map(room => {
          return <RoomCard room={room} />
        })}
      </div>

      <LogoutAlert />
    </main>
  )
}
