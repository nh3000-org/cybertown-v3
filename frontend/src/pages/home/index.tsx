import { Social } from '@/components/social'
import { useDMs } from '@/hooks/queries/useDMs'
import { useRooms } from '@/hooks/queries/useRooms'
import { bc } from '@/lib/bc'
import { useAppStore } from '@/stores/appStore'
import * as Popover from '@radix-ui/react-popover'
import { Webhook as WebhookIcon } from 'lucide-react'
import { useEffect } from 'react'
import { LoadingIcon } from './components/LoadingIcon'
import { NoRooms } from './components/NoRooms'
import { RoomCard } from './components/RoomCard'
import { Header } from './components/Header'

export function HomePage() {
	const user = useAppStore().user
	const dmUnread = useAppStore().dmUnread
	const { data: rooms, isLoading } = useRooms()

	useDMs(Boolean(user))
	const hasUnread = Object.values(dmUnread).some((isUnread) => isUnread)

	useEffect(() => {
		bc.sendMessage({ name: 'VISITED_HOMEPAGE' })
	}, [])

	return (
		<main className="max-w-7xl mx-auto px-4 h-full flex flex-col pt-4">
			<Header />

			{isLoading && (
				<div className="flex-1 grid place-items-center">
					<LoadingIcon className="text-brand/20 fill-brand h-7 w-7" />
				</div>
			)}

			{!isLoading && Boolean(!rooms?.length) && <NoRooms />}

			{!isLoading && Boolean(rooms?.length) && (
				<>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-8">
						{rooms?.map((room) => {
							return <RoomCard key={room.id} room={room} />
						})}
					</div>
				</>
			)}

			{user && (
				<div className="fixed bottom-8 right-8">
					<Popover.Root>
						<Popover.Trigger className="bg-brand text-brand-fg p-3 rounded-full relative focus:ring-brand/40 focus:ring-offset-2 focus:ring-offset-bg">
							<WebhookIcon size={22} />
							{hasUnread && (
								<span className="w-3 h-3 rounded-full rounded-full block bg-danger absolute right-0 top-0" />
							)}
						</Popover.Trigger>
						<Popover.Anchor />
						<Popover.Content
							sideOffset={56}
							side="top"
							align="end"
							className="focus:outline-none border border-border rounded-md h-[470px] w-[360px] bg-bg"
						>
							<Social hasUnread={hasUnread} />
						</Popover.Content>
					</Popover.Root>
				</div>
			)}
		</main>
	)
}
