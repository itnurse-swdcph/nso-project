import { create } from 'zustand';
import { seedProjects, seedTasks, seedUsers } from '../data/seedData';
import { clampProgress, enrichTasks, uid } from '../utils/status';

const STORAGE_KEY = 'npms-2026-state-v1';

function loadInitialState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        users: parsed.users || seedUsers,
        projects: parsed.projects || seedProjects,
        tasks: enrichTasks(parsed.tasks || seedTasks)
      };
    }
  } catch (error) {
    console.warn('Unable to load local state', error);
  }

  return {
    users: seedUsers,
    projects: seedProjects,
    tasks: enrichTasks(seedTasks)
  };
}

function persist(state) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      users: state.users,
      projects: state.projects,
      tasks: state.tasks
    })
  );
}

export const useAppStore = create((set, get) => ({
  ...loadInitialState(),

  refreshStatuses: () => {
    set((state) => {
      const next = { ...state, tasks: enrichTasks(state.tasks) };
      persist(next);
      return next;
    });
  },

  resetDemoData: () => {
    const next = {
      users: seedUsers,
      projects: seedProjects,
      tasks: enrichTasks(seedTasks)
    };
    persist(next);
    set(next);
  },

  createProject: (payload) => {
    set((state) => {
      const next = {
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
      };
      persist(next);
      return next;
    });
  },

  updateProject: (id, payload) => {
    set((state) => {
      const next = {
        ...state,
        projects: state.projects.map((project) => (project.id === id ? { ...project, ...payload } : project))
      };
      persist(next);
      return next;
    });
  },

  deleteProject: (id) => {
    set((state) => {
      const next = {
        ...state,
        projects: state.projects.filter((project) => project.id !== id),
        tasks: state.tasks.filter((task) => task.project_id !== id)
      };
      persist(next);
      return next;
    });
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
      const next = {
        ...state,
        tasks: enrichTasks([...state.tasks, task])
      };
      persist(next);
      return next;
    });
  },

  updateTask: (id, payload) => {
    set((state) => {
      const next = {
        ...state,
        tasks: enrichTasks(
          state.tasks.map((task) => (
            task.id === id
              ? { ...task, ...payload, progress_percentage: clampProgress(payload.progress_percentage ?? task.progress_percentage) }
              : task
          ))
        )
      };
      persist(next);
      return next;
    });
  },

  deleteTask: (id) => {
    set((state) => {
      const next = {
        ...state,
        tasks: state.tasks.filter((task) => task.id !== id)
      };
      persist(next);
      return next;
    });
  },

  createUser: (payload) => {
    set((state) => {
      const next = {
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
      };
      persist(next);
      return next;
    });
  },

  updateUser: (id, payload) => {
    set((state) => {
      const next = {
        ...state,
        users: state.users.map((user) => (user.id === id ? { ...user, ...payload, is_active: Boolean(payload.is_active) } : user))
      };
      persist(next);
      return next;
    });
  },

  deleteUser: (id) => {
    set((state) => {
      const fallbackUserId = get().users.find((user) => user.id !== id)?.id || '';
      const next = {
        ...state,
        users: state.users.filter((user) => user.id !== id),
        tasks: state.tasks.map((task) => (task.assignee_id === id ? { ...task, assignee_id: fallbackUserId } : task))
      };
      persist(next);
      return next;
    });
  }
}));
