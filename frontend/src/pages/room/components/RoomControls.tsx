import { Tooltip } from '@/components/Tooltip'
import { peer } from '@/lib/peer'
import {
	Mic as MicIcon,
	MicOff as MicOffIcon,
	LogOut as LeaveRoom,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

export function RoomControls() {
	const [mic, setMic] = useState(false)
	const micRef = useRef(false)

	useEffect(() => {
		if (!micRef.current && mic) {
			console.log('invoking speak lol')
			peer.speak()
			micRef.current = true
		}
	}, [mic])

	return (
		<div className="flex justify-center">
			<div className="flex justify-center items-center gap-1 py-[2px] min-w-[140px] bg-bg-2 border border-border rounded-b-md border-t-0">
				<Tooltip title={`Turn ${mic ? 'off' : 'on'} microphone`}>
					<button
						className="focus:ring-0 p-2"
						onClick={() => setMic((prev) => !prev)}
					>
						{mic ? (
							<MicIcon
								className="text-muted stroke-brand"
								strokeWidth={1.5}
								size={20}
							/>
						) : (
							<MicOffIcon className="text-muted" strokeWidth={1.5} size={20} />
						)}
					</button>
				</Tooltip>
				<Tooltip title="Leave room">
					<button className="focus:ring-0 p-2">
						<LeaveRoom className="text-muted" strokeWidth={1.5} size={20} />
					</button>
				</Tooltip>
			</div>
		</div>
	)
}
