import { User } from '@/types'
import { Label } from '@radix-ui/react-label'
import * as Dialog from '@radix-ui/react-dialog'
import * as constants from '@/constants'
import { useEffect, useRef, useState } from 'react'
import { Option, Select } from '@/components/Select'
import { SingleValue } from 'react-select'
import { Switch } from '@/components/Switch'
import { ws } from '@/lib/ws'

type Props = {
	participant: User | null
	open: boolean
	setOpen: (open: boolean) => void
}

export function KickParticipant(props: Props) {
	const [error, setError] = useState('')
	const [clearChat, setClearChat] = useState(false)
	const inputRef = useRef<HTMLInputElement>(null)
	const [unit, setUnit] = useState<SingleValue<Option>>({
		label: 'Minutes',
		value: 'm',
	})

	function onSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault()
		if (!inputRef.current) {
			return
		}

		const value = inputRef.current.value.trim()
		const duration = Number(value)
		if (value && (isNaN(duration) || duration <= 0)) {
			setError('Provide a valid duration')
			return
		}

		const du = value ? `${duration}${unit?.value}` : '168h'
		ws.kickParticipant(props.participant?.id!, du, clearChat)
	}

	useEffect(() => {
		if (!open) {
			setClearChat(false)
		}
	}, [open])

	return (
		<Dialog.Root open={props.open} onOpenChange={props.setOpen}>
			<Dialog.Portal>
				<Dialog.Overlay className="dialog-overlay" />
				<Dialog.Content className="dialog-content">
					<Dialog.Title className="font-semibold pb-2">
						Are you sure you want to kick "{props.participant?.username}"?
					</Dialog.Title>
					<Dialog.Description className="mb-8 text-muted text-sm">
						Co-Host can still join after getting kicked
					</Dialog.Description>
					<form onSubmit={onSubmit}>
						<div className="flex gap-4">
							<div className="flex flex-col gap-2 flex-2">
								<Label className="self-start" htmlFor="duration">
									Duration
								</Label>
								<input
									onChange={() => {
										setError('')
									}}
									ref={inputRef}
									id="duration"
									type="number"
									className="w-full border border-border bg-transparent rounded-md p-2 px-3 focus:border-transparent"
									autoComplete="off"
									placeholder="Enter duration"
								/>
							</div>
							<div className="flex flex-col gap-2 flex-1">
								<Label className="self-start" htmlFor="unit">
									Unit
								</Label>
								<Select
									id="unit"
									placeholder="Select duration"
									value={unit}
									setValue={(unit: any) => {
										setUnit(unit)
									}}
									options={constants.durationUnits}
								/>
							</div>
						</div>

						<div className="flex items-center gap-4 mt-5">
							<Label htmlFor="clearChat" className="text-muted">
								Clear Chat
							</Label>
							<Switch
								id="clearChat"
								setChecked={setClearChat}
								checked={clearChat}
							/>
						</div>

						{error ? (
							<span className="text-danger text-sm">{error}</span>
						) : null}
						<div className="justify-end flex justify-end gap-3 items-center mt-8">
							<button
								type="button"
								className="bg-muted/20 px-4 py-1 rounded-md"
								onClick={() => {
									props.setOpen(false)
								}}
							>
								Cancel
							</button>
							<button
								type="submit"
								className="bg-danger text-white px-4 py-1 rounded-md focus:ring-danger/40 focus:ring-offset-2 focus:ring-offset-bg disabled:opacity-70 flex gap-2 items-center"
							>
								Kick
							</button>
						</div>
					</form>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	)
}
