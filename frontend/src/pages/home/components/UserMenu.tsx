import { useAppStore } from '@/stores/appStore'
import * as Dropdown from '@radix-ui/react-dropdown-menu'
import { User as UserIcon, Sun as SunIcon } from 'lucide-react'
import { LogOut as LogOutIcon } from 'lucide-react'

export function UserMenu() {
	const user = useAppStore().user!
	const setPopup = useAppStore().setPopup

	return (
		<Dropdown.Root>
			<Dropdown.Trigger className="flex items-center gap-3 border border-border rounded-full px-4 py-2">
				<img
					className="w-6 h-6 rounded-full"
					src={user.avatar}
					alt={`${user.username}'s avatar`}
					referrerPolicy="no-referrer"
				/>
				<span>{user.username}</span>
			</Dropdown.Trigger>
			<Dropdown.Portal>
				<Dropdown.Content
					className="rounded-lg p-2 shadow-md bg-bg flex flex-col gap-2 border border-border"
					sideOffset={8}
					onCloseAutoFocus={(e) => e.preventDefault()}
				>
					<Dropdown.Item className="flex gap-3 items-center data-[highlighted]:outline-none data-[highlighted]:bg-accent px-2 py-1 rounded-md">
						<UserIcon size={20} className="text-muted" />
						<span>Profile</span>
					</Dropdown.Item>
					<Dropdown.Item
						className="flex gap-3 items-center data-[highlighted]:outline-none data-[highlighted]:bg-accent px-2 py-1 rounded-md"
						onClick={() => setPopup('theme', true)}
					>
						<SunIcon size={20} className="text-muted" />
						<span>Switch Theme</span>
					</Dropdown.Item>
					<Dropdown.Item
						className="flex gap-3 items-center data-[highlighted]:outline-none data-[highlighted]:bg-accent px-2 py-1 rounded-md"
						onClick={() => {
							setPopup('logout', true)
						}}
					>
						<LogOutIcon size={20} className="text-muted" />
						<span>Log Out</span>
					</Dropdown.Item>
				</Dropdown.Content>
			</Dropdown.Portal>
		</Dropdown.Root>
	)
}
