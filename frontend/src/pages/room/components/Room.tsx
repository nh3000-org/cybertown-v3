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

	return (
		<main className="size-full md:p-4 flex flex-col md:grid md:grid-cols-2 lg:grid-cols-[auto_30%] bg-bg gap-4">
			<div className="md:border md:border-border rounded-md bg-bg flex flex-col min-h-[320px]">
				<div className="flex-1 flex items-center justify-center">
					{room?.settings.welcomeMessage && (
						<p className="text-yellow-500 max-w-[500px] px-4 whitespace-pre-wrap">
							{room.settings.welcomeMessage.replace(
								'{username}',
								user?.username ?? ''
							)}
						</p>
					)}
				</div>
				{!isLoading && room && <Participants room={room} setPM={setPM} />}
			</div>
			<RoomTabs roomID={props.roomID} room={room!} pm={pm} setPM={setPM} />
		</main>
	)
}
