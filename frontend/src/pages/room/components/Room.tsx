import { useRooms } from '@/hooks/queries/useRooms'
import { User } from '@/types'
import { useState } from 'react'
import { RoomTabs } from './Tabs'
import { RoomStagingArea } from './RoomStagingArea'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'

type Props = {
	roomID: number
}

export function Room(props: Props) {
	const { data: rooms, isLoading } = useRooms()
	const room = rooms?.find((room) => room.id === props.roomID)
	const [pm, setPM] = useState<User | null>(null)
	const matches = useMediaQuery('(min-width: 768px)')

	// two column horizontal layout
	if (matches) {
		return (
			<main className="size-full hidden md:p-4 md:grid md:grid-cols-2 lg:grid-cols-[auto_30%] bg-bg gap-4">
				<RoomStagingArea setPM={setPM} isLoading={isLoading} room={room} />
				<RoomTabs roomID={props.roomID} room={room!} pm={pm} setPM={setPM} />
			</main>
		)
	}

	// vertical layout for smol devices :)
	return (
		<PanelGroup autoSaveId="room-panel" direction="vertical">
			<Panel defaultSize={30}>
				<RoomStagingArea setPM={setPM} isLoading={isLoading} room={room} />
			</Panel>
			<PanelResizeHandle className="text-xs bg-bg-2 py-[2px] flex items-center justify-center text-muted">
				Touch and drag here to resize
			</PanelResizeHandle>
			<Panel defaultSize={70}>
				<RoomTabs roomID={props.roomID} room={room!} pm={pm} setPM={setPM} />
			</Panel>
		</PanelGroup>
	)
}
