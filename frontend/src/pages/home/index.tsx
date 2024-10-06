import { Social } from '@/components/social'
import { useDMs } from '@/hooks/queries/useDMs'
import { useRooms } from '@/hooks/queries/useRooms'
import { bc } from '@/lib/bc'
import { useAppStore } from '@/stores/appStore'
import * as Popover from '@radix-ui/react-popover'
import { useEffect, useState } from 'react'
import { LoadingIcon } from './components/LoadingIcon'
import { NoRooms } from './components/NoRooms'
import { RoomCard } from './components/RoomCard'
import { Header } from './components/Header'
import { SocialProvider } from '@/context/SocialContext'
import { SocialBtn } from '@/components/social/components/SocialBtn'
import { X as CloseIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export function HomePage() {
	const user = useAppStore().user
	const dmUnread = useAppStore().dmUnread
	const selectedDM = useAppStore().selectedDM
	const { data: rooms, isLoading } = useRooms()
	const [open, setOpen] = useState(false)

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
				<SocialProvider>
					<div className="fixed bottom-8 right-8">
						<Popover.Root>
							<Popover.Trigger asChild>
								<SocialBtn classNames="hidden sm:block" />
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
						<SocialBtn
							classNames="block sm:hidden"
							onClick={() => setOpen(true)}
						/>
					</div>
					{open && (
						<div className="top-0 left-0 fixed h-full w-full flex flex-col sm:hidden bg-bg p-2 gap-2 overflow-hidden">
							<div className="border border-border h-full rounded-md overflow-hidden relative">
								<Social widget hasUnread={hasUnread} />
								<button
									className={cn('focus:ring-0 absolute right-2 top-[10px]', {
										'top-[19px]': selectedDM !== null,
									})}
									onClick={() => setOpen(false)}
								>
									<CloseIcon className="text-muted" size={20} />
								</button>
							</div>
						</div>
					)}
				</SocialProvider>
			)}
		</main>
	)
}
