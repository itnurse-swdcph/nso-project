export const taskStatuses = ['ยังไม่เริ่มงาน', 'อยู่ในกำหนด', 'ช้ากว่ากำหนด', 'เสร็จสิ้น'];
export const projectStatuses = ['ดำเนินการ', 'เสร็จสิ้น', 'ระงับ'];

export const statusTone = {
  'ยังไม่เริ่มงาน': 'slate',
  'อยู่ในกำหนด': 'amber',
  'ช้ากว่ากำหนด': 'red',
  'เสร็จสิ้น': 'emerald',
  'ดำเนินการ': 'blue',
  'ระงับ': 'slate'
};

export function toDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function todayStart() {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

export function daysBetween(fromDate, toDateValue) {
  const from = toDate(fromDate);
  const to = toDate(toDateValue);
  if (!from || !to) return 0;
  return Math.ceil((to.getTime() - from.getTime()) / 86400000);
}

export function evaluateTaskStatus(task, now = todayStart()) {
  const progress = Number(task.progress_percentage || 0);
  const dueDate = toDate(task.due_date);
  const startDate = toDate(task.start_date);

  if (progress >= 100) return 'เสร็จสิ้น';
  if (dueDate && dueDate.getTime() < now.getTime()) return 'ช้ากว่ากำหนด';
  if (startDate && startDate.getTime() > now.getTime() && progress === 0) return 'ยังไม่เริ่มงาน';
  if (progress === 0) return 'ยังไม่เริ่มงาน';
  return 'อยู่ในกำหนด';
}

export function enrichTasks(tasks) {
  const now = todayStart();
  return tasks.map((task) => ({
    ...task,
    progress_percentage: clampProgress(task.progress_percentage),
    status: evaluateTaskStatus(task, now)
  }));
}

export function clampProgress(value) {
  const number = Number(value || 0);
  if (number < 0) return 0;
  if (number > 100) return 100;
  return Math.round(number);
}

export function projectProgress(projectId, tasks) {
  const projectTasks = tasks.filter((task) => task.project_id === projectId);
  if (projectTasks.length === 0) return 0;
  const total = projectTasks.reduce((sum, task) => sum + Number(task.progress_percentage || 0), 0);
  return Math.round(total / projectTasks.length);
}

export function projectTaskSummary(projectId, tasks) {
  const projectTasks = tasks.filter((task) => task.project_id === projectId);
  const done = projectTasks.filter((task) => task.status === 'เสร็จสิ้น').length;
  const overdue = projectTasks.filter((task) => task.status === 'ช้ากว่ากำหนด').length;
  return {
    total: projectTasks.length,
    done,
    overdue,
    progress: projectProgress(projectId, tasks)
  };
}

export function urgencyTone(task) {
  if (task.status === 'ช้ากว่ากำหนด') return 'red';
  const daysLeft = daysBetween(todayStart(), task.due_date);
  if (daysLeft <= 3) return 'amber';
  return 'emerald';
}

export function dateThai(value) {
  const date = toDate(value);
  if (!date) return '-';
  return new Intl.DateTimeFormat('th-TH', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(date);
}

export function uid(prefix) {
  const segment = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${segment}`;
}
