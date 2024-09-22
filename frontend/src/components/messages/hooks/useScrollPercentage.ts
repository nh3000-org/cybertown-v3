import { useState, useEffect, RefObject } from 'react'

export const useScrollPercentage = (
	containerRef: RefObject<HTMLDivElement>
) => {
	const [scrollPercentage, setScrollPercentage] = useState(0)

	const debounce = (func: Function, delay: number) => {
		let timeout: ReturnType<typeof setTimeout>
		return (...args: any[]) => {
			clearTimeout(timeout)
			timeout = setTimeout(() => func(...args), delay)
		}
	}

	useEffect(() => {
		const container = containerRef.current

		const handleScroll = debounce(() => {
			if (!container) {
				return
			}

			const scrollTop = container.scrollTop
			const scrollHeight = container.scrollHeight
			const clientHeight = container.clientHeight

			const totalScroll = scrollHeight - clientHeight
			const scrollPercent = (scrollTop / totalScroll) * 100

			setScrollPercentage(scrollPercent)
		}, 300)

		if (container) {
			container.addEventListener('scroll', handleScroll)
		}

		return () => {
			if (container) {
				container.removeEventListener('scroll', handleScroll)
			}
		}
	}, [containerRef])

	return scrollPercentage
}
