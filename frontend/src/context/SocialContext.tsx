import React, { useReducer } from 'react'
import { User } from '@/types'

type Props = {
	children: React.ReactNode
}

type State = {
	dm: User | null
	tab: string
	relationsTab: string
}

type Action =
	| { type: 'SET_TAB'; payload: string }
	| { type: 'SET_RELATIONS_TAB'; payload: string }
	| { type: 'SET_DM'; payload: User | null }

// Action creators
const setTab = (tab: string) => ({ type: 'SET_TAB' as const, payload: tab })
const setRelationsTab = (tab: string) => ({
	type: 'SET_RELATIONS_TAB' as const,
	payload: tab,
})
const setDM = (user: User | null) => ({
	type: 'SET_DM' as const,
	payload: user,
})

const SocialContext = React.createContext<
	| {
			state: State
			actions: {
				setTab: (tab: string) => void
				setRelationsTab: (tab: string) => void
				setDM: (user: User | null) => void
			}
	  }
	| undefined
>(undefined)

function reducer(state: State, action: Action): State {
	switch (action.type) {
		case 'SET_TAB':
			return { ...state, tab: action.payload }
		case 'SET_RELATIONS_TAB':
			return { ...state, relationsTab: action.payload }
		case 'SET_DM':
			return { ...state, dm: action.payload }
	}
}

export function SocialProvider({ children }: Props) {
	const [state, dispatch] = useReducer(reducer, {
		tab: 'messages',
		relationsTab: 'following',
		dm: null,
	})

	const actions = {
		setTab: (tab: string) => dispatch(setTab(tab)),
		setRelationsTab: (tab: string) => dispatch(setRelationsTab(tab)),
		setDM: (user: User | null) => dispatch(setDM(user)),
	}

	return (
		<SocialContext.Provider value={{ state, actions }}>
			{children}
		</SocialContext.Provider>
	)
}

export function useSocial() {
	const context = React.useContext(SocialContext)
	if (context === undefined) {
		throw new Error('useSocial must be used within a SocialProvider')
	}
	return context
}
