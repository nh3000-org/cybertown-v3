import React from 'react'
import { Profile } from "@/components/Profile"
import { useDMs } from "@/hooks/queries/useDMs"
import { User } from "@/types"
import { formatRelative } from 'date-fns'
import { cn, formatDate } from '@/lib/utils'

type Props = {
  setDM: (dm: User | null) => void
}

export const DMList = React.forwardRef((props: Props, _ref) => {
  const { data: dms } = useDMs()
  if (!dms) {
    return null
  }

  return (
    <div className="flex-1 p-4 focus:outline-none flex flex-col gap-5">
      {dms.map(dm => {
        return (
          <div key={dm.user.id} role="button" onClick={() => {
            props.setDM(dm.user)
          }} className="flex gap-3">
            <img className="w-8 h-8 rounded-full mr-1" src={dm.user.avatar} referrerPolicy="no-referrer" />
            <div className="flex items-center justify-between flex-1 overflow-x-hidden">
              <div className="w-full overflow-x-hidden">
                <div className="flex justify-between items-baseline gap-4">
                  <p>{dm.user.username}</p>
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
