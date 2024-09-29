import { useLogout } from '@/hooks/mutations/useLogout'
import * as Dialog from '@radix-ui/react-dialog'
import { useAppStore } from '@/stores/appStore'
import { LoadingIcon } from './LoadingIcon'

export function LogoutAlert() {
	const open = useAppStore().popups.logout
	const { mutateAsync: logout, isLoading } = useLogout()
	const setPopup = useAppStore().setPopup
	const setToast = useAppStore().setToast

	return (
		<Dialog.Root
			open={open}
			onOpenChange={(visibility) => {
				setPopup('logout', visibility)
			}}
		>
			<Dialog.Portal>
				<Dialog.Overlay className="bg-overlay fixed inset-0" />
				<Dialog.Content className="bg-bg w-[90vw] max-w-[550px] rounded-lg fixed top-[50%] left-[50%] -translate-x-[50%] -translate-y-[50%] p-8 shadow-md focus:outline-none">
					<Dialog.Title className="text-xl font-bold mb-2">Logout</Dialog.Title>
					<Dialog.Description className="mb-8 text-muted">
						Are you sure you want to logout?
					</Dialog.Description>
					<div className="flex justify-end gap-5 items-center">
						<button
							className="bg-muted/20 px-4 py-1 rounded"
							onClick={() => {
								setPopup('logout', false)
							}}
						>
							Cancel
						</button>
						<button
							className="bg-danger text-white px-4 py-1 rounded focus:ring-danger focus:ring-1 focus:ring-offset-2 focus:ring-offset-bg flex gap-3 items-center disabled:opacity-70"
							disabled={isLoading}
							onClick={async () => {
								try {
									await logout()
								} catch (err) {
									setToast(true, {
										type: 'error',
										title: 'Logout',
										description: 'Failed to logout. Try Again',
									})
								} finally {
									setPopup('logout', false)
								}
							}}
						>
							{isLoading && <LoadingIcon className="fill-danger" />}
							<span>Log Out</span>
						</button>
					</div>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	)
}
