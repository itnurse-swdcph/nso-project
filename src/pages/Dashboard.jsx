import { useMemo, useState } from 'react';
import { CheckCircle2, ClipboardList, FolderKanban } from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { MetricCard, PageTitle, ProgressBar, StatusBadge } from '../components/ui';
import { useAppStore } from '../store/useAppStore';
import { dateThai, projectTaskSummary } from '../utils/status';

const chartColors = {
  'ช้ากว่ากำหนด': '#DC2626',
  'อยู่ในกำหนด': '#F59E0B',
  'ยังไม่เริ่มงาน': '#94A3B8',
  'เสร็จสิ้น': '#10B981'
};

export default function Dashboard() {
  const { projects, tasks, users } = useAppStore();
  const [projectFilter, setProjectFilter] = useState('ALL');
  const [excludeDone, setExcludeDone] = useState(false);

  const activeProjects = useMemo(() => {
    return projects.filter((project) => {
      if (projectFilter !== 'ALL' && project.id !== projectFilter) return false;
      if (excludeDone && project.status === 'เสร็จสิ้น') return false;
      return true;
    });
  }, [projects, projectFilter, excludeDone]);

  const activeProjectIds = activeProjects.map((project) => project.id);
  const visibleTasks = tasks.filter((task) => activeProjectIds.includes(task.project_id));
  const doneTasks = visibleTasks.filter((task) => task.status === 'เสร็จสิ้น').length;
  const doneRatio = visibleTasks.length ? Math.round((doneTasks / visibleTasks.length) * 100) : 0;

  const chartData = ['ช้ากว่ากำหนด', 'อยู่ในกำหนด', 'ยังไม่เริ่มงาน', 'เสร็จสิ้น']
    .map((status) => ({ name: status, value: visibleTasks.filter((task) => task.status === status).length }))
    .filter((item) => item.value > 0);

  const projectName = (id) => projects.find((project) => project.id === id)?.project_name || '-';
  const userName = (id) => users.find((user) => user.id === id)?.name || '-';

  return (
    <>
      <PageTitle
        eyebrow="Dashboard"
        title="สรุปข้อมูลภาพรวมโครงการ"
        description="ตัวกรองและข้อมูลทุกส่วนในหน้านี้ reactive ตามโครงการที่เลือกและสถานะโครงการเสร็จสิ้น"
      />

      <section className="panel mb-5 p-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <label className="mb-2 block text-sm font-semibold text-hospital-navy" htmlFor="project-filter">เลือกโครงการ</label>
            <select id="project-filter" className="field" value={projectFilter} onChange={(event) => setProjectFilter(event.target.value)}>
              <option value="ALL">ALL</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>{project.project_name}</option>
              ))}
            </select>
          </div>
          <label className="flex h-11 items-center gap-3 rounded-xl border border-hospital-line bg-white px-4 font-prompt text-sm font-semibold text-hospital-navy">
            <input className="h-4 w-4 accent-hospital-teal" type="checkbox" checked={excludeDone} onChange={(event) => setExcludeDone(event.target.checked)} />
            ยกเว้นโครงการเสร็จแล้ว
          </label>
        </div>
      </section>

      <section className="mb-5 grid gap-4 md:grid-cols-3">
        <MetricCard icon={ClipboardList} label="จำนวนงานทั้งหมด" value={visibleTasks.length} helper={`จาก ${activeProjects.length} โครงการ`} />
        <MetricCard icon={CheckCircle2} label="งานที่เสร็จแล้ว" value={doneTasks} helper={`คิดเป็น ${doneRatio}% ของงานทั้งหมด`} tone="teal" />
        <MetricCard icon={FolderKanban} label="โครงการที่แสดง" value={activeProjects.length} helper="ตาม filter ปัจจุบัน" />
      </section>

      <section className="mb-5 grid gap-5 xl:grid-cols-[420px_1fr]">
        <div className="panel p-5">
          <h2 className="font-prompt text-lg font-bold text-hospital-navy">สถานะโปรเจค</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={62} outerRadius={98} paddingAngle={3}>
                  {chartData.map((entry) => <Cell key={entry.name} fill={chartColors[entry.name]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid gap-2">
            {Object.keys(chartColors).map((status) => (
              <div key={status} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
                <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ backgroundColor: chartColors[status] }} />{status}</span>
                <span className="font-semibold">{visibleTasks.filter((task) => task.status === status).length}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel p-5">
          <h2 className="font-prompt text-lg font-bold text-hospital-navy">Progress งานที่เสร็จ / งานรวม</h2>
          <div className="mt-5">
            <ProgressBar value={doneRatio} showLabel />
          </div>
          <p className="mt-3 text-sm text-slate-500">คำนวณจากจำนวน task ที่มีสถานะเสร็จสิ้นเทียบกับ task ทั้งหมดใน filter ปัจจุบัน</p>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead className="table-head">
                <tr>
                  <th className="px-4 py-3">โครงการ</th>
                  <th className="px-4 py-3">สถานะ</th>
                  <th className="px-4 py-3">งาน</th>
                  <th className="px-4 py-3">ความคืบหน้า</th>
                </tr>
              </thead>
              <tbody>
                {activeProjects.map((project) => {
                  const summary = projectTaskSummary(project.id, tasks);
                  return (
                    <tr key={project.id}>
                      <td className="table-cell font-semibold text-hospital-navy">{project.project_name}</td>
                      <td className="table-cell"><StatusBadge status={project.status} /></td>
                      <td className="table-cell">{summary.done}/{summary.total}</td>
                      <td className="table-cell"><ProgressBar value={summary.progress} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="panel p-5">
        <h2 className="font-prompt text-lg font-bold text-hospital-navy">รายการงานย่อย</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead className="table-head">
              <tr>
                <th className="px-4 py-3">ชื่อโปรเจกต์</th>
                <th className="px-4 py-3">งานที่ต้องทำ</th>
                <th className="px-4 py-3">ความคืบหน้า</th>
                <th className="px-4 py-3">ผู้รับผิดชอบ</th>
                <th className="px-4 py-3">วันที่เริ่ม</th>
                <th className="px-4 py-3">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {visibleTasks.map((task) => (
                <tr key={task.id}>
                  <td className="table-cell">{projectName(task.project_id)}</td>
                  <td className="table-cell font-semibold text-hospital-navy">{task.task_name}</td>
                  <td className="table-cell"><ProgressBar value={task.progress_percentage} /></td>
                  <td className="table-cell">{userName(task.assignee_id)}</td>
                  <td className="table-cell">{dateThai(task.start_date)}</td>
                  <td className="table-cell"><StatusBadge status={task.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
