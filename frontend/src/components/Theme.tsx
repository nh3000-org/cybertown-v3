import { useAppStore } from '@/stores/appStore'
import * as Dialog from '@radix-ui/react-dialog'
import * as RadioGroup from '@radix-ui/react-radio-group'
import * as constants from '@/constants'
import { Label } from '@radix-ui/react-label'
import { useState } from 'react'
import { Check as TickIcon } from 'lucide-react'
import { bc } from '@/lib/bc'

export function Theme() {
	const open = useAppStore().popups.theme
	const setPopup = useAppStore().setPopup

	const [color, setColor] = useState(() => {
		const root = document.documentElement
		const brandValue = getComputedStyle(root).getPropertyValue('--brand')
		return brandValue
	})

	const [theme, setTheme] = useState(() => {
		return document.documentElement.dataset.theme || 'system'
	})

	return (
		<Dialog.Root
			open={open}
			onOpenChange={(visibility) => {
				setPopup('theme', visibility)
			}}
		>
			<Dialog.Portal>
				<Dialog.Overlay className="bg-overlay fixed inset-0" />
				<Dialog.Content className="bg-bg w-[90vw] max-w-[420px] rounded-md fixed top-[50%] left-[50%] -translate-x-[50%] -translate-y-[50%] p-8 shadow-md focus:outline-none flex flex-col">
					<Dialog.Title className="text-xl font-bold">Theme</Dialog.Title>

					<div className="pt-4 pb-8">
						<div>
							<Label className="inline-block pb-2" htmlFor="color">
								Color
							</Label>
							<RadioGroup.Root
								value={color}
								id="color"
								className="flex justify-between"
								onValueChange={(color) => {
									setColor(color)
									document.documentElement.style.setProperty('--brand', color)
									localStorage.setItem('color', color)
									bc.sendMessage({ name: 'COLOR_CHANGED', color })
								}}
							>
								{constants.brandColors.map((s) => {
									return (
										<RadioGroup.Item
											key={s.hex}
											value={s.rgb}
											className="w-8 h-8 rounded-full flex items-center justify-center text-brand-fg"
											style={{ background: s.hex }}
										>
											<RadioGroup.Indicator asChild>
												<TickIcon size={20} />
											</RadioGroup.Indicator>
										</RadioGroup.Item>
									)
								})}
							</RadioGroup.Root>
						</div>

						<div className="mt-6">
							<Label className="inline-block pb-2" htmlFor="theme">
								Theme
							</Label>
							<RadioGroup.Root
								value={theme}
								id="theme"
								className="flex justify-between gap-4 text-sm"
								onValueChange={(theme) => {
									setTheme(theme)
									document.documentElement.dataset.theme = theme
									localStorage.setItem('theme', theme)
									bc.sendMessage({ name: 'THEME_CHANGED', theme })
								}}
							>
								{constants.themes.map((t) => {
									return (
										<RadioGroup.Item
											key={t.value}
											value={t.value}
											className="bg-bg-2 border border-border px-4 py-1 rounded-md flex-1 items-center flex gap-3 justify-center"
										>
											<RadioGroup.Indicator asChild>
												<TickIcon size={16} />
											</RadioGroup.Indicator>

											{t.label}
										</RadioGroup.Item>
									)
								})}
							</RadioGroup.Root>
						</div>
					</div>

					<button
						className="bg-muted/20 px-4 py-1 rounded-md self-end"
						onClick={() => {
							setPopup('theme', false)
						}}
					>
						Close
					</button>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	)
}
