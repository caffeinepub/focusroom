import { RouterProvider, createRouter, createRootRoute, createRoute, Outlet, redirect } from '@tanstack/react-router';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import AppLayout from './components/layout/AppLayout';
import LobbyPage from './pages/LobbyPage';
import RoomPage from './pages/RoomPage';
import LoginPage from './pages/LoginPage';

// Root route uses AppLayout which renders <Outlet /> internally
const rootRoute = createRootRoute({
  component: () => (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} forcedTheme="dark">
      <AppLayout />
      <Toaster theme="dark" position="bottom-right" />
    </ThemeProvider>
  ),
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
});

const lobbyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/lobby',
  component: LobbyPage,
});

const roomRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/room/$code',
  component: RoomPage,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/login' });
  },
  component: () => null,
});

const routeTree = rootRoute.addChildren([indexRoute, loginRoute, lobbyRoute, roomRoute]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
