import { useEffect } from 'react'

export function useFavicon(value: boolean) {
	useEffect(() => {
		let link: HTMLLinkElement | null =
			document.querySelector("link[rel='icon']")
		if (!link) {
			return
		}
		link.href = value ? '/logo-red-dot.svg' : '/logo.svg'
	}, [value])
}
