import * as Dialog from '@radix-ui/react-dialog';
import { Label } from '@radix-ui/react-label';
import { Select } from './Select';
import { useEffect, useState } from 'react';
import { z } from "zod";
import { useCreateRoom } from '@/hooks/mutations/useCreateRoom';
import { LoadingIcon } from './LoadingIcon';

const createRoomSchema = z.object({
  topic: z.string().min(3),
  maxParticipants: z.string().min(1),
  language: z.string().min(1),
})

type Props = {
  open: boolean
  setOpen: (visibility: boolean) => void
}

export function CreateRoom(props: Props) {
  const { mutateAsync: createRoom, isLoading } = useCreateRoom()

  const [room, setRoom] = useState({
    topic: '',
    maxParticipants: '',
    language: '',
  })

  const [errors, setErrors] = useState({
    topic: '',
    maxParticipants: '',
    language: '',
  })

  function onChange(key: keyof typeof room, value: string) {
    setErrors(prev => ({ ...prev, [key]: '' }))
    setRoom(prev => ({
      ...prev,
      [key]: value
    }))
  }

  async function handleCreateRoom() {
    const result = createRoomSchema.safeParse({ ...room, topic: room.topic.trim() })
    if (result.success) {
      try {
        await createRoom({
          topic: room.topic,
          maxParticipants: Number(room.maxParticipants),
          language: room.language
        })
        props.setOpen(false)
      } catch {
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

  return (
    <Dialog.Root open={props.open} onOpenChange={props.setOpen}>
      <Dialog.Trigger asChild>
        <button className="bg-accent text-accent-fg px-4 py-2 rounded-md flex gap-2 focus:ring-accent focus:ring-1 focus:ring-offset-2 focus:ring-offset-bg">
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
            <input id="topic" type="text" className="w-full border border-border bg-transparent rounded-md py-2 px-4" autoComplete="off" placeholder="Enter topic name" value={room.topic} onChange={(e) => {
              onChange('topic', e.target.value)
            }} />
            {errors.topic ? <span className="text-danger text-sm">Topic should contain atleast three characters</span> : null}
          </div>

          <div className="flex gap-8 flex-col md:flex-row md:gap-3">
            <div className="flex flex-col gap-3 flex-1">
              <Label htmlFor="maxParticipants">Max Participants</Label>
              <Select placeholder="Select participants" id="maxParticipants" value={room.maxParticipants} setValue={(maxParticipnats) => {
                onChange("maxParticipants", maxParticipnats)
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
              {errors.maxParticipants ? <span className="text-danger text-sm">Provide a value</span> : null}
            </div>

            <div className="flex flex-col gap-3 flex-1">
              <Label htmlFor="language">Language</Label>
              <Select id="language" placeholder="Select language" value={room.language} setValue={(language) => {
                onChange('language', language)
              }} options={[
                { value: 'english', label: 'English' },
                { value: 'tamil', label: 'Tamil' },
                { value: 'hindi', label: 'Hindi' },
                { value: 'vietnamese', label: 'Vietnamese' },
                { value: 'indonesian', label: 'Indonesian' },
              ]} />
              {errors.language ? <span className="text-danger text-sm">Provide a value</span> : null}
            </div>
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
