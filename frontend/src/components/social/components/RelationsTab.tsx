import * as Tabs from '@radix-ui/react-tabs'
import React from 'react'
import { RelationList } from './RelationList'
import { useSocial } from '@/context/SocialContext'

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

export const RelationsTab = React.forwardRef((_props, _ref) => {
	const { state: socialState, actions: socialActions } = useSocial()

	return (
		<Tabs.Root
			className="flex-1 flex flex-col overflow-hidden"
			value={socialState.relationsTab}
			onValueChange={(tab) => {
				socialActions.setRelationsTab(tab)
			}}
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
				<RelationList relation="following" />
			</Tabs.Content>
			<Tabs.Content asChild value="followers">
				<RelationList relation="followers" />
			</Tabs.Content>
			<Tabs.Content asChild value="friends">
				<RelationList relation="friends" />
			</Tabs.Content>
		</Tabs.Root>
	)
})
