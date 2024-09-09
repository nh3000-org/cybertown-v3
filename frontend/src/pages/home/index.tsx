import { useAppStore } from '@/stores/appStore'
import { UserMenu } from './components/UserMenu'
import { useRooms } from '@/hooks/queries/useRooms'
import { RoomCard } from './components/RoomCard'
import { Mail as MailIcon } from 'lucide-react';
import * as Popover from '@radix-ui/react-popover'
import { Social } from '@/components/social';

export function HomePage() {
  const user = useAppStore().user
  const setAlert = useAppStore().setAlert
  const setOpen = useAppStore().setCreateOrUpdateRoom
  const { data: rooms } = useRooms()

  return (
    <main className="max-w-7xl mx-auto p-4">
      <div className="flex justify-end">
        {user ? <UserMenu /> :
          <button onClick={() => {
            setAlert("login", true)
          }} className="bg-accent text-accent-fg px-4 py-1 rounded-lg rounded-md focus:ring-accent focus:ring-1 focus:ring-offset-2 focus:ring-offset-bg">Login</button>}
      </div>
      <h1 className="text-4xl font-bold text-center my-8">Cybertown</h1>

      <button onClick={() => setOpen(true)} className="bg-accent text-accent-fg px-4 py-2 rounded-md flex gap-2 focus:ring-accent focus:ring-1 focus:ring-offset-2 focus:ring-offset-bg">
        <span>Create Room</span>
      </button>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms?.map(room => {
          return <RoomCard key={room.id} room={room} />
        })}
      </div>

      {user && (
        <div className="fixed bottom-8 right-8">
          <Popover.Root>
            <Popover.Trigger className="bg-accent p-3 rounded-full">
              <MailIcon size={22} />
            </Popover.Trigger>
            <Popover.Anchor />
            <Popover.Content sideOffset={56} side='top' align="end" className='focus:outline-none border border-border rounded-md h-[500px] w-[320px] bg-bg'>
              <Social />
            </Popover.Content>
          </Popover.Root>
        </div>
      )}
    </main>
  )
}
