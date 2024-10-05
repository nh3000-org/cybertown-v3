import * as Tabs from '@radix-ui/react-tabs'
import { RelationsTab } from './components/RelationsTab'
import { DM } from './components/DM'
import { DMList } from './components/DMList'
import { useSocial } from '@/context/SocialContext'

type Props = {
	hasUnread: boolean
}

export function Social(props: Props) {
	const { state: socialState, actions: socialActions } = useSocial()

	if (socialState.dm) {
		return <DM />
	}

	return (
		<Tabs.Root
			className="flex flex-col h-full"
			value={socialState.tab}
			onValueChange={(tab) => {
				socialActions.setTab(tab)
			}}
		>
			<Tabs.List className="flex justify-between border-b border-border p-1 gap-3">
				<Tabs.Trigger
					value="messages"
					className="px-2 py-1 rounded-md flex-1 text-muted data-[state=active]:bg-accent data-[state=active]:text-fg data-[state=active]:ring-0 flex gap-2 items-center justify-center"
				>
					<div className="relative">
						<p>Messages</p>
						{props.hasUnread && (
							<span className="w-2 h-2 rounded-full rounded-full block bg-danger absolute -right-[10px] top-0" />
						)}
					</div>
				</Tabs.Trigger>
				<Tabs.Trigger
					value="relations"
					className="px-2 py-1 rounded-md flex-1 text-muted data-[state=active]:bg-accent data-[state=active]:text-fg data-[state=active]:ring-0 flex gap-2 items-center justify-center"
				>
					<p>People</p>
				</Tabs.Trigger>
			</Tabs.List>
			<Tabs.Content asChild value="messages">
				<DMList />
			</Tabs.Content>
			<Tabs.Content asChild value="relations">
				<RelationsTab />
			</Tabs.Content>
		</Tabs.Root>
	)
}
