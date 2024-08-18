import { useLogout } from "@/hooks/mutations/useLogout";
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { useAppStore } from '@/stores/appStore'
import { LoadingIcon } from "./LoadingIcon";

export function LogoutAlert() {
  const open = useAppStore().alerts.logout
  const { mutateAsync: logout, isLoading } = useLogout()
  const setAlert = useAppStore().setAlert
  const setToast = useAppStore().setToast

  return (
    <AlertDialog.Root open={open} onOpenChange={(visibility) => {
      setAlert("logout", visibility)
    }}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="bg-overlay/30 fixed inset-0" />
        <AlertDialog.Content className="border border-border w-[90vw] max-w-[550px] rounded-lg fixed top-[50%] left-[50%] -translate-x-[50%] -translate-y-[50%] p-8 shadow-md focus:outline-none bg-bg-2">
          <AlertDialog.Title className="text-xl font-bold mb-2">
            Are you sure you want to logout?
          </AlertDialog.Title>
          <AlertDialog.Description className="mb-8 text-muted">
            Think about you friends. You want to leave them like this?
          </AlertDialog.Description>
          <AlertDialog.Action asChild onClick={e => e.preventDefault()}>
            <div className="flex justify-end gap-5 items-center">
              <button className="bg-bg-3 text-fg-3 px-4 py-1 rounded" onClick={() => {
                setAlert('logout', false)
              }}>Cancel</button>
              <button className="bg-danger text-white px-4 py-1 rounded focus:ring-danger focus:ring-1 focus:ring-offset-2 focus:ring-offset-bg flex gap-3 items-center disabled:opacity-70" disabled={isLoading} onClick={async () => {
                try {
                  await logout()
                } catch (err) {
                  setToast(true, {
                    type: "error",
                    title: "Logout",
                    description: "Failed to logout. Try Again",
                  })
                } finally {
                  setAlert('logout', false)
                }
              }}>
                {isLoading && <LoadingIcon className="fill-danger" />}
                <span>Log Out</span>
              </button>
            </div>
          </AlertDialog.Action>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
