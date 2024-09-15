import { useAppStore } from '@/stores/appStore'
import { UserMenu } from './components/UserMenu'
import { useRooms } from '@/hooks/queries/useRooms'
import { RoomCard } from './components/RoomCard'
import { Webhook as WebhookIcon } from 'lucide-react';
import * as Popover from '@radix-ui/react-popover'
import { Social } from '@/components/social';
import { useDMs } from '@/hooks/queries/useDMs';

export function HomePage() {
  const user = useAppStore().user
  const dmUnread = useAppStore().dmUnread
  const setAlert = useAppStore().setAlert
  const setOpen = useAppStore().setCreateOrUpdateRoom
  const { data: rooms } = useRooms()

  useDMs(user !== null)
  const hasUnread = Object.values(dmUnread).some(isUnread => isUnread)

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
            <Popover.Trigger className="bg-accent p-3 rounded-full relative">
              <WebhookIcon size={22} />
              {hasUnread &&
                <span className="w-3 h-3 rounded-full rounded-full block bg-danger absolute right-0 top-0" />
              }
            </Popover.Trigger>
            <Popover.Anchor />
            <Popover.Content sideOffset={56} side='top' align="end" className='focus:outline-none border border-border rounded-md h-[560px] w-[380px] bg-bg'>
              <Social hasUnread={hasUnread} />
            </Popover.Content>
          </Popover.Root>
        </div>
      )}
    </main>
  )
}
