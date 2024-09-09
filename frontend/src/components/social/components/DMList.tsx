import React, { useState } from 'react'
import { useDMs } from "@/hooks/queries/useDMs"
import { User } from "@/types"
import { LoadingIcon } from '@/pages/home/components/LoadingIcon'
import { Mail as MessagesIcon } from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'
import { Profile } from '@/components/Profile'

type Props = {
  setDM: (dm: User | null) => void
}

export const DMList = React.forwardRef((props: Props, _ref) => {
  const { data: dms, isLoading } = useDMs()
  const [open, setOpen] = useState<Record<number, boolean>>({})

  if (isLoading) {
    return (
      <div className="w-[87%] mx-auto mt-20 text-muted flex flex-col items-center justify-center gap-3">
        <LoadingIcon className="fill-white text-accent w-6 h-6" />
      </div>
    )
  }

  if (!isLoading && !dms?.length) {
    return (
      <div className="w-[87%] mx-auto mt-20 text-muted flex flex-col items-center justify-center gap-3">
        <MessagesIcon strokeWidth={1.5} />
        <p>You haven't messaged with anyone yet. Start a conversation!</p>
      </div>
    )
  }

  return (
    <div className="flex-1 p-4 focus:outline-none flex flex-col gap-5">
      {dms.map(dm => {
        return (
          <div key={dm.user.id} className="flex gap-2">
            <Profile
              user={dm.user}
              style={{ width: 32, height: 32 }}
              open={open[dm.user.id]}
              setOpen={(open) => {
                setOpen(prev => ({
                  ...prev,
                  [dm.user.id]: open
                }))
              }}
            />
            <div className="flex items-center justify-between flex-1 overflow-x-hidden">
              <div className="w-full overflow-x-hidden">
                <div className="flex justify-between items-baseline gap-4">
                  <p role="button" onClick={() => props.setDM(dm.user)}>{dm.user.username}</p>
                  {dm.lastMessage && (
                    <p className="text-muted text-sm">{formatDate(dm.lastMessage.createdAt)}</p>
                  )}
                </div>
                {dm.lastMessage && (
                  <p className={cn("text-muted text-sm ellipsis", {
                    "italic": dm.lastMessage.isDeleted
                  })}>{dm.lastMessage.isDeleted ? 'This message has been deleted' : dm.lastMessage.content}</p>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
})
