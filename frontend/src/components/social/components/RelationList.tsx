import { RelationRes, User } from "@/types"

type Props = {
  users: RelationRes[]
  setDM: (dm: User | null) => void
}

export function RelationList(props: Props) {
  return (
    <div className="flex flex-col gap-5">
      {props.users.map(u => {
        return (
          <div role="button" key={u.id} className="flex items-center gap-4" onClick={() => {
            if (u.isFriend) {
              props.setDM(u)
            }
          }}>
            <img className="w-8 h-8 rounded-full" src={u.avatar} referrerPolicy="no-referrer" />
            <p>{u.username}</p>
          </div>
        )
      })}
    </div>
  )
}
