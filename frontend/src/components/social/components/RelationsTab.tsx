import * as Tabs from '@radix-ui/react-tabs'
import React, { useState } from 'react'
import { RelationList } from './RelationList'
import { User } from '@/types'

const relations = [
	{
		value: 'following',
		label: 'Following',
	},
	{
		value: 'followers',
		label: 'Followers',
	},
	{
		value: 'friends',
		label: 'Friends',
	},
]

type Props = {
	setDM: (user: User | null) => void
}

export const RelationsTab = React.forwardRef((props: Props, _ref) => {
	const [relation, setRelation] = useState('following')

	return (
		<Tabs.Root
			className="flex-1 flex flex-col overflow-hidden"
			value={relation}
			onValueChange={setRelation}
		>
			<Tabs.List className="flex justify-between border-b border-border p-1 gap-3">
				{relations.map((r) => {
					return (
						<Tabs.Trigger
							key={r.value}
							value={r.value}
							className="px-2 py-1 rounded-md flex-1 text-muted data-[state=active]:bg-accent data-[state=active]:text-fg data-[state=active]:ring-0 flex gap-2 items-center justify-center"
						>
							<p>{r.label}</p>
						</Tabs.Trigger>
					)
				})}
			</Tabs.List>
			<Tabs.Content asChild value="following">
				<RelationList setDM={props.setDM} relation="following" />
			</Tabs.Content>
			<Tabs.Content asChild value="followers">
				<RelationList setDM={props.setDM} relation="followers" />
			</Tabs.Content>
			<Tabs.Content asChild value="friends">
				<RelationList setDM={props.setDM} relation="friends" />
			</Tabs.Content>
		</Tabs.Root>
	)
})
