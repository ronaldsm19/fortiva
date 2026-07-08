import { createBrowserRouter, Navigate } from 'react-router-dom';
import { PublicLayout } from '@/layouts/PublicLayout';
import { AppLayout } from '@/layouts/AppLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { Landing } from '@/pages/public/Landing';
import { Register } from '@/pages/public/Register';
import { Login } from '@/pages/public/Login';
import { ForgotPassword } from '@/pages/public/ForgotPassword';
import { ResetPassword } from '@/pages/public/ResetPassword';
import { Terminos, Privacidad } from '@/pages/public/Legal';
import { Dashboard } from '@/pages/app/Dashboard';
import { Movimientos } from '@/pages/app/Movimientos';
import { Categorias } from '@/pages/app/Categorias';
import { Pareja } from '@/pages/app/Pareja';
import { Deudas } from '@/pages/app/Deudas';
import { Patrimonio } from '@/pages/app/Patrimonio';
import { Recordatorios } from '@/pages/app/Recordatorios';
import { Reporte } from '@/pages/app/Reporte';
import { Cuenta } from '@/pages/app/Cuenta';

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <Landing /> },
      { path: 'terminos', element: <Terminos /> },
      { path: 'privacidad', element: <Privacidad /> },
    ],
  },
  { path: '/register', element: <Register /> },
  { path: '/login', element: <Login /> },
  { path: '/forgot-password', element: <ForgotPassword /> },
  { path: '/reset-password', element: <ResetPassword /> },
  {
    path: '/app',
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
      { index: true, element: <Navigate to="/app/dashboard" replace /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'movimientos', element: <Movimientos /> },
      { path: 'categorias', element: <Categorias /> },
      { path: 'pareja', element: <Pareja /> },
      { path: 'deudas', element: <Deudas /> },
      { path: 'patrimonio', element: <Patrimonio /> },
      { path: 'recordatorios', element: <Recordatorios /> },
      { path: 'reporte', element: <Reporte /> },
      { path: 'cuenta', element: <Cuenta /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
