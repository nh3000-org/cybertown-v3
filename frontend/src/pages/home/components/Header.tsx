import { useAppStore } from '@/stores/appStore'
import { UserMenu } from '@/pages/home/components/UserMenu'
import { LoadingIcon } from './LoadingIcon'

export function Header() {
	const user = useAppStore().user
	const setAlert = useAppStore().setAlert
	const setOpen = useAppStore().setCreateOrUpdateRoom

	return (
		<header>
			<div className="flex justify-end">
				{user === undefined ? (
					<LoadingIcon className="text-brand/20 fill-brand w-6 h-6 my-2" />
				) : user ? (
					<UserMenu />
				) : (
					<button
						onClick={() => {
							setAlert('login', true)
						}}
						className="bg-brand text-brand-fg h-8 my-1 px-4 rounded-lg rounded-md focus:ring-brand focus:ring-1 focus:ring-offset-2 focus:ring-offset-bg"
					>
						Login
					</button>
				)}
			</div>
			<h1 className="text-4xl font-bold text-center my-8">Cybertown</h1>
			<button
				onClick={() => setOpen(true)}
				className="bg-brand text-brand-fg px-4 py-2 rounded-md flex gap-2 focus:ring-brand focus:ring-1 focus:ring-offset-2 focus:ring-offset-bg"
			>
				<span>Create Room</span>
			</button>
		</header>
	)
}
