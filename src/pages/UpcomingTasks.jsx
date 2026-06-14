import { useMemo, useState } from 'react';
import { Bell, Search, AlertCircle, CheckCircle } from 'lucide-react';
import { PageTitle, StatusBadge, EmptyState } from '../components/ui';
import { useAppStore } from '../store/useAppStore';
import { dateThai, daysBetween, todayStart, urgencyTone } from '../utils/status';

export default function UpcomingTasks() {
  const { tasks, projects, users } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');

  const upcomingList = useMemo(() => {
    const today = todayStart();
    return tasks
      .filter((task) => {
        if (task.status === 'เสร็จสิ้น') return false;
        
        const daysLeft = daysBetween(today, task.due_date);
        // Show tasks that are overdue (daysLeft < 0) or due within 14 days
        return daysLeft <= 14;
      })
      .filter((task) => {
        if (!searchQuery) return true;
        return task.task_name.toLowerCase().includes(searchQuery.toLowerCase());
      })
      .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
  }, [tasks, searchQuery]);

  const projectName = (id) => projects.find((p) => p.id === id)?.project_name || '-';
  const userName = (id) => users.find((u) => u.id === id)?.name || '-';

  return (
    <>
      <PageTitle
        eyebrow="Up-coming Task"
        title="งานที่ใกล้ถึงกำหนดส่ง"
        description="รายการงานที่เลยกำหนดส่งหรือใกล้ถึงกำหนดส่งภายใน 14 วัน จัดเรียงจากด่วนที่สุด"
      />

      <section className="panel mb-5 p-5">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search size={18} />
          </span>
          <input
            type="text"
            className="field pl-10"
            placeholder="ค้นหาชื่องาน..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </section>

      <div className="space-y-4">
        {upcomingList.length === 0 ? (
          <EmptyState title="ไม่มีงานเร่งด่วนในขณะนี้" description="ไม่พบงานที่เลยกำหนดหรือใกล้ถึงกำหนดส่งภายใน 14 วัน" />
        ) : (
          upcomingList.map((task) => {
            const daysLeft = daysBetween(todayStart(), task.due_date);
            let urgencyText = '';
            let urgencyColor = 'emerald';

            if (daysLeft < 0) {
              urgencyText = `เลยกำหนดส่ง ${Math.abs(daysLeft)} วัน`;
              urgencyColor = 'red';
            } else if (daysLeft === 0) {
              urgencyText = 'กำหนดส่งวันนี้';
              urgencyColor = 'red';
            } else if (daysLeft <= 3) {
              urgencyText = `เหลือเวลาอีก ${daysLeft} วัน (ด่วนมาก)`;
              urgencyColor = 'red';
            } else if (daysLeft <= 7) {
              urgencyText = `เหลือเวลาอีก ${daysLeft} วัน (ด่วน)`;
              urgencyColor = 'amber';
            } else {
              urgencyText = `เหลือเวลาอีก ${daysLeft} วัน`;
              urgencyColor = 'amber';
            }

            return (
              <div key={task.id} className="panel p-5 transition hover:shadow-md">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-hospital-blue bg-hospital-mist px-2.5 py-1 rounded-lg">
                        {projectName(task.project_id)}
                      </span>
                      <StatusBadge status={task.status} />
                    </div>
                    <h3 className="font-prompt text-lg font-bold text-hospital-navy">{task.task_name}</h3>
                    <p className="text-sm text-slate-500">ผู้รับผิดชอบ: <span className="font-semibold">{userName(task.assignee_id)}</span></p>
                  </div>

                  <div className="flex flex-col items-start gap-2 md:items-end">
                    <div className="text-sm text-slate-500">
                      เริ่ม: {dateThai(task.start_date)} · สิ้นสุด: <span className="font-semibold">{dateThai(task.due_date)}</span>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ring-1 ${
                      urgencyColor === 'red' ? 'bg-red-50 text-red-700 ring-red-100' : 'bg-amber-50 text-amber-700 ring-amber-100'
                    }`}>
                      <AlertCircle size={14} />
                      {urgencyText}
                    </span>
                  </div>
                </div>

                <div className="mt-4 border-t border-slate-100 pt-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-slate-500">ความก้าวหน้า:</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-hospital-teal to-hospital-blue"
                        style={{ width: `${task.progress_percentage}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-hospital-navy">{task.progress_percentage}%</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
