import { PlusIcon } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useState } from 'react'
import { CreateRoom as TCreateRoom } from '@/types'
import { useCreateRoom } from '@/hooks/mutations/useCreateRoom'

type Props = {
  setOpen: (open: boolean) => void
  open: boolean
}

export function CreateRoom(props: Props) {
  const [room, setRoom] = useState<TCreateRoom>({
    topic: '',
    language: 'english',
    maxParticipants: -1,
  })
  const [maxParticipants, setMaxParticipants] = useState('-1')
  const { mutateAsync: createRoom } = useCreateRoom()

  return (
    <Dialog open={props.open} onOpenChange={props.setOpen}>
      <DialogTrigger asChild>
        <Button onClick={() => props.setOpen(true)}>
          <PlusIcon className="mr-2 h-4 w-4" /> Create New Room
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Room</DialogTitle>
        </DialogHeader>
        <div className="mt-6 flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <Label htmlFor="topic">Topic</Label>
            <Input value={room.topic} onChange={e => {
              setRoom(prev => ({ ...prev, topic: e.target.value }))
            }} id="topic" placeholder="Enter topic name" type="text" />
          </div>
          <div className="flex gap-4 items-center">
            <div className="flex flex-col gap-4 flex-1">
              <Label htmlFor="maxParticipants">Max Participants</Label>
              <Select value={maxParticipants} onValueChange={value => {
                setMaxParticipants(value)
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select max participants" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Participants</SelectLabel>
                    <SelectItem value="-1">Unlimited</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="8">8</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-4 flex-1">
              <Label htmlFor="language">Select Language</Label>
              <Select value={room.language} onValueChange={value => {
                setRoom(prev => ({ ...prev, language: value }))
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  <SelectGroup>
                    <SelectLabel>Languages</SelectLabel>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="hindi">Hindi</SelectItem>
                    <SelectItem value="tamil">Tamil</SelectItem>
                    <SelectItem value="malayalam">Malayalam</SelectItem>
                    <SelectItem value="indonesian">Indonesian</SelectItem>
                    <SelectItem value="vietnamese">Vietnamese</SelectItem>
                    <SelectItem value="arabic">Arabic</SelectItem>
                    <SelectItem value="zulu">Zulu</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter className="mt-4">
          <Button type="submit" onClick={async () => {
            await createRoom({ ...room, maxParticipants: Number(maxParticipants) })
            props.setOpen(false)
          }}>Submit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
