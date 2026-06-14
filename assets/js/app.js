(function () {
  'use strict';

  const API_URL = window.NPMS_API_URL || '';
  const state = {
    departments: [],
    users: [],
    projects: [],
    table: null,
    activeProject: null
  };

  const els = {};

  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    bindElements();
    bindEvents();
    setDefaultDates();

    if (!API_URL) {
      toast('ตั้งค่า window.NPMS_API_URL ใน index.html ก่อนใช้งาน');
      renderTable([]);
      return;
    }

    await loadBootstrapData();
    await loadProjects();
  }

  function bindElements() {
    els.body = document.body;
    els.departmentFilter = document.getElementById('departmentFilter');
    els.hideCompletedFilter = document.getElementById('hideCompletedFilter');
    els.refreshBtn = document.getElementById('refreshBtn');
    els.summaryStrip = document.getElementById('summaryStrip');
    els.projectForm = document.getElementById('projectForm');
    els.projectDepartment = document.getElementById('projectDepartment');
    els.projectOwner = document.getElementById('projectOwner');
    els.projectStartDate = document.getElementById('projectStartDate');
    els.taskList = document.getElementById('taskList');
    els.tasksModalTitle = document.getElementById('tasksModalTitle');
    els.toast = document.getElementById('appToast');
    els.toastMessage = document.getElementById('toastMessage');
  }

  function bindEvents() {
    els.refreshBtn.addEventListener('click', loadProjects);
    els.departmentFilter.addEventListener('change', loadProjects);
    els.hideCompletedFilter.addEventListener('change', loadProjects);
    els.projectDepartment.addEventListener('change', filterOwnersForForm);
    els.projectStartDate.addEventListener('change', setDefaultTaskDueDates);
    els.projectForm.addEventListener('submit', createProject);

    document.getElementById('projectsTable').addEventListener('click', function (event) {
      const button = event.target.closest('[data-view-tasks]');
      if (!button) return;
      openTasksModal(button.getAttribute('data-view-tasks'));
    });

    els.taskList.addEventListener('click', async function (event) {
      const button = event.target.closest('[data-task-action]');
      if (!button) return;
      await updateTask(button);
    });
  }

  async function loadBootstrapData() {
    setLoading(true);
    try {
      const response = await api('getBootstrapData');
      state.departments = response.departments || [];
      state.users = response.users || [];
      fillSelect(els.departmentFilter, state.departments, 'ทั้งหมด');
      fillSelect(els.projectDepartment, state.departments, 'เลือกแผนก');
      fillSelect(els.projectOwner, state.users, 'เลือกผู้รับผิดชอบ');
    } catch (error) {
      toast(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadProjects() {
    if (!API_URL) return;
    setLoading(true);
    try {
      const payload = {
        department_id: els.departmentFilter.value,
        hide_completed: els.hideCompletedFilter.checked ? 'true' : 'false'
      };
      state.projects = await api('getProjects', payload);
      renderSummary(state.projects);
      renderTable(state.projects);
    } catch (error) {
      toast(error.message);
    } finally {
      setLoading(false);
    }
  }

  function renderTable(projects) {
    const columns = [
      { data: 'project_code', defaultContent: '' },
      {
        data: 'title',
        render: function (data) {
          return '<span class="fw-semibold">' + escapeHtml(data) + '</span>';
        }
      },
      { data: 'department_name', defaultContent: '' },
      { data: 'owner_name', defaultContent: '' },
      {
        data: 'progress_percent',
        render: function (value) {
          const percent = Number(value || 0);
          return [
            '<div class="d-flex align-items-center gap-2">',
            '<div class="progress" role="progressbar" aria-valuenow="' + percent + '" aria-valuemin="0" aria-valuemax="100">',
            '<div class="progress-bar" style="width:' + percent + '%"></div>',
            '</div>',
            '<span class="small text-secondary">' + percent + '%</span>',
            '</div>'
          ].join('');
        }
      },
      {
        data: 'tasks',
        render: function (tasks) {
          return renderProjectStatus(tasks || []);
        }
      },
      {
        data: 'id',
        className: 'text-end',
        orderable: false,
        render: function (id) {
          return '<button class="btn btn-outline-secondary btn-sm" type="button" data-view-tasks="' + escapeHtml(id) + '">งานย่อย</button>';
        }
      }
    ];

    if (state.table) {
      state.table.clear();
      state.table.rows.add(projects);
      state.table.draw();
      return;
    }

    if (typeof window.DataTable === 'undefined') {
      renderPlainTable(projects);
      return;
    }

    state.table = new DataTable('#projectsTable', {
      data: projects,
      columns: columns,
      pageLength: 25,
      deferRender: true,
      order: [[0, 'desc']],
      language: {
        search: 'ค้นหา',
        lengthMenu: '_MENU_ รายการ',
        info: 'แสดง _START_ ถึง _END_ จาก _TOTAL_ รายการ',
        infoEmpty: 'ไม่มีรายการ',
        zeroRecords: 'ไม่พบข้อมูล',
        emptyTable: 'ไม่มีข้อมูล',
        paginate: {
          first: 'แรก',
          previous: 'ก่อนหน้า',
          next: 'ถัดไป',
          last: 'สุดท้าย'
        }
      }
    });
  }

  function renderPlainTable(projects) {
    const tbody = document.querySelector('#projectsTable tbody');
    if (!projects.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center text-secondary py-4">ไม่มีข้อมูล</td></tr>';
      return;
    }

    tbody.innerHTML = projects.map(function (project) {
      return [
        '<tr>',
        '<td>' + escapeHtml(project.project_code || '') + '</td>',
        '<td><span class="fw-semibold">' + escapeHtml(project.title || '') + '</span></td>',
        '<td>' + escapeHtml(project.department_name || '') + '</td>',
        '<td>' + escapeHtml(project.owner_name || '') + '</td>',
        '<td>',
        '<div class="d-flex align-items-center gap-2">',
        '<div class="progress" role="progressbar" aria-valuenow="' + Number(project.progress_percent || 0) + '" aria-valuemin="0" aria-valuemax="100">',
        '<div class="progress-bar" style="width:' + Number(project.progress_percent || 0) + '%"></div>',
        '</div>',
        '<span class="small text-secondary">' + Number(project.progress_percent || 0) + '%</span>',
        '</div>',
        '</td>',
        '<td>' + renderProjectStatus(project.tasks || []) + '</td>',
        '<td class="text-end"><button class="btn btn-outline-secondary btn-sm" type="button" data-view-tasks="' + escapeHtml(project.id) + '">งานย่อย</button></td>',
        '</tr>'
      ].join('');
    }).join('');
  }

  function renderProjectStatus(tasks) {
    const done = tasks.filter(function (task) { return task.status === 'DONE'; }).length;
    const overdue = tasks.filter(function (task) { return task.status === 'OVERDUE'; }).length;

    if (done === tasks.length && tasks.length > 0) return badge('DONE', 'badge-done');
    if (overdue > 0) return badge('OVERDUE ' + overdue, 'badge-overdue');
    if (done > 0) return badge('IN PROGRESS', 'badge-mixed');
    return badge('PENDING', 'badge-pending');
  }

  function renderSummary(projects) {
    const completed = projects.filter(function (project) { return project.is_completed; }).length;
    const overdue = projects.filter(function (project) {
      return (project.tasks || []).some(function (task) { return task.status === 'OVERDUE'; });
    }).length;

    els.summaryStrip.innerHTML = [
      '<span><strong>' + projects.length + '</strong>ทั้งหมด</span>',
      '<span><strong>' + completed + '</strong>เสร็จสิ้น</span>',
      '<span><strong>' + overdue + '</strong>ค้างกำหนด</span>'
    ].join('');
  }

  function openTasksModal(projectId) {
    const project = state.projects.find(function (item) { return item.id === projectId; });
    if (!project) return;

    state.activeProject = project;
    els.tasksModalTitle.textContent = project.project_code + ' - ' + project.title;
    els.taskList.innerHTML = (project.tasks || []).map(renderTaskItem).join('');

    showModal('tasksModal');
  }

  function renderTaskItem(task) {
    const statusClass = task.status === 'DONE'
      ? 'badge-done'
      : task.status === 'OVERDUE'
        ? 'badge-overdue'
        : 'badge-pending';
    const actualEndDate = task.actual_end_date || todayIso();

    return [
      '<article class="task-item" data-task-id="' + escapeHtml(task.id) + '">',
      '<header>',
      '<div>',
      '<div class="task-title">' + escapeHtml(task.task_type) + ' (' + Number(task.weight_percent || 0) + '%)</div>',
      '<div class="task-meta">เริ่ม ' + escapeHtml(task.start_date || '-') + ' · กำหนด ' + escapeHtml(task.due_date || '-') + '</div>',
      '</div>',
      badge(task.status, statusClass),
      '</header>',
      '<div class="task-actions">',
      '<div>',
      '<label class="form-label small" for="actual-' + escapeHtml(task.id) + '">Actual end date</label>',
      '<input class="form-control" id="actual-' + escapeHtml(task.id) + '" type="date" value="' + escapeHtml(actualEndDate) + '">',
      '</div>',
      '<button class="btn btn-teal" type="button" data-task-action="done" data-task-id="' + escapeHtml(task.id) + '">บันทึกเสร็จ</button>',
      '<button class="btn btn-outline-secondary" type="button" data-task-action="clear" data-task-id="' + escapeHtml(task.id) + '">ล้างวันที่</button>',
      '</div>',
      '</article>'
    ].join('');
  }

  async function createProject(event) {
    event.preventDefault();
    setLoading(true);

    try {
      const form = new FormData(els.projectForm);
      const payload = {
        project_code: form.get('project_code'),
        title: form.get('title'),
        department_id: form.get('department_id'),
        owner_id: form.get('owner_id'),
        start_date: form.get('start_date'),
        task_due_dates: [
          form.get('task_due_0'),
          form.get('task_due_1'),
          form.get('task_due_2')
        ]
      };

      await api('createProject', payload);
      hideModal('projectModal');
      els.projectForm.reset();
      setDefaultDates();
      await loadProjects();
      toast('บันทึกโครงการแล้ว');
    } catch (error) {
      toast(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function updateTask(button) {
    const taskId = button.getAttribute('data-task-id');
    const action = button.getAttribute('data-task-action');
    const input = document.getElementById('actual-' + taskId);
    const actualEndDate = action === 'done' ? input.value : '';

    setLoading(true);
    try {
      await api('updateTask', {
        task_id: taskId,
        actual_end_date: actualEndDate
      });
      await loadProjects();

      if (state.activeProject) {
        openTasksModal(state.activeProject.id);
      }
      toast('อัปเดตงานแล้ว');
    } catch (error) {
      toast(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function api(action, payload) {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(Object.assign({ action: action }, payload || {}))
    });

    if (!response.ok) {
      throw new Error('API error: HTTP ' + response.status);
    }

    const result = await response.json();
    if (result.status !== 'success') {
      throw new Error(result.message || 'Unexpected API error');
    }
    return result.data;
  }

  function fillSelect(select, items, placeholder) {
    const current = select.value;
    select.innerHTML = '<option value="">' + escapeHtml(placeholder) + '</option>' + items.map(function (item) {
      return '<option value="' + escapeHtml(item.id) + '">' + escapeHtml(item.name) + '</option>';
    }).join('');
    if (current) select.value = current;
  }

  function filterOwnersForForm() {
    const departmentId = els.projectDepartment.value;
    const users = departmentId
      ? state.users.filter(function (user) { return user.department_id === departmentId; })
      : state.users;

    fillSelect(els.projectOwner, users.length ? users : state.users, 'เลือกผู้รับผิดชอบ');
  }

  function setDefaultDates() {
    els.projectStartDate.value = todayIso();
    setDefaultTaskDueDates();
  }

  function setDefaultTaskDueDates() {
    const start = els.projectStartDate.value || todayIso();
    document.getElementById('dueApproval').value = addDaysIso(start, 7);
    document.getElementById('dueActivity').value = addDaysIso(start, 30);
    document.getElementById('dueSummary').value = addDaysIso(start, 45);
  }

  function badge(text, className) {
    return '<span class="badge-status ' + className + '">' + escapeHtml(text) + '</span>';
  }

  function toast(message) {
    els.toastMessage.textContent = message;
    if (window.bootstrap && window.bootstrap.Toast) {
      window.bootstrap.Toast.getOrCreateInstance(els.toast, { delay: 3200 }).show();
    }
  }

  function showModal(id) {
    const element = document.getElementById(id);
    if (window.bootstrap && window.bootstrap.Modal) {
      window.bootstrap.Modal.getOrCreateInstance(element).show();
    }
  }

  function hideModal(id) {
    const element = document.getElementById(id);
    if (window.bootstrap && window.bootstrap.Modal) {
      const modal = window.bootstrap.Modal.getInstance(element);
      if (modal) modal.hide();
    }
  }

  function setLoading(isLoading) {
    els.body.classList.toggle('loading-scrim', isLoading);
  }

  function todayIso() {
    return new Date().toISOString().slice(0, 10);
  }

  function addDaysIso(isoDate, days) {
    const date = new Date(isoDate + 'T00:00:00');
    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 10);
  }

  function escapeHtml(value) {
    return String(value === undefined || value === null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
})();
