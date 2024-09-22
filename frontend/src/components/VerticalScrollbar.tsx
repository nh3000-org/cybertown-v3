import * as ScrollArea from '@radix-ui/react-scroll-area'

export function VerticalScrollbar() {
	return (
		<ScrollArea.Scrollbar
			className="flex select-none touch-none p-0.5 bg-transparent data-[orientation=vertical]:w-2.5"
			orientation="vertical"
		>
			<ScrollArea.Thumb className="flex-1 bg-scrollbar relative before:content-[''] before:absolute before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:w-full before:h-full before:min-w-[44px] before:min-h-[44px]" />
		</ScrollArea.Scrollbar>
	)
}
