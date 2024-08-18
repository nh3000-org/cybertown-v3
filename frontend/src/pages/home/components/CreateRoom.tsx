import * as Dialog from '@radix-ui/react-dialog';
import { Label } from '@radix-ui/react-label';
import { Option, Select } from '@/components/Select';
import { useEffect, useState } from 'react';
import { z } from "zod";
import { useCreateRoom } from '@/hooks/mutations/useCreateRoom';
import { LoadingIcon } from './LoadingIcon';
import { useAppStore } from '@/stores/appStore';
import { MultiValue, SingleValue } from 'react-select'

const createRoomSchema = z.object({
  topic: z.string().min(3, { message: 'Should be minimum of 3 characters' }).max(128, { message: 'Exceeded maximum of 128 characters' }),
  maxParticipants: z.number({ message: 'Provide a value' }),
  languages: z.string().array().min(1, { message: 'Provide a value' }),
})

type Props = {
  open: boolean
  setOpen: (visibility: boolean) => void
}

export function CreateRoom(props: Props) {
  const user = useAppStore().user
  const setAlert = useAppStore().setAlert
  const setToast = useAppStore().setToast
  const { mutateAsync: createRoom, isLoading } = useCreateRoom()

  const [room, setRoom] = useState<{
    topic: string
    maxParticipants?: SingleValue<Option>
    languages: MultiValue<Option>
  }>({
    topic: '',
    languages: []
  })

  const [errors, setErrors] = useState({
    topic: '',
    maxParticipants: '',
    languages: '',
  })

  function onChange(key: keyof typeof room, value: any) {
    setErrors(prev => ({ ...prev, [key]: '' }))
    setRoom(prev => ({
      ...prev,
      [key]: value
    }))
  }

  async function handleCreateRoom() {
    const payload = {
      topic: room.topic.trim(),
      maxParticipants: room.maxParticipants ? Number(room.maxParticipants.value) : undefined,
      languages: room.languages.map(el => el.value),
    }
    const result = createRoomSchema.safeParse(payload)
    if (result.success) {
      try {
        await createRoom(result.data)
      } catch {
        setToast(true, {
          type: "error",
          title: "Create Room",
          description: "Failed to create room. Try Again"
        })
      } finally {
        props.setOpen(false)
      }
      return
    }

    const fieldErrors = result.error.flatten().fieldErrors
    const errors: Record<string, string> = Object.entries(fieldErrors).reduce((acc, curr) => {
      const [key, value] = curr
      if (Array.isArray(value)) {
        return {
          ...acc,
          [key]: value[0],
        }
      }
      return acc
    }, {})

    setErrors(prev => ({
      ...prev,
      ...errors,
    }))
  }

  // this is a workaround to clear the state when
  // the modal gets closed
  useEffect(() => {
    if (!props.open) {
      setRoom({
        topic: '',
        languages: [],
        maxParticipants: undefined
      })
      setErrors({
        topic: '',
        maxParticipants: '',
        languages: '',
      })
    }
  }, [props.open])

  return (
    <Dialog.Root open={props.open} onOpenChange={props.setOpen}>
      <Dialog.Trigger asChild>
        <button onClick={e => {
          e.preventDefault()
          if (user) {
            props.setOpen(true)
            return
          }
          setAlert('login', true)
        }} className="bg-accent text-accent-fg px-4 py-2 rounded-md flex gap-2 focus:ring-accent focus:ring-1 focus:ring-offset-2 focus:ring-offset-bg">
          <span>Create Room</span>
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="bg-overlay/30 inset-0 fixed" />
        <Dialog.Content className="fixed bg-bg-2 text-fg-2 rounded-md shadow-md p-4 top-[50%] left-[50%] -translate-x-[50%] -translate-y-[50%] max-w-[470px] w-[90vw] border border-border focus:outline-none">
          <Dialog.Title className="text-lg font-semibold mb-8">
            Create Room
          </Dialog.Title>

          <div className="flex flex-col gap-3 mb-8">
            <Label htmlFor="topic">Topic</Label>
            <input id="topic" type="text" className="w-full border border-border bg-transparent rounded-md p-2 px-3" autoComplete="off" placeholder="Enter topic name" value={room.topic} onChange={(e) => {
              onChange('topic', e.target.value)
            }} />
            {errors.topic ? <span className="text-danger text-sm">{errors.topic}</span> : null}
          </div>

          <div className="flex flex-col gap-3 flex-1 mb-8">
            <Label htmlFor="maxParticipants">Max Participants</Label>
            <Select placeholder="Select participants" value={room.maxParticipants} setValue={(participants) => {
              onChange('maxParticipants', participants ?? undefined)
            }} options={[
              { value: '-1', label: 'Unlimited' },
              { value: '1', label: '1' },
              { value: '2', label: '2' },
              { value: '3', label: '3' },
              { value: '4', label: '4' },
              { value: '5', label: '5' },
              { value: '6', label: '6' },
              { value: '7', label: '7' },
              { value: '8', label: '8' },
              { value: '9', label: '9' },
              { value: '10', label: '10' },
            ]} />
            {errors.maxParticipants ? <span className="text-danger text-sm">{errors.maxParticipants}</span> : null}
          </div>

          <div className="flex flex-col gap-3 flex-1">
            <Label htmlFor="language">Language</Label>
            <Select multiCount={2} value={room.languages} setValue={(language) => {
              onChange('languages', language ?? [])
            }} isMulti placeholder="Select language" options={[
              { value: 'english', label: 'English' },
              { value: 'tamil', label: 'Tamil' },
              { value: 'hindi', label: 'Hindi' },
              { value: 'vietnamese', label: 'Vietnamese' },
              { value: 'indonesian', label: 'Indonesian' },
            ]} />
            {errors.languages ? <span className="text-danger text-sm">{errors.languages}</span> : null}
          </div>

          <div className="justify-end flex justify-end gap-4 items-center mt-12">
            <button type="button" className="bg-bg-3 text-fg-3 px-4 py-1 rounded-md" onClick={() => {
              props.setOpen(false)
            }}>Cancel</button>
            <button type="submit" className="bg-accent text-accent-fg px-4 py-1 rounded-md focus:ring-accent focus:ring-1 focus:ring-offset-2 focus:ring-offset-bg disabled:opacity-70 flex gap-2 items-center" disabled={isLoading} onClick={handleCreateRoom}>
              {isLoading ? <LoadingIcon className='fill-accent' /> : null}
              <span>Create Room</span>
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
