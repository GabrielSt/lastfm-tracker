import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import Artists from '@/pages/Artists';
import Tracks from '@/pages/Tracks';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'artists', element: <Artists /> },
      { path: 'tracks', element: <Tracks /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
