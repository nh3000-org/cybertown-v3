import * as Popover from '@radix-ui/react-popover'
import { TextareaSearch } from './hooks/useMention'
import { Emoji } from './hooks/useEmojiSearch'

type Props = {
  search: TextareaSearch
  setSearch: React.Dispatch<React.SetStateAction<TextareaSearch>>
  emojis: Emoji[]
  textareaRef: React.RefObject<HTMLTextAreaElement>
  selectEmoji: (emoji: Emoji) => void
}

export function EmojiSearch(props: Props) {
  const { search, setSearch, emojis, textareaRef } = props

  if (!emojis.length) {
    return null
  }

  return (
    <Popover.Root open={search.show} onOpenChange={(open) => {
      setSearch({
        query: '',
        show: open,
      })
    }} modal={false}>
      <Popover.Trigger asChild>
        <span />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content onFocus={() => {
          setTimeout(() => {
            if (textareaRef.current) {
              textareaRef.current.focus()
            }
          }, 0)
        }} onCloseAutoFocus={e => e.stopPropagation()} sideOffset={-20} align='start' side='top' className="rounded-lg p-2 shadow-md bg-bg-2 text-fg-2 flex flex-col gap-2 border border-border w-[280px] focus:outline-none max-h-[200px] scroller overflow-auto" onFocusOutside={e => e.preventDefault()}>
          {emojis.map(e => {
            return (
              <div role="button" key={e.id} className="flex gap-3 items-center px-2 py-1 rounded-md hover:bg-highlight" onClick={() => {
                props.selectEmoji(e)
              }}>
                <span>{e.emoji}</span>
                <span>{e.name}</span>
              </div>
            )
          })}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
