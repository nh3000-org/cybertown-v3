import RSelect, { MultiValue, SingleValue } from 'react-select'

export type Option = {
	label: string
	value: string
}

type Props = {
	options: Option[]
	placeholder: string
	isMulti?: boolean
	value: SingleValue<Option> | MultiValue<Option> | undefined
	setValue: (value: SingleValue<Option> | MultiValue<Option> | null) => void
	multiCount?: number
	id: string
}

export function Select(props: Props) {
	const { isMulti = false, multiCount = 1 } = props
	return (
		<RSelect
			inputId={props.id}
			isClearable={false}
			placeholder={
				<div className="react-select__placeholder">{props.placeholder}</div>
			}
			onBlur={(event) => {
				// https://github.com/JedWatson/react-select/issues/5732
				const element = event.relatedTarget
				if (
					element &&
					(element.tagName === 'A' ||
						element.tagName === 'BUTTON' ||
						element.tagName === 'INPUT')
				) {
					;(element as HTMLElement).focus()
				}
			}}
			onChange={(data) => {
				props.setValue(data)
			}}
			isMulti={isMulti}
			className="react-select-container"
			classNamePrefix="react-select"
			value={props.value}
			isOptionDisabled={() => {
				if (Array.isArray(props.value)) {
					return props.value.length == multiCount
				}
				return false
			}}
			options={props.options}
		/>
	)
}
