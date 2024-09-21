import { LayoutGrid as Icon } from 'lucide-react'

export function NoRooms() {
  return (
    <div className="flex-1 grid place-items-center">
      <div className='flex flex-col justify-center items-center'>
        <Icon className="h-12 w-12 text-accent/50" />
        <h2 className="text-2xl font-bold my-2">No Rooms Available</h2>
        <p className="text-muted mb-6 max-w-[300px] text-center">
          It looks like there are no rooms created yet. Why not be the first to create one?
        </p>
      </div>
    </div>
  )
}
