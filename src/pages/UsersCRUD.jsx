import { useState } from 'react';
import { Plus, Edit2, Trash2, Check, X } from 'lucide-react';
import { PageTitle, Modal, ConfirmDelete } from '../components/ui';
import { useAppStore } from '../store/useAppStore';

export default function UsersCRUD() {
  const { users, createUser, updateUser, deleteUser } = useAppStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [department, setDepartment] = useState('');
  const [isActive, setIsActive] = useState(true);

  const openCreateModal = () => {
    setEditingUser(null);
    setName('');
    setRole('');
    setDepartment('');
    setIsActive(true);
    setModalOpen(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setName(user.name);
    setRole(user.role || '');
    setDepartment(user.department || '');
    setIsActive(user.is_active);
    setModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const payload = {
      name,
      role,
      department,
      is_active: isActive
    };

    if (editingUser) {
      updateUser(editingUser.id, payload);
    } else {
      createUser(payload);
    }
    setModalOpen(false);
  };

  return (
    <>
      <PageTitle
        eyebrow="ฝ่ายบุคคล / ผู้รับผิดชอบ"
        title="จัดการรายชื่อผู้รับผิดชอบ"
        description="เพิ่ม แก้ไข หรือระงับการทำงานของพยาบาลและเจ้าหน้าที่ผู้รับผิดชอบงานในระบบบริหารโครงการ"
        action={
          <button className="btn-primary" onClick={openCreateModal}>
            <Plus size={18} />
            เพิ่มผู้รับผิดชอบใหม่
          </button>
        }
      />

      <section className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="table-head">
              <tr>
                <th className="px-4 py-3">รหัสบุคลากร</th>
                <th className="px-4 py-3">ชื่อ-นามสกุล</th>
                <th className="px-4 py-3">ตำแหน่ง / บทบาท</th>
                <th className="px-4 py-3">แผนก / กลุ่มงาน</th>
                <th className="px-4 py-3 text-center">สถานะการทำงาน</th>
                <th className="px-4 py-3 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50">
                  <td className="table-cell font-mono text-xs font-bold text-slate-500">{user.id}</td>
                  <td className="table-cell font-semibold text-hospital-navy">{user.name}</td>
                  <td className="table-cell text-slate-600">{user.role || '-'}</td>
                  <td className="table-cell text-slate-600">{user.department || '-'}</td>
                  <td className="table-cell text-center">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
                      user.is_active
                        ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'
                        : 'bg-slate-100 text-slate-500 ring-1 ring-slate-200'
                    }`}>
                      {user.is_active ? <Check size={12} /> : <X size={12} />}
                      {user.is_active ? 'ปฏิบัติงานอยู่' : 'ระงับการใช้งาน'}
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="flex justify-center gap-2">
                      <button
                        className="btn-secondary p-2"
                        type="button"
                        onClick={() => openEditModal(user)}
                        title="แก้ไข"
                      >
                        <Edit2 size={16} />
                      </button>
                      <ConfirmDelete onConfirm={() => deleteUser(user.id)}>
                        <Trash2 size={16} />
                      </ConfirmDelete>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-400">
                    ไม่พบข้อมูลผู้รับผิดชอบในระบบ
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
        title={editingUser ? 'แก้ไขข้อมูลบุคลากร' : 'เพิ่มผู้รับผิดชอบใหม่'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-hospital-navy" htmlFor="user-name">
              ชื่อ-นามสกุล <span className="text-red-500">*</span>
            </label>
            <input
              id="user-name"
              type="text"
              className="field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="ระบุชื่อและนามสกุล..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-hospital-navy" htmlFor="user-role">
                ตำแหน่ง / บทบาทหน้าที่
              </label>
              <input
                id="user-role"
                type="text"
                className="field"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="เช่น พยาบาลวิชาชีพ..."
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-hospital-navy" htmlFor="user-dept">
                แผนก / กลุ่มงาน
              </label>
              <input
                id="user-dept"
                type="text"
                className="field"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="เช่น ผู้ป่วยนอก, ผู้ป่วยใน..."
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-3 rounded-xl border border-hospital-line bg-white px-4 py-3 font-prompt text-sm font-semibold text-hospital-navy cursor-pointer">
              <input
                type="checkbox"
                className="h-4 w-4 accent-hospital-teal"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              บุคลากรปฏิบัติงานอยู่ในปัจจุบัน (Active)
            </label>
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
