import { useSocial } from '@/context/SocialContext'
import { X as CloseIcon } from 'lucide-react'
import { Social } from '..'

type Props = {
	close: () => void
	hasUnread: boolean
}

export function SocialWidget(props: Props) {
	const { state: socialState } = useSocial()

	return (
		<div className="top-0 left-0 fixed h-full w-full flex flex-col sm:hidden bg-bg p-2 gap-2 overflow-hidden">
			<div className="border border-border h-full rounded-md overflow-hidden relative">
				<Social hasUnread={props.hasUnread} widget={{ close: props.close }} />
				{!socialState.dm && (
					<button
						className="focus:ring-0 absolute right-2 top-[10px]"
						onClick={props.close}
					>
						<CloseIcon className="text-muted" size={20} />
					</button>
				)}
			</div>
		</div>
	)
}
