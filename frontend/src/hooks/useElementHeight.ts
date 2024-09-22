import { useRef, useEffect, useState } from 'react'

export function useElementHeight<T extends HTMLElement>() {
	const ref = useRef<T>(null)
	const [height, setHeight] = useState(0)

	useEffect(() => {
		const updateElementHeight = () => {
			if (ref.current) {
				setHeight(ref.current.offsetHeight)
			}
		}

		updateElementHeight()
		window.addEventListener('resize', updateElementHeight)

		return () => window.removeEventListener('resize', updateElementHeight)
	}, [])

	return { ref, height }
}
