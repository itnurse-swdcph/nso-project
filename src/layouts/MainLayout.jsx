import { NavLink, Outlet } from 'react-router-dom';
import {
  Bell,
  CalendarDays,
  ClipboardList,
  Gauge,
  Home,
  ListTodo,
  Menu,
  Users,
  FolderKanban
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { to: '/', label: 'Main Menu', icon: Home },
  { to: '/dashboard', label: 'Dashboard โครงการ', icon: Gauge },
  { to: '/upcoming', label: 'Up-coming Task', icon: Bell },
  { to: '/calendar', label: 'ปฏิทินงาน', icon: CalendarDays },
  { to: '/projects', label: 'โครงการ', icon: FolderKanban },
  { to: '/tasks', label: 'งานโครงการ', icon: ListTodo },
  { to: '/users', label: 'ผู้รับผิดชอบ', icon: Users }
];

export default function MainLayout() {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[290px_1fr]">
      <aside className={`${open ? 'block' : 'hidden'} fixed inset-y-0 left-0 z-40 w-72 border-r border-hospital-line bg-white shadow-panel lg:sticky lg:block lg:h-screen lg:w-auto lg:shadow-none`}>
        <div className="flex h-full flex-col">
          <div className="border-b border-hospital-line px-5 py-5">
            <div className="flex items-center gap-3">
              <img className="h-14 w-14 rounded-2xl border border-hospital-line bg-white object-contain p-1" src="./nurse-logo.png" alt="Nursing logo" />
              <div className="min-w-0">
                <p className="font-prompt text-base font-bold leading-tight text-hospital-navy">Nursing Project</p>
                <p className="font-prompt text-sm font-semibold text-hospital-teal">Management 2026</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  [
                    'flex items-center gap-3 rounded-2xl px-4 py-3 font-prompt text-sm font-semibold transition',
                    isActive
                      ? 'bg-hospital-blue text-white shadow-lg shadow-blue-100'
                      : 'text-slate-600 hover:bg-hospital-mist hover:text-hospital-navy'
                  ].join(' ')
                }
              >
                <item.icon size={20} />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="border-t border-hospital-line p-4">
            <div className="rounded-2xl bg-hospital-mist p-4">
              <div className="flex items-center gap-2 font-prompt text-sm font-bold text-hospital-navy">
                <ClipboardList size={18} />
                Google Sheets Migration
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500">โครงสร้างข้อมูลจำลอง 7 แท็บพร้อมเชื่อมต่อ API จริงในขั้นต่อไป</p>
            </div>
          </div>
        </div>
      </aside>

      {open ? <button className="fixed inset-0 z-30 bg-slate-900/30 lg:hidden" type="button" onClick={() => setOpen(false)} aria-label="ปิดเมนู" /> : null}

      <div className="min-w-0">
        <header className="sticky top-0 z-20 border-b border-hospital-line bg-white/90 backdrop-blur">
          <div className="flex min-h-20 items-center justify-between gap-4 px-4 py-3 lg:px-8">
            <div className="flex items-center gap-3">
              <button className="btn-secondary px-3 lg:hidden" type="button" onClick={() => setOpen(true)} aria-label="เปิดเมนู">
                <Menu size={20} />
              </button>
              <img className="hidden h-12 w-12 rounded-2xl border border-hospital-line bg-white object-contain p-1 sm:block lg:hidden" src="./nurse-logo.png" alt="Nursing logo" />
              <div>
                <p className="font-prompt text-lg font-bold text-hospital-navy md:text-xl">บริหารโครงการ ภารกิจด้านการพยาบาล</p>
                <p className="text-sm text-slate-500">โรงพยาบาลสมเด็จพระยุพราชสว่างแดนดิน · 2026</p>
              </div>
            </div>
            <div className="hidden rounded-full border border-hospital-line bg-hospital-mist px-4 py-2 font-prompt text-sm font-semibold text-hospital-navy md:block">
              Enterprise Web App
            </div>
          </div>
        </header>

        <main className="px-4 py-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
