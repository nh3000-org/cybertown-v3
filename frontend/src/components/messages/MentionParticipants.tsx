import { RoomRes, User } from '@/types'
import * as Popover from '@radix-ui/react-popover'
import { TextareaSearch } from './hooks/useMention'

type Props = {
	search: TextareaSearch
	setSearch: React.Dispatch<React.SetStateAction<TextareaSearch>>
	room: RoomRes
	textareaRef: React.RefObject<HTMLTextAreaElement>
	selectParticipant: (participant: User) => void
	mentionedParticipants: User[]
}

export function MentionParticipants(props: Props) {
	const {
		search,
		setSearch,
		textareaRef,
		selectParticipant,
		mentionedParticipants,
	} = props

	if (!mentionedParticipants.length) {
		return null
	}

	return (
		<Popover.Root
			open={search.show}
			onOpenChange={(open) => {
				setSearch({
					query: '',
					show: open,
				})
			}}
			modal={false}
		>
			<Popover.Trigger asChild>
				<span />
			</Popover.Trigger>
			<Popover.Portal>
				<Popover.Content
					onFocus={() => {
						setTimeout(() => {
							if (textareaRef.current) {
								textareaRef.current.focus()
							}
						}, 0)
					}}
					onCloseAutoFocus={(e) => e.stopPropagation()}
					sideOffset={-20}
					align="start"
					side="top"
					className="rounded-lg p-2 shadow-md bg-bg-2 flex flex-col gap-2 border border-border w-[280px] focus:outline-none"
					onFocusOutside={(e) => e.preventDefault()}
				>
					{mentionedParticipants.map((p) => {
						return (
							<div
								role="button"
								key={p.id}
								className="flex gap-3 items-center px-2 py-1 rounded-md hover:bg-accent"
								onClick={() => {
									if (textareaRef.current) {
										selectParticipant(p)
									}
								}}
							>
								<img
									className="rounded-full h-4 w-4"
									src={p.avatar}
									referrerPolicy="no-referrer"
								/>
								<span>{p.username}</span>
							</div>
						)
					})}
				</Popover.Content>
			</Popover.Portal>
		</Popover.Root>
	)
}
