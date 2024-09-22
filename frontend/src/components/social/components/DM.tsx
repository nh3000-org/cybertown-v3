import { Messages } from '@/components/messages'
import { useMessages } from '@/hooks/queries/useMessages'
import { useAppStore } from '@/stores/appStore'
import { User } from '@/types'
import { ChevronLeft as LeftIcon } from 'lucide-react'
import { useEffect } from 'react'
import { useInView } from 'react-intersection-observer'
import {
	MESSAGES_LIMIT,
	usePreviousMessages,
} from '../hooks/usePreviousMessages'
import { LoadingIcon } from '@/pages/home/components/LoadingIcon'

type Props = {
	user: User
	setDM: (dm: User | null) => void
}

export function DM(props: Props) {
	const clearDM = useAppStore().clearDM
	const setDM = useAppStore().setDM
	const dmUnread = useAppStore().dmUnread
	const { data: initialMessages, isLoading } = useMessages(props.user.id)
	const messages = useAppStore().dm[props.user.id] ?? []
	const { ref: messagesStartRef, inView } = useInView()
	const { loading: isPrevMessagesLoading, fetchMessages } = usePreviousMessages(
		props.user.id
	)

	const hasMessages = initialMessages?.length
	const startID = hasMessages ? initialMessages[0].id : ''
	const endID = hasMessages
		? initialMessages[initialMessages.length - 1].id
		: ''
	const startIdx = messages.findIndex((msg) => msg.id === startID)
	const endIdx = messages.findIndex((msg) => msg.id === endID)

	useEffect(() => {
		if (initialMessages) {
			setDM(props.user.id, initialMessages)
		}
		return function () {
			clearDM(props.user.id)
		}
	}, [props.user.id, initialMessages])

	useEffect(() => {
		if (inView && !isPrevMessagesLoading && messages.length >= MESSAGES_LIMIT) {
			fetchMessages(messages[0].createdAt).then((messages) => {
				if (messages) {
					setDM(props.user.id, messages)
				}
			})
		}
	}, [inView])

	return (
		<div className="flex flex-col h-full">
			<div className="p-3 border-b border-border flex gap-2 items-center">
				<button className="focus:ring-0" onClick={() => props.setDM(null)}>
					<LeftIcon size={22} className="text-muted" />
				</button>
				<div className="relative">
					<img
						className="w-8 h-8 rounded-full mr-1"
						src={props.user.avatar}
						referrerPolicy="no-referrer"
					/>
					{dmUnread[props.user.id] && (
						<span className="w-[10px] h-[10px] rounded-full rounded-full block bg-danger absolute right-[2px] top-0" />
					)}
				</div>
				<p>{props.user.username}</p>
			</div>

			{isLoading && (
				<div className="flex items-center justify-center flex-1">
					<LoadingIcon className="text-accent/20 fill-accent w-6 h-6" />
				</div>
			)}

			{!isLoading && (
				<Messages
					pm={null}
					setPM={() => {}}
					messages={messages.slice(endIdx === -1 ? 0 : endIdx + 1)}
					room={null}
					dm={props.user}
					initialMessages={
						startIdx === -1 || endIdx === -1
							? []
							: messages.slice(startIdx, endIdx + 1)
					}
					prevMsg={{
						isLoading: isPrevMessagesLoading,
						ref: messagesStartRef,
						messages: startIdx === -1 ? [] : messages.slice(0, startIdx),
					}}
				/>
			)}
		</div>
	)
}
