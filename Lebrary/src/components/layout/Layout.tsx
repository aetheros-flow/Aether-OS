import { Outlet, ScrollRestoration } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export function Layout() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <AmbientBackdrop />
      <Navbar />
      <main className="relative mx-auto max-w-7xl px-6 pb-24 pt-10 lg:px-10">
        <Outlet />
      </main>
      <Footer />
      <ScrollRestoration />
    </div>
  );
}

function AmbientBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -top-40 right-[-10%] h-[520px] w-[520px] rounded-full bg-lumen-400/20 blur-3xl dark:bg-lumen-500/10" />
      <div className="absolute -bottom-40 left-[-10%] h-[420px] w-[420px] rounded-full bg-lumen-600/10 blur-3xl dark:bg-lumen-400/5" />
    </div>
  );
}
