import { create } from 'zustand';
import { clampProgress, enrichTasks, uid } from '../utils/status';

const API_URL = 'https://script.google.com/macros/s/AKfycbwIEHwnP1hp0fwTB_Ix2IECDW-pAtAu7VdsPuUDKPHSdyuoBRvs71GiSsTJRf5RCHJB/exec';

export const useAppStore = create((set, get) => ({
  // กำหนด State เริ่มต้นเป็น Array ว่าง
  users: [],
  projects: [],
  tasks: [],
  loading: false,
  error: null,

  // ฟังก์ชันดึงข้อมูลจาก API จริง
  fetchData: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      set({
        users: data.users || [],
        projects: data.projects || [],
        tasks: enrichTasks(data.tasks || []),
        loading: false
      });
    } catch (error) {
      console.error('Failed to fetch data:', error);
      set({ 
        error: error.message || 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้', 
        loading: false 
      });
    }
  },

  refreshStatuses: () => {
    set((state) => ({ ...state, tasks: enrichTasks(state.tasks) }));
  },

  // --------------------------------------------------------
  // CRUD Operations (ทำงานอัปเดต State บน Client เป็นหลัก)
  // *หมายเหตุ: หากต้องการบันทึกลง Google Sheet ด้วย ต้องทำ API POST เพิ่มเติม
  // --------------------------------------------------------

  createProject: (payload) => {
    set((state) => ({
      ...state,
      projects: [
        ...state.projects,
        {
          id: uid('PRJ'),
          project_name: payload.project_name,
          description: payload.description || '',
          status: payload.status || 'ดำเนินการ',
          created_at: payload.created_at || new Date().toISOString().slice(0, 10)
        }
      ]
    }));
  },

  updateProject: (id, payload) => {
    set((state) => ({
      ...state,
      projects: state.projects.map((project) => (project.id === id ? { ...project, ...payload } : project))
    }));
  },

  deleteProject: (id) => {
    set((state) => ({
      ...state,
      projects: state.projects.filter((project) => project.id !== id),
      tasks: state.tasks.filter((task) => task.project_id !== id)
    }));
  },

  createTask: (payload) => {
    set((state) => {
      const task = {
        id: uid('TSK'),
        project_id: payload.project_id,
        task_name: payload.task_name,
        progress_percentage: clampProgress(payload.progress_percentage),
        assignee_id: payload.assignee_id,
        start_date: payload.start_date,
        due_date: payload.due_date,
        status: payload.status || 'ยังไม่เริ่มงาน'
      };
      return {
        ...state,
        tasks: enrichTasks([...state.tasks, task])
      };
    });
  },

  updateTask: (id, payload) => {
    set((state) => ({
      ...state,
      tasks: enrichTasks(
        state.tasks.map((task) => (
          task.id === id
            ? { ...task, ...payload, progress_percentage: clampProgress(payload.progress_percentage ?? task.progress_percentage) }
            : task
        ))
      )
    }));
  },

  deleteTask: (id) => {
    set((state) => ({
      ...state,
      tasks: state.tasks.filter((task) => task.id !== id)
    }));
  },

  createUser: (payload) => {
    set((state) => ({
      ...state,
      users: [
        ...state.users,
        {
          id: uid('USR'),
          name: payload.name,
          role: payload.role || '',
          department: payload.department || '',
          is_active: Boolean(payload.is_active)
        }
      ]
    }));
  },

  updateUser: (id, payload) => {
    set((state) => ({
      ...state,
      users: state.users.map((user) => (user.id === id ? { ...user, ...payload, is_active: Boolean(payload.is_active) } : user))
    }));
  },

  deleteUser: (id) => {
    set((state) => {
      const fallbackUserId = get().users.find((user) => user.id !== id)?.id || '';
      return {
        ...state,
        users: state.users.filter((user) => user.id !== id),
        tasks: state.tasks.map((task) => (task.assignee_id === id ? { ...task, assignee_id: fallbackUserId } : task))
      };
    });
  }
}));
