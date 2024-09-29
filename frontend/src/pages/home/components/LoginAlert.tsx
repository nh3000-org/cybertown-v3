import { getGoogleOAuthURL } from '@/lib/utils'
import { useAppStore } from '@/stores/appStore'
import * as Dialog from '@radix-ui/react-dialog'

export function LoginAlert() {
	const open = useAppStore().popups.login
	const setPopup = useAppStore().setPopup

	return (
		<Dialog.Root
			open={open}
			onOpenChange={(visibility) => {
				setPopup('login', visibility)
			}}
		>
			<Dialog.Portal>
				<Dialog.Overlay className="bg-overlay fixed inset-0" />
				<Dialog.Content className="bg-bg w-[90vw] max-w-[550px] rounded-md fixed top-[50%] left-[50%] -translate-x-[50%] -translate-y-[50%] p-8 shadow-md focus:outline-none">
					<Dialog.Title className="text-xl font-bold mb-2">Login</Dialog.Title>
					<Dialog.Description className="mb-8 text-muted">
						You'll redirected to google to login
					</Dialog.Description>
					<div className="justify-end flex justify-end gap-4 items-center">
						<button
							className="bg-muted/20 px-4 py-1 rounded-md"
							onClick={() => {
								setPopup('login', false)
							}}
						>
							Cancel
						</button>
						<button
							className="bg-brand text-brand-fg px-4 py-1 rounded-md focus:ring-offset-2 focus:ring-offset-bg"
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
