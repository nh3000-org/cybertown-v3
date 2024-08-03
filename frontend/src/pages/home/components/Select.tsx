import * as RSelect from '@radix-ui/react-select';
import { ChevronDown as ChevronDownIcon } from 'lucide-react'

export type Option = {
  label: string
  value: string
}

type Props = {
  value: string
  options: Option[]
  setValue: (value: string) => void
  id: string
  placeholder: string
}

export function Select(props: Props) {
  const labelMap: Record<string, string> = props.options.reduce((acc, curr) => {
    return {
      ...acc,
      [curr.value]: curr.label
    }
  }, {})

  return (
    <RSelect.Root value={props.value} onValueChange={props.setValue}>
      <RSelect.Trigger id={props.id} className='flex items-center justify-between bg-bg-3 text-fg-3 px-4 py-2 rounded-md'>
        <RSelect.Value placeholder={props.placeholder}>
          {labelMap[props.value]}
        </RSelect.Value>
        <RSelect.Icon>
          <ChevronDownIcon size={20} className="text-muted" />
        </RSelect.Icon>
      </RSelect.Trigger>
      <RSelect.Portal>
        <RSelect.Content className="rounded-lg p-2 shadow-md bg-bg-2 text-fg-2 border border-border" position='popper' sideOffset={10}>
          <RSelect.Viewport className='max-h-[200px] flex flex-col gap-2'>
            {props.options.map(option => {
              return (
                <RSelect.Item key={option.value} value={option.value} className="data-[highlighted]:outline-none data-[highlighted]:bg-highlight px-2 py-1 rounded-md">
                  {option.label}
                </RSelect.Item>
              )
            })}
          </RSelect.Viewport>
        </RSelect.Content>
      </RSelect.Portal>
    </RSelect.Root>
  )
}
