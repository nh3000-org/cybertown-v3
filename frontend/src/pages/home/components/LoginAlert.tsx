import { getGoogleOAuthURL } from '@/lib/utils';
import * as AlertDialog from '@radix-ui/react-alert-dialog';

export function LoginAlert() {
  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger asChild>
        <button className="bg-accent text-accent-fg px-4 py-1 rounded-lg rounded-md focus:ring-accent focus:ring-1 focus:ring-offset-2 focus:ring-offset-bg">Login</button>
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="bg-overlay/30 fixed inset-0" />
        <AlertDialog.Content className="border border-border w-[90vw] max-w-[550px] rounded-md fixed top-[50%] left-[50%] -translate-x-[50%] -translate-y-[50%] p-8 shadow-md focus:outline-none bg-bg-2">
          <AlertDialog.Title className="text-xl font-bold mb-2">
            Login
          </AlertDialog.Title>
          <AlertDialog.Description className="mb-8 text-muted">
            You'll redirected to google to login
          </AlertDialog.Description>
          <AlertDialog.Action asChild>
            <div className="justify-end flex justify-end gap-4 items-center">
              <button className="bg-bg-3 text-fg-3 px-4 py-1 rounded-md" onClick={() => {
              }}>Cancel</button>
              <button className="bg-accent text-accent-fg px-4 py-1 rounded-md focus:ring-accent focus:ring-1 focus:ring-offset-2 focus:ring-offset-bg" onClick={() => {
                window.location.href = getGoogleOAuthURL()
              }}>Log In</button>
            </div>
          </AlertDialog.Action>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
};
