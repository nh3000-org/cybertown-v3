export function RoomError() {
  return (
    <main className="h-full w-full flex items-center justify-center">
      <p className="text-lg font-semibold">Ouch, that room doesn't exists</p>
    </main>
  )
}

export function UserError() {
  return (
    <main className="h-full w-full flex items-center justify-center">
      <p className="text-lg font-semibold">Hey wait, you need to be logged in</p>
    </main>
  )
}
