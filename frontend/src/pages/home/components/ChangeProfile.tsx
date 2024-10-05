import { config } from '@/config'
import { useAppStore } from '@/stores/appStore'
import * as Dialog from '@radix-ui/react-dialog'

export function ChangeProfile() {
	const open = useAppStore().popups.profile
	const setPopup = useAppStore().setPopup

	return (
		<Dialog.Root
			open={open}
			onOpenChange={(visibility) => {
				setPopup('profile', visibility)
			}}
		>
			<Dialog.Portal>
				<Dialog.Overlay className="bg-overlay fixed inset-0" />
				<Dialog.Content className="bg-bg w-[90vw] max-w-[440px] rounded-md fixed top-[50%] left-[50%] -translate-x-[50%] -translate-y-[50%] p-8 shadow-md focus:outline-none">
					<Dialog.Title className="text-xl font-bold mb-2">
						My Profile
					</Dialog.Title>
					<Dialog.Description className="mb-8 text-muted">
						To update your profile, change it in your Google account and log
						out, then log back in
					</Dialog.Description>
					<div className="justify-end flex justify-end gap-4 items-center">
						<button
							className="bg-muted/20 px-4 py-1 rounded-md"
							onClick={() => {
								setPopup('profile', false)
							}}
						>
							Cancel
						</button>
						<a
							onClick={() => {
								setPopup('profile', false)
							}}
							href={config.googleProfileURL}
							target="_blank"
							rel="noopener noreferrer"
							className="bg-brand text-brand-fg px-4 py-1 rounded-md focus:ring-offset-2 focus:ring-offset-bg"
						>
							Proceed
						</a>
					</div>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	)
}
