import { getGoogleOAuthURL } from '@/lib/utils'
import { useAppStore } from '@/stores/appStore'
import * as Dialog from '@radix-ui/react-dialog'

export function LoginAlert() {
	const open = useAppStore().alerts.login
	const setAlert = useAppStore().setAlert

	return (
		<Dialog.Root
			open={open}
			onOpenChange={(visibility) => {
				setAlert('login', visibility)
			}}
		>
			<Dialog.Portal>
				<Dialog.Overlay className="bg-overlay/30 fixed inset-0" />
				<Dialog.Content className="border border-border w-[90vw] max-w-[550px] rounded-md fixed top-[50%] left-[50%] -translate-x-[50%] -translate-y-[50%] p-8 shadow-md focus:outline-none bg-bg-2">
					<Dialog.Title className="text-xl font-bold mb-2">Login</Dialog.Title>
					<Dialog.Description className="mb-8 text-muted">
						You'll redirected to google to login
					</Dialog.Description>
					<div className="justify-end flex justify-end gap-4 items-center">
						<button
							className="bg-bg-3 text-fg-3 px-4 py-1 rounded-md"
							onClick={() => {
								setAlert('login', false)
							}}
						>
							Cancel
						</button>
						<button
							className="bg-accent text-accent-fg px-4 py-1 rounded-md focus:ring-accent focus:ring-1 focus:ring-offset-2 focus:ring-offset-bg"
							onClick={() => {
								window.location.href = getGoogleOAuthURL()
							}}
						>
							Log In
						</button>
					</div>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	)
}
