import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClientProvider } from 'react-query'
import { queryClient } from '@/lib/utils'
import '@/styles/index.css'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import { HomePage } from '@/pages/home'
import { RoomPage } from '@/pages/room'
import '@/lib/ws'
import { App } from '@/components/App'

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "/",
        element: <HomePage />,
      },
      {
        path: "/room/:roomID",
        element: <RoomPage />,
      },
    ]
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>,
)
