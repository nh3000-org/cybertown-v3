import { useAppStore } from "@/stores/appStore"
import { UserMenu } from "@/pages/home/components/UserMenu"
import { LoadingIcon } from "./LoadingIcon"

export function Header() {
  const user = useAppStore().user
  const setAlert = useAppStore().setAlert
  const setOpen = useAppStore().setCreateOrUpdateRoom

  return (
    <header>
      <div className="flex justify-end">
        {user === undefined ? <LoadingIcon className="text-accent/20 fill-accent w-5 h-5" /> : user ? <UserMenu /> :
          <button onClick={() => {
            setAlert("login", true)
          }} className="bg-accent text-accent-fg px-4 py-1 rounded-lg rounded-md focus:ring-accent focus:ring-1 focus:ring-offset-2 focus:ring-offset-bg">Login</button>}
      </div>
      <h1 className="text-4xl font-bold text-center my-8">Cybertown</h1>
      <button onClick={() => setOpen(true)} className="bg-accent text-accent-fg px-4 py-2 rounded-md flex gap-2 focus:ring-accent focus:ring-1 focus:ring-offset-2 focus:ring-offset-bg">
        <span>Create Room</span>
      </button>
    </header>
  )
}
