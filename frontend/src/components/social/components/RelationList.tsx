import { RelationRes, User } from "@/types"
import { useState } from "react"
import { useRelation } from "@/hooks/queries/useRelation"
import { Users as UsersIcon } from 'lucide-react';
import { LoadingIcon } from "@/pages/home/components/LoadingIcon";
import { Profile } from "@/components/Profile";

const text = {
  'following': "You're not following anyone yet. Pick your favorites!",
  'followers': "You don't have any followers yet. Keep engaging!",
  'friends': "You don't have any friends yet. Start connecting!",
} as const

type Props = {
  setDM: (dm: User | null) => void
  relation: "followers" | "following" | "friends"
}

export function RelationList(props: Props) {
  const [open, setOpen] = useState<Record<number, boolean>>({})
  const { data: users, isLoading } = useRelation(props.relation)

  function openDM(user: RelationRes) {
    if (user.isFriend) {
      props.setDM(user)
    }
  }

  if (isLoading) {
    return (
      <div className="w-[87%] mx-auto mt-20 text-muted flex flex-col items-center justify-center gap-3">
        <LoadingIcon className="fill-white text-accent w-6 h-6" />
      </div>
    )
  }

  if (!isLoading && !users?.length) {
    return (
      <div className="w-[87%] mx-auto mt-20 text-muted flex flex-col items-center justify-center gap-3">
        <UsersIcon strokeWidth={1.5} />
        <p>{text[props.relation]}</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col gap-5">
      {users.map(u => {
        return (
          <div key={u.id} className="flex items-center gap-3">
            <Profile user={u} style={{ width: 32, height: 32 }} open={open[u.id]} setOpen={open => {
              setOpen(prev => ({
                ...prev,
                [u.id]: open
              }))
            }} />
            <p role="button" onClick={() => openDM(u)}>{u.username}</p>
          </div>
        )
      })}
    </div>
  )
}
