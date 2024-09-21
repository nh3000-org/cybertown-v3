import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClientProvider } from 'react-query'
import { queryClient } from '@/lib/utils'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import { HomePage } from '@/pages/home'
import { RoomPage } from '@/pages/room'
import '@/lib/ws'
import { App } from '@/components/App'
import * as Toast from '@radix-ui/react-toast';

import '@/styles/index.css'
import '@/styles/react-select.css'
import '@/styles/prose.css'
import { NotFound } from './pages/NotFound';
import { ErrorPage } from './pages/ErrorPage';

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: "*",
        element: <NotFound />
      },
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
      <Toast.Provider>
        <RouterProvider router={router} />
        <Toast.Viewport className="fixed top-4 right-4" />
      </Toast.Provider>
    </QueryClientProvider>
  </React.StrictMode>,
)
