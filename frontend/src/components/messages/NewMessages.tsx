import { cn } from '@/lib/utils'
import { ChevronDown as DownIcon } from 'lucide-react'
import { useAppStore } from '@/stores/appStore'
import { RefObject } from 'react'

type Props = {
	messagesEndRef: RefObject<HTMLDivElement>
}

export function NewMessages(props: Props) {
	const unreadCount = useAppStore().unreadCount
	return (
		<button
			onClick={() => {
				props.messagesEndRef.current?.scrollIntoView()
			}}
			className={cn(
				'flex gap-2 items-center bg-bg-2 p-2 absolute top-0 left-0 -translate-y-full w-full focus:ring-0 text-sm',
				{
					invisible: unreadCount === 0,
				}
			)}
		>
			<span>
				Scroll down to see {unreadCount > 100 ? `${unreadCount}+` : unreadCount}{' '}
				new message(s)
			</span>
			<DownIcon strokeWidth={1.5} className="relative top-[1px]" />
		</button>
	)
}
