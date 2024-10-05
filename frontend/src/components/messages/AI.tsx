import { Bot as AIIcon } from 'lucide-react'
import * as Popover from '@radix-ui/react-popover'

export function AI() {
	return (
		<Popover.Root>
			<Popover.Trigger>
				<AIIcon
					strokeWidth={1.4}
					size={25}
					className="text-muted relative top-[1px]"
				/>
			</Popover.Trigger>
			<Popover.Anchor />
			<Popover.Portal>
				<Popover.Content
					side="top"
					align="end"
					sideOffset={28}
					onCloseAutoFocus={(e) => e.preventDefault()}
					className="p-4 max-w-[300px] bg-bg-2 focus:outline-none border border-border rounded-md flex flex-col items-center"
				>
					<p>
						Get quick answers to your questions by typing your query and ask our
						AI chatbot.
					</p>
					<p className="bg-bg px-6 py-1 border border-border mt-4 rounded-md">{`/ai {your query}`}</p>
				</Popover.Content>
			</Popover.Portal>
		</Popover.Root>
	)
}
