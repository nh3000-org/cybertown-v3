import { useUpdateMe } from '@/hooks/mutations/useUpdateMe'
import { useProfile } from '@/hooks/queries/useProfile'
import { useAppStore } from '@/stores/appStore'
import * as Dialog from '@radix-ui/react-dialog'
import { Label } from '@radix-ui/react-label'
import { useEffect, useState } from 'react'
import { LoadingIcon } from './LoadingIcon'
import { z } from 'zod'
import { flattenError } from '@/lib/utils'

const updateMeSchema = z.object({
	bio: z.string().max(128, { message: 'Should be maximum of 128 characters' }),
})

export function EditBio() {
	const setToast = useAppStore().setToast
	const open = useAppStore().popups.bio
	const setPopup = useAppStore().setPopup
	const userID = useAppStore().user?.id
	const [error, setError] = useState('')
	const [bio, setBio] = useState('')
	const { data: profile } = useProfile(userID!, open === true)
	const { mutateAsync: updateMe, isLoading } = useUpdateMe()

	useEffect(() => {
		if (profile?.bio) {
			setBio(profile.bio)
		}
	}, [profile?.bio])

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault()

		const result = updateMeSchema.safeParse({
			bio: bio.trim(),
		})

		if (!result.success) {
			const errors = flattenError(result.error)
			setError(errors.bio)
			return
		}

		try {
			await updateMe(bio)
		} catch (err) {
			setToast(true, {
				type: 'error',
				title: 'Edit Bio',
				description: 'Failed to edit bio',
			})
		} finally {
			setPopup('bio', false)
		}
	}

	return (
		<Dialog.Root
			open={open}
			onOpenChange={(visibility) => {
				setPopup('bio', visibility)
			}}
		>
			<Dialog.Portal>
				<Dialog.Overlay className="bg-overlay fixed inset-0" />
				<Dialog.Content className="bg-bg w-[90vw] max-w-[480px] rounded-md fixed top-[50%] left-[50%] -translate-x-[50%] -translate-y-[50%] p-8 shadow-md focus:outline-none">
					<Dialog.Title className="text-xl font-bold mb-2">
						Edit Bio
					</Dialog.Title>

					<form onSubmit={handleSubmit}>
						<div className="mt-4 mb-6">
							<Label htmlFor="bio">Bio</Label>
							<textarea
								rows={3}
								value={bio}
								onChange={(e) => {
									setError('')
									setBio(e.target.value)
								}}
								name="bio"
								id="bio"
								className="scroller mt-2 w-full border border-border bg-transparent rounded-md p-2 px-3 disabled:opacity-80 disabled:pointer-events-none focus:border-transparent"
								placeholder="Write about yourself..."
							/>
							{error ? (
								<span className="text-danger text-sm">{error}</span>
							) : null}
						</div>
						<div className="justify-end flex justify-end gap-4 items-center">
							<button
								type="button"
								className="bg-muted/20 px-4 py-1 rounded-md"
								onClick={() => {
									setPopup('bio', false)
								}}
							>
								Cancel
							</button>
							<button className="bg-brand text-brand-fg px-4 py-1 rounded-md focus:ring-offset-2 focus:ring-offset-bg flex gap-2 items-center">
								{isLoading ? <LoadingIcon className="fill-brand" /> : null}
								<span>Edit</span>
							</button>
						</div>
					</form>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	)
}
