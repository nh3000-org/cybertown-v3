import { useRooms } from '@/hooks/queries/useRooms'
import { Participants } from './Participants'
import { useAppStore } from '@/stores/appStore'
import { User } from '@/types'
import { useState } from 'react'
import { RoomTabs } from './Tabs'

type Props = {
	roomID: number
}

export function Room(props: Props) {
	const { data: rooms, isLoading } = useRooms()
	const room = rooms?.find((room) => room.id === props.roomID)
	const user = useAppStore().user
	const [pm, setPM] = useState<User | null>(null)
	const [tab, setTab] = useState('messages')

	return (
		<main className="h-full w-full p-4 grid grid-cols-[1fr_400px] bg-sidebar gap-4">
			<div className="border border-border rounded-md bg-bg flex flex-col">
				<div className="flex-1 flex items-center justify-center">
					{room?.settings.welcomeMessage && (
						<p className="text-yellow-400 max-w-[500px] px-4 whitespace-pre-wrap">
							{room.settings.welcomeMessage.replace(
								'{username}',
								user?.username ?? ''
							)}
						</p>
					)}
				</div>
				<div className="p-4">
					{!isLoading && room && (
						<Participants room={room} setPM={setPM} setTab={setTab} />
					)}
				</div>
			</div>
			<RoomTabs
				roomID={props.roomID}
				room={room!}
				tab={tab}
				setTab={setTab}
				pm={pm}
				setPM={setPM}
			/>
		</main>
	)
}
