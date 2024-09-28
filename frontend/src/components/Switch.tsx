import * as RSwitch from '@radix-ui/react-switch'

type Props = {
	id: string
	checked: boolean
	setChecked: (checked: boolean) => void
}

export function Switch(props: Props) {
	return (
		<RSwitch.Root
			className="w-[42px] h-[20px] bg-accent rounded-full relative data-[state=checked]:bg-brand cursor-default"
			checked={props.checked}
			onCheckedChange={props.setChecked}
			id={props.id}
		>
			<RSwitch.Thumb className="block w-[15px] h-[15px] bg-white rounded-full transition-transform duration-100 translate-x-0.5 will-change-transform data-[state=checked]:translate-x-[24px]" />
		</RSwitch.Root>
	)
}
