import { RoomRes, User } from '@/types'
import { ParticipantOptions } from './ParticipantOptions'
import { useAppStore } from '@/stores/appStore'
import { cn } from '@/lib/utils'

type Props = {
	room: RoomRes
	setPM: (pm: User | null) => void
}

/*
 - For fluid sizing, constrain the image height and width using min/max
 - To maintain min/max size, need to use flex shrink
 - `justify-center` behaves wierdly with 'overflow-x-auto' (so using margin auto)
*/
export function Participants(props: Props) {
	const { room } = props
	const user = useAppStore().user

	return (
		<div className="flex gap-3 overflow-x-auto scroller py-2 px-3">
			{room.participants.map((p, i) => {
				const isHost = room.settings.host.id === p.id
				const isCoHost = room.settings.coHosts?.includes(p.id)
				return (
					<div
						key={p.sid}
						className={cn(
							'group shadow-sm text-center text-sm relative participant',
							{
								'ml-auto': i === 0,
								'mr-auto': room.participants.length - 1 === i,
							}
						)}
					>
						<img
							src={p.avatar}
							key={p.sid}
							className="max-h-[96px] max-w-[96px] min-w-[96px] min-w-[96px]"
						/>
						{(isHost || isCoHost || p.status !== 'None') && (
							<div className="px-[4px] py-[0.5px] bg-brand/90 text-brand-fg group-hover:bg-brand absolute bottom-0 left-0 rounded-tr-md text-[11px]">
								{p.status !== 'None' && (
									<>
										<p>{p.status}</p>
										{(isHost || isCoHost) && <hr />}
									</>
								)}
								{isHost && <p>Host</p>}
								{isCoHost && <p>Co-Host</p>}
							</div>
						)}
						<p className="absolute text-white invisible group-hover:visible top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
							{p.username}
						</p>
						{user?.id !== p.id && (
							<ParticipantOptions
								participant={p}
								room={room}
								setPM={props.setPM}
							/>
						)}
					</div>
				)
			})}
		</div>
	)
}
