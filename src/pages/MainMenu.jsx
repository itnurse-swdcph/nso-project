import { Link } from 'react-router-dom';
import { Bell, CalendarDays, FolderKanban, Gauge, ListTodo, Users } from 'lucide-react';
import { EmptyState, PageTitle, StatusBadge } from '../components/ui';
import { useAppStore } from '../store/useAppStore';
import { dateThai, daysBetween, todayStart, urgencyTone } from '../utils/status';

const quickLinks = [
  { to: '/dashboard', title: 'Dashboard โครงการ', desc: 'ดูภาพรวมและกราฟสถานะ', icon: Gauge },
  { to: '/upcoming', title: 'Up-coming Task', desc: 'งานใกล้ถึงกำหนด', icon: Bell },
  { to: '/calendar', title: 'ปฏิทินงาน', desc: 'แผนงานรายเดือน/รายสัปดาห์', icon: CalendarDays },
  { to: '/projects', title: 'โครงการ', desc: 'จัดการข้อมูลโครงการ', icon: FolderKanban },
  { to: '/tasks', title: 'งานโครงการ', desc: 'จัดการ task และ progress', icon: ListTodo },
  { to: '/users', title: 'ผู้รับผิดชอบ', desc: 'รายชื่อบุคลากร', icon: Users }
];

export default function MainMenu() {
  const { projects, tasks, users } = useAppStore();
  const alerts = tasks
    .filter((task) => task.status !== 'เสร็จสิ้น')
    .filter((task) => daysBetween(todayStart(), task.due_date) <= 14)
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
    .slice(0, 6);

  const projectName = (id) => projects.find((project) => project.id === id)?.project_name || '-';
  const userName = (id) => users.find((user) => user.id === id)?.name || '-';

  return (
    <>
      <PageTitle
        eyebrow="Main Menu"
        title="ระบบบริหารโครงการ ภารกิจด้านการพยาบาล 2026"
        description="ศูนย์รวมการติดตามโครงการ งานย่อย ปฏิทินกำหนดส่ง และข้อมูลผู้รับผิดชอบจากโครงสร้าง Google Sheets เดิม"
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {quickLinks.map((link) => (
          <Link key={link.to} to={link.to} className="panel group p-5 transition hover:-translate-y-0.5 hover:border-hospital-teal">
            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-hospital-mist text-hospital-blue group-hover:bg-teal-50 group-hover:text-hospital-teal">
                <link.icon size={24} />
              </div>
              <div>
                <h2 className="font-prompt text-lg font-bold text-hospital-navy">{link.title}</h2>
                <p className="mt-1 text-sm text-slate-500">{link.desc}</p>
              </div>
            </div>
          </Link>
        ))}
      </section>

      <section className="panel mt-6 p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-prompt text-xl font-bold text-hospital-navy">แจ้งเตือนด่วน</h2>
            <p className="text-sm text-slate-500">งานที่เลยกำหนดหรือกำลังจะถึงกำหนดภายใน 14 วัน</p>
          </div>
          <StatusBadge status={`${alerts.length} รายการ`} tone="blue" />
        </div>

        {alerts.length === 0 ? (
          <EmptyState title="ไม่มีแจ้งเตือนด่วน" description="ยังไม่มีงานที่ใกล้ถึงกำหนดในช่วงนี้" />
        ) : (
          <div className="grid gap-3">
            {alerts.map((task) => (
              <div key={task.id} className="rounded-2xl border border-hospital-line bg-slate-50 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-prompt font-bold text-hospital-navy">{task.task_name}</p>
                    <p className="mt-1 text-sm text-slate-500">{projectName(task.project_id)} · {userName(task.assignee_id)}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={task.status} />
                    <StatusBadge status={`กำหนด ${dateThai(task.due_date)}`} tone={urgencyTone(task)} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
