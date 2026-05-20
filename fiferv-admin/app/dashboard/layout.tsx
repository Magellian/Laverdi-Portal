'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase';
import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = getSupabaseClient();
      if (!supabase) {
        router.push('/');
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/');
        return;
      }

      setUser(session.user);
      setLoading(false);
    };

    checkAuth();

    const supabase = getSupabaseClient();
    if (supabase) {
      const { data: listener } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
        if (!session) {
          router.push('/');
        } else {
          setUser(session.user);
        }
      });

      return () => {
        listener?.subscription.unsubscribe();
      };
    }
  }, [router]);

  const handleLogout = async () => {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    router.push('/');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  const navItems = [
    { href: '/dashboard', label: 'Overview', icon: '📊' },
    { href: '/dashboard/ai-control', label: 'AI Control', icon: '🤖' },
    { href: '/dashboard/leads', label: 'Leads', icon: '📞' },
    { href: '/dashboard/schedule', label: 'Schedule', icon: '⏰' },
    { href: '/dashboard/analytics', label: 'Analytics', icon: '📈' },
    { href: '/dashboard/settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">FR</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900">Fife RV Admin</h1>
            </div>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-slate-100 rounded-lg"
            >
              ☰
            </button>
            <button
              onClick={handleLogout}
              className="hidden md:inline px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-col md:flex-row">
        {/* Sidebar */}
        <aside className={`${mobileMenuOpen ? 'block' : 'hidden'} md:block md:w-64 bg-white border-r border-slate-200`}>
          <nav className="p-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block px-4 py-3 rounded-lg hover:bg-blue-50 text-slate-700 hover:text-blue-600 transition"
              >
                <span className="text-lg mr-2">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="absolute bottom-4 left-4 right-4 md:static md:mt-auto p-4 border-t border-slate-200">
            <button
              onClick={handleLogout}
              className="md:hidden w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Logout
            </button>
            <p className="text-xs text-slate-500 mt-2">
              User: {user?.email}
            </p>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
