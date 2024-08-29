import * as Dialog from '@radix-ui/react-dialog';
import { Label } from '@radix-ui/react-label';
import { Option, Select } from '@/components/Select';
import { useEffect, useState } from 'react';
import { z } from "zod";
import { useCreateRoom } from '@/hooks/mutations/useCreateRoom';
import { LoadingIcon } from './LoadingIcon';
import { useAppStore } from '@/stores/appStore';
import { MultiValue, SingleValue } from 'react-select'
import * as constants from '@/constants'
import { useUpdateRoom } from '@/hooks/mutations/useUpdateRoom';
import { flattenError } from '@/lib/utils';

const createRoomSchema = z.object({
  topic: z.string().min(3, { message: 'Should be minimum of 3 characters' }).max(128, { message: 'Exceeded maximum of 128 characters' }),
  maxParticipants: z.number({ message: 'Provide a value' }),
  languages: z.string().array().min(1, { message: 'Provide a value' }),
})

export function CreateRoom() {
  const setToast = useAppStore().setToast
  const setOpen = useAppStore().setCreateOrUpdateRoom
  const open = useAppStore().createOrUpdateRoom.open
  const editRoom = useAppStore().createOrUpdateRoom.room
  const { mutateAsync: createRoom, isLoading } = useCreateRoom()
  const { mutateAsync: updateRoom, isLoading: isUpdateLoading } = useUpdateRoom()

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
        if (editRoom?.id) {
          await updateRoom({
            room: result.data,
            roomID: editRoom.id
          })
        } else {
          await createRoom(result.data)
        }
      } catch {
        setToast(true, {
          type: "error",
          title: editRoom ? "Edit Room" : "Create Room",
          description: `Failed to ${editRoom ? 'edit' : 'create'} room. Try Again`
        })
      } finally {
        setOpen(false)
      }
      return
    }

    setErrors(prev => ({
      ...prev,
      ...flattenError(result.error),
    }))
  }

  // this is a workaround to clear the state when
  // the modal gets closed
  useEffect(() => {
    if (!open) {
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
  }, [open])

  useEffect(() => {
    if (editRoom) {
      const maxParticipants = constants.maxParticipants.find(p => p.value === String(editRoom.maxParticipants))
      const languages = constants.languages.filter(p => editRoom.languages.includes(p.value))
      setRoom({
        topic: editRoom.topic,
        maxParticipants,
        languages
      })
    }
  }, [editRoom])

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content">
          <Dialog.Title className="text-lg font-semibold mb-8">
            {editRoom ? 'Edit' : 'Create'} Room
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
            <Select id="maxParticipants" placeholder="Select participants" value={room.maxParticipants} setValue={(participants) => {
              onChange('maxParticipants', participants ?? undefined)
            }} options={constants.maxParticipants} />
            {errors.maxParticipants ? <span className="text-danger text-sm">{errors.maxParticipants}</span> : null}
          </div>

          <div className="flex flex-col gap-3 flex-1">
            <Label htmlFor="languages">Language</Label>
            <Select id="languages" multiCount={2} value={room.languages} setValue={(language) => {
              onChange('languages', language ?? [])
            }} isMulti placeholder="Select language" options={constants.languages} />
            {errors.languages ? <span className="text-danger text-sm">{errors.languages}</span> : null}
          </div>

          <div className="justify-end flex justify-end gap-4 items-center mt-12">
            <button type="button" className="bg-bg-3 text-fg-3 px-4 py-1 rounded-md" onClick={() => {
              setOpen(false)
            }}>Cancel</button>
            <button type="submit" className="bg-accent text-accent-fg px-4 py-1 rounded-md focus:ring-accent focus:ring-1 focus:ring-offset-2 focus:ring-offset-bg disabled:opacity-70 flex gap-2 items-center" disabled={isLoading || isUpdateLoading} onClick={handleCreateRoom}>
              {(isLoading || isUpdateLoading) ? <LoadingIcon className='fill-accent' /> : null}
              <span>Submit</span>
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
