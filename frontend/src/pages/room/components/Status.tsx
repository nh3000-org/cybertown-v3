import * as RadioGroup from '@radix-ui/react-radio-group'
import * as constants from '@/constants'
import { Label } from '@radix-ui/react-label'
import { cn } from '@/lib/utils'
import { RoomRes } from '@/types'
import { useAppStore } from '@/stores/appStore'
import { ws } from '@/lib/ws'
import { useEffect, useState } from 'react'

type Props = {
	room: RoomRes
}

export function Status(props: Props) {
	const sid = useAppStore().sid
	const serverStatus =
		props.room.participants.find((p) => p.sid === sid!)?.status ?? 'None'
	const [status, setStatus] = useState('None')

	useEffect(() => {
		setStatus(serverStatus)
	}, [serverStatus])

	return (
		<div className="flex flex-col gap-2">
			<Label htmlFor="status">Status</Label>
			<RadioGroup.Root
				value={status}
				id="status"
				className="rounded-md border border-border flex justify-between"
				onValueChange={(status) => {
					setStatus(status)
					ws.setStatus(status)
				}}
			>
				{constants.status.map((s, i) => {
					return (
						<RadioGroup.Item
							key={s}
							className={cn(
								'px-4 py-[2px] text-muted data-[state=checked]:text-brand-fg data-[state=checked]:bg-brand',
								{
									'rounded-l-md': i === 0,
									'rounded-r-md': i === constants.status.length - 1,
								}
							)}
							value={s}
						>
							{s}
						</RadioGroup.Item>
					)
				})}
			</RadioGroup.Root>
		</div>
	)
}
