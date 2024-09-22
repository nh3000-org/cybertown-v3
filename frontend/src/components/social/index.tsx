import * as Tabs from '@radix-ui/react-tabs'
import { useState } from 'react'
import { RelationsTab } from './components/RelationsTab'
import { User } from '@/types'
import { DM } from './components/DM'
import { DMList } from './components/DMList'

type Props = {
	hasUnread: boolean
}

export function Social(props: Props) {
	const [tab, setTab] = useState('messages')
	const [dm, setDM] = useState<User | null>(null)

	if (dm) {
		return <DM user={dm} setDM={setDM} />
	}

	return (
		<Tabs.Root
			className="flex flex-col h-full"
			value={tab}
			onValueChange={setTab}
		>
			<Tabs.List className="flex justify-between border-b border-border p-1 gap-3">
				<Tabs.Trigger
					value="messages"
					className="px-2 py-1 rounded-md flex-1 text-muted data-[state=active]:bg-highlight/30 data-[state=active]:text-fg data-[state=active]:ring-0 flex gap-2 items-center justify-center"
				>
					<div className="relative">
						<p>Messages</p>
						{props.hasUnread && (
							<span className="w-2 h-2 rounded-full rounded-full block bg-danger absolute -right-[10px] top-0" />
						)}
					</div>
				</Tabs.Trigger>
				<Tabs.Trigger
					value="users"
					className="px-2 py-1 rounded-md flex-1 text-muted data-[state=active]:bg-highlight/30 data-[state=active]:text-fg data-[state=active]:ring-0 flex gap-2 items-center justify-center"
				>
					<p>Social</p>
				</Tabs.Trigger>
			</Tabs.List>
			<Tabs.Content asChild value="users">
				<RelationsTab setDM={setDM} />
			</Tabs.Content>
			<Tabs.Content asChild value="messages">
				<DMList setDM={setDM} />
			</Tabs.Content>
		</Tabs.Root>
	)
}
