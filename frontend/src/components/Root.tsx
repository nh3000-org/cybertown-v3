import { useMe } from '@/hooks/queries/useMe'
import { useAppStore } from '@/stores/appStore'
import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Toast } from './Toast'
import { CreateRoom } from '@/pages/home/components/CreateRoom'
import { LogoutAlert } from '@/pages/home/components/LogoutAlert'
import { LoginAlert } from '@/pages/home/components/LoginAlert'
import { useEmoji } from '@/hooks/queries/useEmoji'
import { init } from 'emoji-mart'
import { useLanguages } from '@/hooks/queries/useLanguages'
import { Theme } from './Theme'

type Props = {
	children?: React.ReactNode
}

export function Root(props: Props) {
	const { data: user, isLoading, error } = useMe()
	const setUser = useAppStore().setUser

	const { data: emoji } = useEmoji()
	useLanguages()

	useEffect(() => {
		if (isLoading) {
			return
		}
		setUser(error ? null : user)
	}, [user, isLoading, error])

	// load emojis for "em-emoji" web component
	useEffect(() => {
		init({ data: emoji })
	}, [])

	return (
		<>
			{props.children ?? <Outlet />}
			<Toast />
			<CreateRoom />
			<LogoutAlert />
			<LoginAlert />
			<Theme />
		</>
	)
}
