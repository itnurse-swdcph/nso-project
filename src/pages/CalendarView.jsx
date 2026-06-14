import { useState, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { PageTitle, Modal, StatusBadge, ProgressBar } from '../components/ui';
import { useAppStore } from '../store/useAppStore';
import { dateThai, statusTone } from '../utils/status';

export default function CalendarView() {
  const { tasks, projects, users } = useAppStore();
  const [selectedTask, setSelectedTask] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const events = useMemo(() => {
    return tasks.map((task) => {
      // Map task status to a color tone
      let color = '#94A3B8'; // Slate for yet to start
      if (task.status === 'เสร็จสิ้น') color = '#10B981'; // Emerald
      else if (task.status === 'ช้ากว่ากำหนด') color = '#DC2626'; // Red
      else if (task.status === 'อยู่ในกำหนด') color = '#F59E0B'; // Amber

      return {
        id: task.id,
        title: task.task_name,
        // FullCalendar expects events to have start and end dates.
        // If start_date equals due_date or isn't set, fallback to due_date
        start: task.start_date || task.due_date,
        // Add one day to due_date so FullCalendar includes the end day visually in the month span
        end: task.due_date ? (() => {
          const d = new Date(task.due_date);
          d.setDate(d.getDate() + 1);
          return d.toISOString().slice(0, 10);
        })() : undefined,
        allDay: true,
        backgroundColor: color,
        borderColor: color,
        textColor: '#FFFFFF',
        extendedProps: {
          taskId: task.id
        }
      };
    });
  }, [tasks]);

  const handleEventClick = (info) => {
    const taskId = info.event.extendedProps.taskId;
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      setSelectedTask(task);
      setModalOpen(true);
    }
  };

  const project = selectedTask ? projects.find((p) => p.id === selectedTask.project_id) : null;
  const user = selectedTask ? users.find((u) => u.id === selectedTask.assignee_id) : null;

  return (
    <>
      <PageTitle
        eyebrow="Calendar View"
        title="ปฏิทินงานโครงการ"
        description="แสดงผลแผนงานและกำหนดส่งทั้งหมดในรูปแบบปฏิทิน คลิกที่งานเพื่อดูรายละเอียดเชิงลึก"
      />

      <section className="panel p-5 bg-white">
        <div className="calendar-container">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            events={events}
            eventClick={handleEventClick}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek'
            }}
            locale="th"
            buttonText={{
              today: 'วันนี้',
              month: 'เดือน',
              week: 'สัปดาห์'
            }}
            height="auto"
          />
        </div>
      </section>

      {selectedTask && (
        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title={`รายละเอียดงาน: ${selectedTask.task_name}`}
          footer={
            <button className="btn-secondary" type="button" onClick={() => setModalOpen(false)}>
              ปิดหน้าต่าง
            </button>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-slate-400">โครงการ</p>
                <p className="font-prompt font-bold text-hospital-navy mt-1">
                  {project ? project.project_name : 'ไม่พบโครงการ'}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400">ผู้รับผิดชอบ</p>
                <p className="font-prompt font-bold text-hospital-navy mt-1">
                  {user ? `${user.name} (${user.role})` : 'ไม่พบผู้รับผิดชอบ'}
                </p>
              </div>
            </div>

            <hr className="border-slate-100" />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-slate-400">วันที่เริ่มต้น</p>
                <p className="font-semibold text-slate-700 mt-1">{dateThai(selectedTask.start_date)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400">กำหนดส่ง</p>
                <p className="font-semibold text-slate-700 mt-1">{dateThai(selectedTask.due_date)}</p>
              </div>
            </div>

            <hr className="border-slate-100" />

            <div className="grid grid-cols-2 gap-4 items-center">
              <div>
                <p className="text-xs font-semibold text-slate-400 mb-1">สถานะงาน</p>
                <StatusBadge status={selectedTask.status} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 mb-1">ความคืบหน้า</p>
                <ProgressBar value={selectedTask.progress_percentage} />
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
