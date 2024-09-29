import { flattenError } from '@/lib/utils'
import { ws } from '@/lib/ws'
import { Label } from '@radix-ui/react-label'
import { useEffect, useRef, useState } from 'react'
import { CircleX as CloseIcon, SquarePen as PencilIcon } from 'lucide-react'
import { z } from 'zod'
import { useAppStore } from '@/stores/appStore'
import { RoomRes } from '@/types'

const updateWelcomeMsgSchema = z.object({
	welcomeMessage: z
		.string()
		.max(512, { message: 'Should be maximum of 512 characters' }),
})

type Props = {
	room: RoomRes
}

export function WelcomeMessage(props: Props) {
	const { room } = props
	const user = useAppStore().user
	const [error, setError] = useState('')
	const textareaRef = useRef<HTMLTextAreaElement | null>(null)
	const [mode, setMode] = useState<'edit' | 'view'>('view')
	const isHost = room.settings.host.id === user?.id
	const isCoHost = room.settings.coHosts?.includes(
		user?.id as unknown as number
	)

	function onSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault()

		if (!textareaRef.current) {
			return
		}

		if (mode === 'view') {
			setMode('edit')
			setTimeout(() => {
				if (textareaRef.current) {
					textareaRef.current.focus()
				}
			}, 0)
			return
		}

		const result = updateWelcomeMsgSchema.safeParse({
			welcomeMessage: textareaRef.current.value.trim(),
		})

		if (!result.success) {
			const errors = flattenError(result.error)
			setError(errors.welcomeMessage)
			return
		}

		setError('')
		ws.updateWelcomeMsg(result.data.welcomeMessage)
		setMode('view')
	}

	useEffect(() => {
		if (room && textareaRef.current) {
			textareaRef.current.value = room.settings.welcomeMessage ?? ''
		}
	}, [room.settings.welcomeMessage])

	if (!isHost && !isCoHost) {
		return null
	}

	return (
		<div>
			<form className="flex flex-col" onSubmit={onSubmit}>
				<div>
					<div className="flex items-center justify-between">
						<Label htmlFor="welcomeMessage">Welcome Message</Label>
						{mode === 'view' && (
							<button>
								<PencilIcon size={18} className="text-muted" />
							</button>
						)}
						{mode === 'edit' && (
							<button onClick={() => setMode('view')}>
								<CloseIcon size={18} className="text-muted" />
							</button>
						)}
					</div>
					<textarea
						disabled={mode === 'view'}
						ref={textareaRef}
						defaultValue={room.settings.welcomeMessage ?? ''}
						rows={3}
						onChange={() => setError('')}
						name="welcomeMessage"
						id="welcomeMessage"
						className="scroller mt-2 w-full border border-border bg-transparent rounded-md p-2 px-3 disabled:opacity-80 disabled:pointer-events-none focus:border-transparent"
						placeholder="You can mention username by {username}"
					/>
					{error ? <span className="text-danger text-sm">{error}</span> : null}
				</div>
				{mode === 'edit' && (
					<button className="mt-1 bg-brand text-brand-fg px-4 py-[2px] rounded-md focus:ring-accent focus:ring-1 focus:ring-offset-2 focus:ring-offset-bg self-end">
						Save
					</button>
				)}
			</form>
		</div>
	)
}
