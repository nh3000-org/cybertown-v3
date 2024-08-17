import * as Popover from '@radix-ui/react-popover';
import Picker from '@emoji-mart/react'
import { useEmoji } from '@/hooks/queries/useEmoji';
import React from 'react';

type Props = {
  onSelect: (id: string, emoji: string) => void
  open: boolean
  setOpen: (visibility: boolean) => void
  trigger: React.ReactNode
  align?: "start" | "center" | "end"
}

export const EmojiPicker = React.forwardRef((props: Props, _ref: any) => {
  const { trigger, align = "end" } = props
  const { data } = useEmoji()

  return (
    <Popover.Root open={props.open} onOpenChange={props.setOpen}>
      <Popover.Trigger asChild>
        {trigger}
      </Popover.Trigger>
      <Popover.Anchor />
      <Popover.Portal>
        <Popover.Content side='left' align={align} onCloseAutoFocus={e => e.preventDefault()} className='focus:outline-none border border-border rounded-md'>
          <Picker data={data} onEmojiSelect={(data: any) => {
            props.onSelect(data.id, data.native)
          }} previewPosition="none" skinTonePosition="none" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
})
