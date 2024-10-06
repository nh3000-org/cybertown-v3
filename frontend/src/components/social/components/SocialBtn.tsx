import React from 'react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/stores/appStore'
import { Webhook as WebhookIcon } from 'lucide-react'

type Props = {
	classNames?: string
	onClick?: () => void
}

export const SocialBtn = React.forwardRef((props: Props, _ref) => {
	const { classNames = '', onClick = () => {} } = props
	const dmUnread = useAppStore().dmUnread
	const hasUnread = Object.values(dmUnread).some((isUnread) => isUnread)

	return (
		<button
			className={cn(
				'bg-brand text-brand-fg p-3 rounded-full relative focus:ring-brand/40 focus:ring-offset-2 focus:ring-offset-bg',
				classNames
			)}
			onClick={onClick}
		>
			<WebhookIcon size={22} />
			{hasUnread && (
				<span className="w-3 h-3 rounded-full rounded-full block bg-danger absolute right-0 top-0" />
			)}
		</button>
	)
})
