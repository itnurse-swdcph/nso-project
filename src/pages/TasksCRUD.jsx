import { useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { PageTitle, Modal, StatusBadge, ProgressBar, ConfirmDelete } from '../components/ui';
import { useAppStore } from '../store/useAppStore';
import { dateThai } from '../utils/status';

export default function TasksCRUD() {
  const { tasks, projects, users, createTask, updateTask, deleteTask } = useAppStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // Form states
  const [projectId, setProjectId] = useState('');
  const [taskName, setTaskName] = useState('');
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [assigneeId, setAssigneeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');

  const openCreateModal = () => {
    setEditingTask(null);
    setProjectId(projects[0]?.id || '');
    setTaskName('');
    setProgressPercentage(0);
    setAssigneeId(users[0]?.id || '');
    setStartDate(new Date().toISOString().slice(0, 10));
    setDueDate(new Date().toISOString().slice(0, 10));
    setModalOpen(true);
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setProjectId(task.project_id);
    setTaskName(task.task_name);
    setProgressPercentage(task.progress_percentage);
    setAssigneeId(task.assignee_id);
    setStartDate(task.start_date || '');
    setDueDate(task.due_date || '');
    setModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!taskName.trim() || !projectId || !assigneeId) return;

    const payload = {
      project_id: projectId,
      task_name: taskName,
      progress_percentage: Number(progressPercentage),
      assignee_id: assigneeId,
      start_date: startDate,
      due_date: dueDate
    };

    if (editingTask) {
      updateTask(editingTask.id, payload);
    } else {
      createTask(payload);
    }
    setModalOpen(false);
  };

  const getProjectName = (id) => projects.find((p) => p.id === id)?.project_name || '-';
  const getUserName = (id) => users.find((u) => u.id === id)?.name || '-';

  return (
    <>
      <PageTitle
        eyebrow="การจัดการงานโครงการ"
        title="จัดการงานย่อย (Tasks)"
        description="เพิ่ม แก้ไข หรือลบงานย่อยในโครงการต่างๆ เลือกโครงการผู้รับผิดชอบ และความคืบหน้าของแต่ละกิจกรรม"
        action={
          <button className="btn-primary" onClick={openCreateModal} disabled={projects.length === 0 || users.length === 0}>
            <Plus size={18} />
            เพิ่มงานย่อย
          </button>
        }
      />

      {(projects.length === 0 || users.length === 0) && (
        <div className="mb-5 rounded-2xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
          <strong>โปรดทราบ:</strong> คุณจำเป็นต้องมีอย่างน้อย 1 โครงการ (ในหน้าโครงการ) และ 1 ผู้รับผิดชอบ (ในหน้าผู้รับผิดชอบ) เพื่อสร้างงานย่อยใหม่
        </div>
      )}

      <section className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="table-head">
              <tr>
                <th className="px-4 py-3">รหัสงาน</th>
                <th className="px-4 py-3">ชื่อโครงการ</th>
                <th className="px-4 py-3">งานย่อย</th>
                <th className="px-4 py-3">ผู้รับผิดชอบ</th>
                <th className="px-4 py-3 text-center">เริ่ม/สิ้นสุด</th>
                <th className="px-4 py-3">ความก้าวหน้า</th>
                <th className="px-4 py-3">สถานะ</th>
                <th className="px-4 py-3 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id} className="hover:bg-slate-50">
                  <td className="table-cell font-mono text-xs font-bold text-slate-500">{task.id}</td>
                  <td className="table-cell text-sm text-slate-600 max-w-[180px] truncate">{getProjectName(task.project_id)}</td>
                  <td className="table-cell font-semibold text-hospital-navy">{task.task_name}</td>
                  <td className="table-cell text-sm text-slate-700">{getUserName(task.assignee_id)}</td>
                  <td className="table-cell text-xs text-slate-500 text-center">
                    <div>{dateThai(task.start_date)}</div>
                    <div>ถึง {dateThai(task.due_date)}</div>
                  </td>
                  <td className="table-cell">
                    <ProgressBar value={task.progress_percentage} />
                  </td>
                  <td className="table-cell">
                    <StatusBadge status={task.status} />
                  </td>
                  <td className="table-cell">
                    <div className="flex justify-center gap-2">
                      <button
                        className="btn-secondary p-2"
                        type="button"
                        onClick={() => openEditModal(task)}
                        title="แก้ไข"
                      >
                        <Edit2 size={16} />
                      </button>
                      <ConfirmDelete onConfirm={() => deleteTask(task.id)}>
                        <Trash2 size={16} />
                      </ConfirmDelete>
                    </div>
                  </td>
                </tr>
              ))}
              {tasks.length === 0 && (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-slate-400">
                    ไม่พบข้อมูลงานย่อยในระบบ
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingTask ? 'แก้ไขงานย่อย' : 'เพิ่มงานย่อยใหม่'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-hospital-navy" htmlFor="task-project">
                เชื่อมโยงโครงการหลัก <span className="text-red-500">*</span>
              </label>
              <select
                id="task-project"
                className="field"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                required
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.project_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-hospital-navy" htmlFor="task-assignee">
                ผู้รับผิดชอบงาน <span className="text-red-500">*</span>
              </label>
              <select
                id="task-assignee"
                className="field"
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                required
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-hospital-navy" htmlFor="task-name">
              ชื่อกิจกรรม / งานย่อยที่ปฏิบัติ <span className="text-red-500">*</span>
            </label>
            <input
              id="task-name"
              type="text"
              className="field"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              required
              placeholder="ระบุชื่อกิจกรรมงานที่ปฏิบัติ..."
            />
          </div>

          <div>
            <label className="mb-2 flex items-center justify-between text-sm font-semibold text-hospital-navy" htmlFor="task-progress">
              <span>ความก้าวหน้ารวม (%)</span>
              <span className="font-bold text-hospital-teal">{progressPercentage}%</span>
            </label>
            <div className="flex items-center gap-4">
              <input
                id="task-progress"
                type="range"
                min="0"
                max="100"
                className="w-full accent-hospital-teal"
                value={progressPercentage}
                onChange={(e) => setProgressPercentage(Number(e.target.value))}
              />
              <input
                type="number"
                min="0"
                max="100"
                className="field w-20 text-center"
                value={progressPercentage}
                onChange={(e) => setProgressPercentage(Math.min(100, Math.max(0, Number(e.target.value))))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-hospital-navy" htmlFor="task-start">
                วันที่เริ่มกิจกรรม
              </label>
              <input
                id="task-start"
                type="date"
                className="field"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-hospital-navy" htmlFor="task-due">
                กำหนดเสร็จสิ้น (Due Date)
              </label>
              <input
                id="task-due"
                type="date"
                className="field"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button className="btn-secondary" type="button" onClick={() => setModalOpen(false)}>
              ยกเลิก
            </button>
            <button className="btn-primary" type="submit">
              บันทึกงานย่อย
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
