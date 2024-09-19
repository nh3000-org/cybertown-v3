import { useAppStore } from "@/stores/appStore"
import { UserMenu } from "@/pages/home/components/UserMenu"
import React from 'react'

export const Header = React.forwardRef<HTMLElement, any>((_props, ref) => {
  const user = useAppStore().user
  const setAlert = useAppStore().setAlert
  const setOpen = useAppStore().setCreateOrUpdateRoom

  return (
    <header ref={ref} className="fixed top-0 left-0 right-0 z-1 bg-bg py-4">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-end">
          {user ? <UserMenu /> :
            <button onClick={() => {
              setAlert("login", true)
            }} className="bg-accent text-accent-fg px-4 py-1 rounded-lg rounded-md focus:ring-accent focus:ring-1 focus:ring-offset-2 focus:ring-offset-bg">Login</button>}
        </div>
        <h1 className="text-4xl font-bold text-center my-8">Cybertown</h1>
        <button onClick={() => setOpen(true)} className="bg-accent text-accent-fg px-4 py-2 rounded-md flex gap-2 focus:ring-accent focus:ring-1 focus:ring-offset-2 focus:ring-offset-bg">
          <span>Create Room</span>
        </button>
      </div>
    </header>
  )
})