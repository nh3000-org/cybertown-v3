import {
	Ellipsis as OptionsIcon,
	Mail as MsgIcon,
	Crown as HostIcon,
	Ghost as CoHostIcon,
	Ban as KickIcon,
	MessageSquareOff as ClearChatIcon,
} from 'lucide-react'
import * as Dropdown from '@radix-ui/react-dropdown-menu'
import { RoomRes, User } from '@/types'
import { useAppStore } from '@/stores/appStore'
import { ws } from '@/lib/ws'
import { KickParticipant } from './KickParticipant'
import { useState } from 'react'

type Props = {
	participant: User
	room: RoomRes
	setPM: (pm: User | null) => void
	setTab: (tab: string) => void
}

export function ParticipantOptions(props: Props) {
	const { settings } = props.room
	const user = useAppStore().user
	const isHost = settings.host.id === user?.id
	const isCoHost = settings.coHosts?.includes(user?.id as unknown as number)
	const isParticipantCoHost = settings.coHosts?.includes(props.participant.id)
	const isParticipantHost = props.participant.id === settings.host.id
	const hasPermissions = (isHost || isCoHost) && !isParticipantHost
	const [open, setOpen] = useState(false)
	const [participant, setParticipant] = useState<User | null>(null)

	return (
		<>
			<Dropdown.Root>
				<Dropdown.Trigger asChild>
					<button className="p-[2px] bg-brand/20 group-hover:bg-brand absolute right-0 top-0 rounded-bl-md">
						<OptionsIcon size={14} />
					</button>
				</Dropdown.Trigger>
				<Dropdown.Portal>
					<Dropdown.Content
						className="min-w-[100px] rounded-lg p-2 shadow-md bg-bg flex flex-col gap-2 border border-border"
						side="top"
						sideOffset={10}
						onCloseAutoFocus={(e) => e.preventDefault()}
					>
						<Dropdown.Item
							className="flex gap-3 items-center data-[highlighted]:outline-none data-[highlighted]:bg-accent px-2 py-1 rounded-md"
							onClick={() => {
								props.setTab('messages')
								props.setPM(props.participant)
								setTimeout(() => {
									const el = document.getElementById('messages-textarea')
									if (el) {
										el.focus()
									}
								}, 0)
							}}
						>
							<MsgIcon size={18} className="text-muted" />
							<p>PM</p>
						</Dropdown.Item>
						{isHost && (
							<Dropdown.Item
								className="flex gap-3 items-center data-[highlighted]:outline-none data-[highlighted]:bg-accent px-2 py-1 rounded-md"
								onClick={() => {
									ws.assignRole(
										isParticipantCoHost ? 'guest' : 'coHost',
										props.participant.id
									)
								}}
							>
								<CoHostIcon size={18} className="text-muted" />
								<p>{isParticipantCoHost ? 'Unset' : 'Set'} Co-Host</p>
							</Dropdown.Item>
						)}
						{isHost && (
							<Dropdown.Item
								className="flex gap-3 items-center data-[highlighted]:outline-none data-[highlighted]:bg-accent px-2 py-1 rounded-md"
								onClick={() => {
									ws.transferRoom(props.participant.id)
								}}
							>
								<HostIcon size={18} className="text-muted" />
								<p>Transfer Room</p>
							</Dropdown.Item>
						)}
						{hasPermissions && (
							<Dropdown.Item
								className="flex gap-3 items-center data-[highlighted]:outline-none data-[highlighted]:bg-accent px-2 py-1 rounded-md"
								onClick={() => {
									setParticipant(props.participant)
									setOpen(true)
								}}
							>
								<KickIcon size={18} className="text-muted" />
								<p>Kick</p>
							</Dropdown.Item>
						)}
						{hasPermissions && (
							<Dropdown.Item
								className="flex gap-3 items-center data-[highlighted]:outline-none data-[highlighted]:bg-accent px-2 py-1 rounded-md"
								onClick={() => {
									ws.clearChat(props.participant.id)
								}}
							>
								<ClearChatIcon size={18} className="text-muted" />
								<p>Clear Chat</p>
							</Dropdown.Item>
						)}
					</Dropdown.Content>
				</Dropdown.Portal>
			</Dropdown.Root>

			{open && (
				<KickParticipant
					open={open}
					setOpen={setOpen}
					participant={participant}
				/>
			)}
		</>
	)
}
