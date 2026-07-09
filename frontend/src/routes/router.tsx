import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { PublicLayout } from '@/layouts/PublicLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { PageFallback } from '@/components/PageFallback';

// El shell de la app (Sidebar/Topbar + el registro de iconos de lucide) también
// se carga on-demand: así el landing público no arrastra nada de /app.
const AppLayout = lazy(() => import('@/layouts/AppLayout').then((m) => ({ default: m.AppLayout })));

// Code-splitting por ruta: cada página se carga on-demand en su propio chunk.
// Las páginas exponen exports nombrados, así que los mapeamos al `default`
// que espera React.lazy.
const Landing = lazy(() => import('@/pages/public/Landing').then((m) => ({ default: m.Landing })));
const Register = lazy(() => import('@/pages/public/Register').then((m) => ({ default: m.Register })));
const Login = lazy(() => import('@/pages/public/Login').then((m) => ({ default: m.Login })));
const ForgotPassword = lazy(() =>
  import('@/pages/public/ForgotPassword').then((m) => ({ default: m.ForgotPassword })),
);
const ResetPassword = lazy(() =>
  import('@/pages/public/ResetPassword').then((m) => ({ default: m.ResetPassword })),
);
const Terminos = lazy(() => import('@/pages/public/Legal').then((m) => ({ default: m.Terminos })));
const Privacidad = lazy(() => import('@/pages/public/Legal').then((m) => ({ default: m.Privacidad })));
const Dashboard = lazy(() => import('@/pages/app/Dashboard').then((m) => ({ default: m.Dashboard })));
const Movimientos = lazy(() => import('@/pages/app/Movimientos').then((m) => ({ default: m.Movimientos })));
const Categorias = lazy(() => import('@/pages/app/Categorias').then((m) => ({ default: m.Categorias })));
const Pareja = lazy(() => import('@/pages/app/Pareja').then((m) => ({ default: m.Pareja })));
const Deudas = lazy(() => import('@/pages/app/Deudas').then((m) => ({ default: m.Deudas })));
const Patrimonio = lazy(() => import('@/pages/app/Patrimonio').then((m) => ({ default: m.Patrimonio })));
const Recordatorios = lazy(() =>
  import('@/pages/app/Recordatorios').then((m) => ({ default: m.Recordatorios })),
);
const Reporte = lazy(() => import('@/pages/app/Reporte').then((m) => ({ default: m.Reporte })));
const Cuenta = lazy(() => import('@/pages/app/Cuenta').then((m) => ({ default: m.Cuenta })));

// Límite de Suspense reutilizable: muestra un fallback ligero mientras se
// descarga el chunk de la ruta. Va DENTRO de los layouts (y por tanto de los
// providers), de modo que los contextos y guards siguen intactos.
function SuspenseOutlet() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Outlet />
    </Suspense>
  );
}

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      {
        element: <SuspenseOutlet />,
        children: [
          { path: '/', element: <Landing /> },
          { path: 'terminos', element: <Terminos /> },
          { path: 'privacidad', element: <Privacidad /> },
        ],
      },
    ],
  },
  {
    element: <SuspenseOutlet />,
    children: [
      { path: '/register', element: <Register /> },
      { path: '/login', element: <Login /> },
      { path: '/forgot-password', element: <ForgotPassword /> },
      { path: '/reset-password', element: <ResetPassword /> },
    ],
  },
  {
    path: '/app',
    element: <ProtectedRoute />,
    children: [
      {
        // Suspense externo: atrapa la carga lazy del propio AppLayout.
        element: <SuspenseOutlet />,
        children: [
          {
            element: <AppLayout />,
            children: [
              {
                // Suspense interno: atrapa la carga de cada página manteniendo
                // visible el shell (Sidebar/Topbar) entre navegaciones.
                element: <SuspenseOutlet />,
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
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
