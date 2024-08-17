import { VerticalScrollbar } from '@/components/VerticalScrollbar';
import * as RSelect from '@radix-ui/react-select';
import { ChevronDown as ChevronDownIcon } from 'lucide-react'
import * as ScrollArea from '@radix-ui/react-scroll-area';

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
        <RSelect.Content className="rounded-lg shadow-md bg-bg-2 text-fg-2 border border-border h-[200px] overflow-hidden" position='popper' sideOffset={10}>
          <ScrollArea.Root className="overflow-hidden">
            <RSelect.Viewport asChild>
              <ScrollArea.Viewport className="h-full w-full p-2" style={{ overflowY: undefined }}>
                {props.options.map(option => {
                  return (
                    <RSelect.Item key={option.value} value={option.value} className="data-[highlighted]:outline-none data-[highlighted]:bg-highlight px-2 py-1 rounded-md mb-1">
                      {option.label}
                    </RSelect.Item>
                  )
                })}
              </ScrollArea.Viewport>
            </RSelect.Viewport>
            <VerticalScrollbar />
          </ScrollArea.Root>
        </RSelect.Content>
      </RSelect.Portal>
    </RSelect.Root>
  )
}
