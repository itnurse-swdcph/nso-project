import { useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { PageTitle, Modal, StatusBadge, ProgressBar, ConfirmDelete } from '../components/ui';
import { useAppStore } from '../store/useAppStore';
import { projectProgress, dateThai } from '../utils/status';

export default function ProjectsCRUD() {
  const { projects, tasks, createProject, updateProject, deleteProject } = useAppStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  
  // Form State
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('ดำเนินการ');
  const [createdAt, setCreatedAt] = useState(new Date().toISOString().slice(0, 10));

  const openCreateModal = () => {
    setEditingProject(null);
    setProjectName('');
    setDescription('');
    setStatus('ดำเนินการ');
    setCreatedAt(new Date().toISOString().slice(0, 10));
    setModalOpen(true);
  };

  const openEditModal = (project) => {
    setEditingProject(project);
    setProjectName(project.project_name);
    setDescription(project.description || '');
    setStatus(project.status);
    setCreatedAt(project.created_at || new Date().toISOString().slice(0, 10));
    setModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!projectName.trim()) return;

    const payload = {
      project_name: projectName,
      description,
      status,
      created_at: createdAt
    };

    if (editingProject) {
      updateProject(editingProject.id, payload);
    } else {
      createProject(payload);
    }
    setModalOpen(false);
  };

  return (
    <>
      <PageTitle
        eyebrow="การจัดการข้อมูล"
        title="จัดการโครงการหลัก"
        description="เพิ่ม แก้ไข หรือลบข้อมูลโครงการพยาบาล โดยระดับความคืบหน้าจะคำนวณจากค่าย่อยของแต่ละงานในโครงการโดยอัตโนมัติ"
        action={
          <button className="btn-primary" onClick={openCreateModal}>
            <Plus size={18} />
            เพิ่มโครงการใหม่
          </button>
        }
      />

      <section className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="table-head">
              <tr>
                <th className="px-4 py-3">รหัสโครงการ</th>
                <th className="px-4 py-3">ชื่อโครงการ</th>
                <th className="px-4 py-3">คำอธิบาย</th>
                <th className="px-4 py-3">ความคืบหน้ารวม</th>
                <th className="px-4 py-3">วันที่เริ่มโครงการ</th>
                <th className="px-4 py-3">สถานะ</th>
                <th className="px-4 py-3 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => {
                const progress = projectProgress(project.id, tasks);
                return (
                  <tr key={project.id} className="hover:bg-slate-50">
                    <td className="table-cell font-mono text-xs font-bold text-slate-500">{project.id}</td>
                    <td className="table-cell font-semibold text-hospital-navy">{project.project_name}</td>
                    <td className="table-cell text-slate-500 max-w-[250px] truncate">{project.description || '-'}</td>
                    <td className="table-cell">
                      <ProgressBar value={progress} />
                    </td>
                    <td className="table-cell text-slate-600">{dateThai(project.created_at)}</td>
                    <td className="table-cell">
                      <StatusBadge status={project.status} />
                    </td>
                    <td className="table-cell">
                      <div className="flex justify-center gap-2">
                        <button
                          className="btn-secondary p-2"
                          type="button"
                          onClick={() => openEditModal(project)}
                          title="แก้ไข"
                        >
                          <Edit2 size={16} />
                        </button>
                        <ConfirmDelete onConfirm={() => deleteProject(project.id)}>
                          <Trash2 size={16} />
                        </ConfirmDelete>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {projects.length === 0 && (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-400">
                    ไม่พบข้อมูลโครงการในระบบ
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
        title={editingProject ? 'แก้ไขข้อมูลโครงการ' : 'เพิ่มโครงการใหม่'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-hospital-navy" htmlFor="project-name">
              ชื่อโครงการ <span className="text-red-500">*</span>
            </label>
            <input
              id="project-name"
              type="text"
              className="field"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              required
              placeholder="ระบุชื่อโครงการพัฒนาพยาบาล..."
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-hospital-navy" htmlFor="project-desc">
              คำอธิบายรายละเอียด
            </label>
            <textarea
              id="project-desc"
              className="textarea-field"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="คำอธิบายสั้นๆ ของโครงการ..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-hospital-navy" htmlFor="project-status">
                สถานะโครงการ
              </label>
              <select
                id="project-status"
                className="field"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="ดำเนินการ">ดำเนินการ</option>
                <option value="เสร็จสิ้น">เสร็จสิ้น</option>
                <option value="ระงับ">ระงับ</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-hospital-navy" htmlFor="project-date">
                วันที่เริ่มโครงการ
              </label>
              <input
                id="project-date"
                type="date"
                className="field"
                value={createdAt}
                onChange={(e) => setCreatedAt(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button className="btn-secondary" type="button" onClick={() => setModalOpen(false)}>
              ยกเลิก
            </button>
            <button className="btn-primary" type="submit">
              บันทึกข้อมูล
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
