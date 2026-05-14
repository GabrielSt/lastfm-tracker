import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import Artists from '@/pages/Artists';
import Tracks from '@/pages/Tracks';
import Reports from '@/pages/Reports';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'artists', element: <Artists /> },
      { path: 'tracks', element: <Tracks /> },
      { path: 'reports', element: <Reports /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
