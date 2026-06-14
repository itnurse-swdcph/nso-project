export const seedUsers = [
  { id: 'USR-001', name: 'น.ส.ปิยะดา แก้วมณี', role: 'หัวหน้ากลุ่มงานผู้ป่วยนอก', department: 'ผู้ป่วยนอก', is_active: true },
  { id: 'USR-002', name: 'นางสายฝน รัตนวงศ์', role: 'พยาบาลวิชาชีพชำนาญการ', department: 'ผู้ป่วยใน', is_active: true },
  { id: 'USR-003', name: 'น.ส.ณัฐพร ธรรมรักษ์', role: 'พยาบาลควบคุมคุณภาพ', department: 'บริหารการพยาบาล', is_active: true },
  { id: 'USR-004', name: 'นางกัลยา อินทรสุข', role: 'หัวหน้าห้องคลอด', department: 'ห้องคลอด', is_active: true },
  { id: 'USR-005', name: 'นายธนวัฒน์ วงศ์ชัย', role: 'เจ้าหน้าที่ข้อมูล', department: 'อุบัติเหตุและฉุกเฉิน', is_active: false }
];

export const seedProjects = [
  {
    id: 'PRJ-001',
    project_name: 'พัฒนาระบบคัดกรองผู้ป่วยนอก',
    description: 'ปรับปรุงขั้นตอนคัดกรองและลดเวลารอรับบริการ',
    status: 'ดำเนินการ',
    created_at: '2026-01-08'
  },
  {
    id: 'PRJ-002',
    project_name: 'ลดอุบัติการณ์แผลกดทับในหอผู้ป่วย',
    description: 'ติดตาม risk score และ round ป้องกันแผลกดทับ',
    status: 'ดำเนินการ',
    created_at: '2026-02-12'
  },
  {
    id: 'PRJ-003',
    project_name: 'พัฒนาคุณภาพการดูแลมารดาหลังคลอด',
    description: 'จัดทำ care bundle และระบบติดตามหลังจำหน่าย',
    status: 'เสร็จสิ้น',
    created_at: '2026-03-03'
  },
  {
    id: 'PRJ-004',
    project_name: 'ระบบเตรียมความพร้อม ER Surge Capacity',
    description: 'สร้างแผนรองรับผู้ป่วยฉุกเฉินช่วงหนาแน่น',
    status: 'ระงับ',
    created_at: '2026-04-21'
  }
];

export const seedTasks = [
  {
    id: 'TSK-001',
    project_id: 'PRJ-001',
    task_name: 'สำรวจ flow จุดคัดกรองปัจจุบัน',
    progress_percentage: 100,
    assignee_id: 'USR-001',
    start_date: '2026-05-01',
    due_date: '2026-05-20',
    status: 'เสร็จสิ้น'
  },
  {
    id: 'TSK-002',
    project_id: 'PRJ-001',
    task_name: 'ออกแบบแบบฟอร์ม triage ใหม่',
    progress_percentage: 60,
    assignee_id: 'USR-003',
    start_date: '2026-06-03',
    due_date: '2026-06-20',
    status: 'อยู่ในกำหนด'
  },
  {
    id: 'TSK-003',
    project_id: 'PRJ-001',
    task_name: 'ทดลองใช้และประเมินผล',
    progress_percentage: 0,
    assignee_id: 'USR-001',
    start_date: '2026-06-24',
    due_date: '2026-07-12',
    status: 'ยังไม่เริ่มงาน'
  },
  {
    id: 'TSK-004',
    project_id: 'PRJ-002',
    task_name: 'อบรม Braden scale refresh',
    progress_percentage: 80,
    assignee_id: 'USR-002',
    start_date: '2026-05-15',
    due_date: '2026-06-10',
    status: 'ช้ากว่ากำหนด'
  },
  {
    id: 'TSK-005',
    project_id: 'PRJ-002',
    task_name: 'ติดตาม compliance การพลิกตะแคง',
    progress_percentage: 35,
    assignee_id: 'USR-002',
    start_date: '2026-06-08',
    due_date: '2026-06-22',
    status: 'อยู่ในกำหนด'
  },
  {
    id: 'TSK-006',
    project_id: 'PRJ-003',
    task_name: 'สรุปผล care bundle หลังคลอด',
    progress_percentage: 100,
    assignee_id: 'USR-004',
    start_date: '2026-04-01',
    due_date: '2026-05-02',
    status: 'เสร็จสิ้น'
  },
  {
    id: 'TSK-007',
    project_id: 'PRJ-004',
    task_name: 'จัดทำแผนเวรสำรองช่วงผู้ป่วยหนาแน่น',
    progress_percentage: 15,
    assignee_id: 'USR-005',
    start_date: '2026-06-01',
    due_date: '2026-06-13',
    status: 'ช้ากว่ากำหนด'
  }
];
