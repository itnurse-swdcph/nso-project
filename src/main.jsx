import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import MainMenu from './pages/MainMenu';
import Dashboard from './pages/Dashboard';
import UpcomingTasks from './pages/UpcomingTasks';
import CalendarView from './pages/CalendarView';
import ProjectsCRUD from './pages/ProjectsCRUD';
import TasksCRUD from './pages/TasksCRUD';
import UsersCRUD from './pages/UsersCRUD';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<MainMenu />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="upcoming" element={<UpcomingTasks />} />
          <Route path="calendar" element={<CalendarView />} />
          <Route path="projects" element={<ProjectsCRUD />} />
          <Route path="tasks" element={<TasksCRUD />} />
          <Route path="users" element={<UsersCRUD />} />
        </Route>
      </Routes>
    </HashRouter>
  </React.StrictMode>
);
