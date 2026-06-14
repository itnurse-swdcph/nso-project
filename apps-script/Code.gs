/**
 * Nursing Project Management System
 * Backend: Google Apps Script + Google Sheets
 *
 * Script Properties required:
 * - SPREADSHEET_ID: Google Sheet id used as database
 * - LINE_CHANNEL_ACCESS_TOKEN: LINE Messaging API channel access token
 * - LINE_DEFAULT_NOTIFY_TO: optional LINE user/group id for broadcast-like alerts
 */

const CONFIG = {
  cacheTtlSeconds: 21600,
  lockTimeoutMs: 30000,
  dueSoonDays: 3,
  defaultTaskPlan: [
    { task_type: 'ขออนุมัติ', weight_percent: 20, offsetDays: 7 },
    { task_type: 'จัดกิจกรรม', weight_percent: 50, offsetDays: 30 },
    { task_type: 'สรุปผล', weight_percent: 30, offsetDays: 45 }
  ],
  sheets: {
    Departments: ['id', 'name'],
    Users: ['id', 'name', 'department_id', 'line_user_id'],
    Projects: ['id', 'project_code', 'title', 'department_id', 'owner_id', 'created_at'],
    Tasks: ['id', 'project_id', 'task_type', 'weight_percent', 'start_date', 'due_date', 'actual_end_date', 'status']
  }
};

function doGet(e) {
  return routeRequest_(e, 'GET');
}

function doPost(e) {
  return routeRequest_(e, 'POST');
}

function routeRequest_(e, method) {
  try {
    const payload = parsePayload_(e, method);
    const action = payload.action || 'health';
    let result;

    switch (action) {
      case 'health':
        result = ok_({ timestamp: new Date().toISOString() }, 'API ready');
        break;
      case 'setupDatabase':
        result = setupDatabase();
        break;
      case 'getBootstrapData':
        result = ApiController.getBootstrapData();
        break;
      case 'getProjects':
        result = ApiController.getProjects(payload);
        break;
      case 'createProject':
        result = ApiController.createProject(payload);
        break;
      case 'updateTask':
        result = ApiController.updateTask(payload);
        break;
      case 'runDailyDueCheck':
        result = runDailyDueCheck();
        break;
      default:
        result = err_('Unknown action: ' + action);
    }

    return json_(result);
  } catch (error) {
    return json_(err_(safeMessage_(error), error));
  }
}

function parsePayload_(e, method) {
  if (!e) return {};
  const params = e.parameter || {};

  if (method === 'GET') {
    return params;
  }

  const raw = e.postData && e.postData.contents ? e.postData.contents : '';
  if (!raw) return params;

  try {
    return Object.assign({}, params, JSON.parse(raw));
  } catch (error) {
    return params;
  }
}

function json_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function ok_(data, message) {
  return { status: 'success', message: message || 'OK', data: data || null };
}

function err_(message, error) {
  if (error) console.error(error.stack || error);
  return { status: 'error', message: message || 'Unexpected error', data: null };
}

function safeMessage_(error) {
  return error && error.message ? error.message : String(error);
}

/**
 * STEP 1: Auto-Initialization
 * Run once from Apps Script editor, or call API action=setupDatabase.
 */
function setupDatabase() {
  try {
    const lock = LockService.getScriptLock();
    lock.waitLock(CONFIG.lockTimeoutMs);

    try {
      const ss = getDb_();
      Object.keys(CONFIG.sheets).forEach(function (sheetName) {
        const headers = CONFIG.sheets[sheetName];
        let sheet = ss.getSheetByName(sheetName);

        if (!sheet) {
          sheet = ss.insertSheet(sheetName);
          sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
          sheet.setFrozenRows(1);
          sheet.autoResizeColumns(1, headers.length);
          styleHeader_(sheet, headers.length);
          return;
        }

        const existing = getHeader_(sheet);
        if (existing.length === 0) {
          sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
          sheet.setFrozenRows(1);
          styleHeader_(sheet, headers.length);
          return;
        }

        const missingHeaders = headers.filter(function (name) {
          return existing.indexOf(name) === -1;
        });
        if (missingHeaders.length > 0) {
          throw new Error('Sheet ' + sheetName + ' has missing headers: ' + missingHeaders.join(', '));
        }
      });

      seedDepartmentsIfEmpty_();
      createDailyTriggerIfMissing_();
      clearStaticCaches_();

      return ok_({ sheets: Object.keys(CONFIG.sheets) }, 'Database setup completed');
    } finally {
      lock.releaseLock();
    }
  } catch (error) {
    return err_(safeMessage_(error), error);
  }
}

function styleHeader_(sheet, columnCount) {
  sheet.getRange(1, 1, 1, columnCount)
    .setFontWeight('bold')
    .setBackground('#0f766e')
    .setFontColor('#ffffff');
}

function seedDepartmentsIfEmpty_() {
  const sheet = getSheet_('Departments');
  if (sheet.getLastRow() > 1) return;

  const departments = [
    [newId_('DEP'), 'ผู้ป่วยนอก'],
    [newId_('DEP'), 'ผู้ป่วยใน'],
    [newId_('DEP'), 'ห้องคลอด'],
    [newId_('DEP'), 'อุบัติเหตุและฉุกเฉิน'],
    [newId_('DEP'), 'บริหารการพยาบาล']
  ];
  sheet.getRange(2, 1, departments.length, departments[0].length).setValues(departments);
}

function createDailyTriggerIfMissing_() {
  const exists = ScriptApp.getProjectTriggers().some(function (trigger) {
    return trigger.getHandlerFunction() === 'runDailyDueCheck';
  });
  if (exists) return;

  ScriptApp.newTrigger('runDailyDueCheck')
    .timeBased()
    .everyDays(1)
    .atHour(8)
    .create();
}

function getDb_() {
  const spreadsheetId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (spreadsheetId) return SpreadsheetApp.openById(spreadsheetId);
  return SpreadsheetApp.getActiveSpreadsheet();
}

function getSheet_(sheetName) {
  const sheet = getDb_().getSheetByName(sheetName);
  if (!sheet) throw new Error('Missing sheet: ' + sheetName + '. Run setupDatabase() first.');
  return sheet;
}

function getHeader_(sheet) {
  if (sheet.getLastRow() < 1 || sheet.getLastColumn() < 1) return [];
  return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
}

const SheetRepository = {
  readAll: function (sheetName) {
    const sheet = getSheet_(sheetName);
    const lastRow = sheet.getLastRow();
    const lastColumn = sheet.getLastColumn();
    if (lastRow < 2 || lastColumn < 1) return [];

    const values = sheet.getRange(1, 1, lastRow, lastColumn).getValues();
    const headers = values.shift().map(String);

    return values
      .filter(function (row) { return row.some(function (cell) { return cell !== ''; }); })
      .map(function (row, index) {
        const item = { _rowNumber: index + 2 };
        headers.forEach(function (header, columnIndex) {
          item[header] = normalizeCell_(row[columnIndex]);
        });
        return item;
      });
  },

  appendRows: function (sheetName, rows) {
    if (!rows || rows.length === 0) return;
    const sheet = getSheet_(sheetName);
    const headers = CONFIG.sheets[sheetName];
    const values = rows.map(function (row) {
      return headers.map(function (header) {
        return row[header] === undefined ? '' : row[header];
      });
    });
    sheet.getRange(sheet.getLastRow() + 1, 1, values.length, headers.length).setValues(values);
  },

  updateRow: function (sheetName, rowNumber, rowObject) {
    const sheet = getSheet_(sheetName);
    const headers = CONFIG.sheets[sheetName];
    const values = headers.map(function (header) {
      return rowObject[header] === undefined ? '' : rowObject[header];
    });
    sheet.getRange(rowNumber, 1, 1, headers.length).setValues([values]);
  }
};

function normalizeCell_(value) {
  if (value instanceof Date) return formatDate_(value);
  return value;
}

function clearStaticCaches_() {
  CacheService.getScriptCache().remove('departments');
  CacheService.getScriptCache().remove('users');
}

const StaticDataService = {
  getDepartments: function () {
    return cacheGetOrSet_('departments', function () {
      return SheetRepository.readAll('Departments');
    }, CONFIG.cacheTtlSeconds);
  },

  getUsers: function () {
    return cacheGetOrSet_('users', function () {
      return SheetRepository.readAll('Users');
    }, CONFIG.cacheTtlSeconds);
  }
};

function cacheGetOrSet_(key, producer, ttlSeconds) {
  const cache = CacheService.getScriptCache();
  const cached = cache.get(key);
  if (cached) return JSON.parse(cached);

  const data = producer();
  cache.put(key, JSON.stringify(data), ttlSeconds);
  return data;
}

/**
 * STEP 2: Business Logic + LockService
 */
const ApiController = {
  getBootstrapData: function () {
    try {
      return ok_({
        departments: StaticDataService.getDepartments(),
        users: StaticDataService.getUsers(),
        taskTypes: CONFIG.defaultTaskPlan.map(function (task) {
          return { task_type: task.task_type, weight_percent: task.weight_percent };
        })
      }, 'Bootstrap data loaded');
    } catch (error) {
      return err_(safeMessage_(error), error);
    }
  },

  getProjects: function (payload) {
    try {
      return ok_(ProjectService.getProjectSummaries(payload || {}), 'Projects loaded');
    } catch (error) {
      return err_(safeMessage_(error), error);
    }
  },

  createProject: function (payload) {
    try {
      const lock = LockService.getScriptLock();
      lock.waitLock(CONFIG.lockTimeoutMs);

      try {
        const result = ProjectService.createProject(payload || {});
        clearProjectCaches_();
        NotificationService.notifyProjectCreated(result.project);
        return ok_(result, 'Project created');
      } finally {
        lock.releaseLock();
      }
    } catch (error) {
      return err_(safeMessage_(error), error);
    }
  },

  updateTask: function (payload) {
    try {
      const lock = LockService.getScriptLock();
      lock.waitLock(CONFIG.lockTimeoutMs);

      try {
        const result = ProjectService.updateTask(payload || {});
        clearProjectCaches_();

        if (result.task.status === 'DONE') {
          NotificationService.notifyTaskDone(result.project, result.task, result.progressPercent);
        }

        return ok_(result, 'Task updated');
      } finally {
        lock.releaseLock();
      }
    } catch (error) {
      return err_(safeMessage_(error), error);
    }
  }
};

const ProjectService = {
  getProjectSummaries: function (filters) {
    return ProjectService.buildProjectSummaries_(filters || {});
  },

  buildProjectSummaries_: function (filters) {
    const departments = indexBy_(StaticDataService.getDepartments(), 'id');
    const users = indexBy_(StaticDataService.getUsers(), 'id');
    const tasks = SheetRepository.readAll('Tasks').map(function (task) {
      const refreshed = Object.assign({}, task, { status: calculateStatus_(task) });
      return refreshed;
    });
    const tasksByProject = groupBy_(tasks, 'project_id');
    const projects = SheetRepository.readAll('Projects');

    return projects
      .map(function (project) {
        const projectTasks = tasksByProject[project.id] || [];
        const progressPercent = calculateProgress_(projectTasks);
        return {
          id: project.id,
          project_code: project.project_code,
          title: project.title,
          department_id: project.department_id,
          department_name: departments[project.department_id] ? departments[project.department_id].name : '',
          owner_id: project.owner_id,
          owner_name: users[project.owner_id] ? users[project.owner_id].name : '',
          created_at: project.created_at,
          progress_percent: progressPercent,
          is_completed: progressPercent >= 100,
          tasks: projectTasks.map(stripInternal_)
        };
      })
      .filter(function (project) {
        if (filters.department_id && project.department_id !== filters.department_id) return false;
        if (String(filters.hide_completed) === 'true' && project.is_completed) return false;
        return true;
      })
      .sort(function (a, b) {
        return String(b.created_at).localeCompare(String(a.created_at));
      });
  },

  createProject: function (payload) {
    validateRequired_(payload, ['title', 'department_id', 'owner_id']);

    const now = new Date();
    const project = {
      id: newId_('PRJ'),
      project_code: payload.project_code || nextProjectCode_(),
      title: String(payload.title).trim(),
      department_id: payload.department_id,
      owner_id: payload.owner_id,
      created_at: formatDateTime_(now)
    };

    const startDate = payload.start_date ? parseDate_(payload.start_date) : now;
    const tasks = CONFIG.defaultTaskPlan.map(function (plan, index) {
      const dueDate = payload.task_due_dates && payload.task_due_dates[index]
        ? parseDate_(payload.task_due_dates[index])
        : addDays_(startDate, plan.offsetDays);

      return {
        id: newId_('TSK'),
        project_id: project.id,
        task_type: plan.task_type,
        weight_percent: plan.weight_percent,
        start_date: formatDate_(startDate),
        due_date: formatDate_(dueDate),
        actual_end_date: '',
        status: 'PENDING'
      };
    });

    SheetRepository.appendRows('Projects', [project]);
    SheetRepository.appendRows('Tasks', tasks);

    return {
      project: project,
      tasks: tasks,
      progressPercent: 0
    };
  },

  updateTask: function (payload) {
    validateRequired_(payload, ['task_id']);

    const tasks = SheetRepository.readAll('Tasks');
    const task = tasks.find(function (item) { return item.id === payload.task_id; });
    if (!task) throw new Error('Task not found: ' + payload.task_id);

    if (payload.actual_end_date !== undefined) {
      task.actual_end_date = payload.actual_end_date ? formatDate_(parseDate_(payload.actual_end_date)) : '';
    }
    if (payload.due_date !== undefined && payload.due_date) {
      task.due_date = formatDate_(parseDate_(payload.due_date));
    }
    if (payload.start_date !== undefined && payload.start_date) {
      task.start_date = formatDate_(parseDate_(payload.start_date));
    }

    task.status = calculateStatus_(task);
    SheetRepository.updateRow('Tasks', task._rowNumber, task);

    const projectTasks = tasks
      .map(function (item) { return item.id === task.id ? task : item; })
      .filter(function (item) { return item.project_id === task.project_id; });
    const progressPercent = calculateProgress_(projectTasks);
    const project = SheetRepository.readAll('Projects').find(function (item) { return item.id === task.project_id; });

    return {
      project: project,
      task: stripInternal_(task),
      progressPercent: progressPercent
    };
  }
};

function validateRequired_(payload, requiredFields) {
  requiredFields.forEach(function (field) {
    if (payload[field] === undefined || payload[field] === null || String(payload[field]).trim() === '') {
      throw new Error('Missing required field: ' + field);
    }
  });
}

function calculateStatus_(task) {
  if (task.actual_end_date) return 'DONE';
  if (!task.due_date) return 'PENDING';

  const today = startOfDay_(new Date());
  const dueDate = startOfDay_(parseDate_(task.due_date));
  return today.getTime() > dueDate.getTime() ? 'OVERDUE' : 'PENDING';
}

function calculateProgress_(tasks) {
  return tasks.reduce(function (sum, task) {
    return task.status === 'DONE' ? sum + Number(task.weight_percent || 0) : sum;
  }, 0);
}

function nextProjectCode_() {
  const year = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy');
  const projects = SheetRepository.readAll('Projects');
  const next = projects.length + 1;
  return 'NUR-' + year + '-' + String(next).padStart(4, '0');
}

function clearProjectCaches_() {
  // Project data changes often, so dashboard summaries are read live with bulk getValues().
}

/**
 * STEP 3: LINE Messaging API + Daily Cron Job
 */
const NotificationService = {
  notifyProjectCreated: function (project) {
    try {
      const owner = findUser_(project.owner_id);
      const targets = collectLineTargets_(owner);
      const message = [
        'สร้างโครงการใหม่',
        'รหัส: ' + project.project_code,
        'ชื่อ: ' + project.title
      ].join('\n');
      targets.forEach(function (target) { sendLineText_(target, message); });
    } catch (error) {
      console.error(error.stack || error);
    }
  },

  notifyTaskDone: function (project, task, progressPercent) {
    try {
      if (!project) return;
      const owner = findUser_(project.owner_id);
      const targets = collectLineTargets_(owner);
      const message = [
        'อัปเดตงานเสร็จสิ้น',
        'โครงการ: ' + project.title,
        'งาน: ' + task.task_type,
        'ความก้าวหน้า: ' + progressPercent + '%'
      ].join('\n');
      targets.forEach(function (target) { sendLineText_(target, message); });
    } catch (error) {
      console.error(error.stack || error);
    }
  },

  notifyDueAlerts: function (alerts) {
    if (!alerts || alerts.length === 0) return 0;

    const sentKeys = {};
    alerts.forEach(function (alert) {
      if (!alert.project) return;
      const owner = findUser_(alert.project.owner_id);
      const targets = collectLineTargets_(owner);
      const message = [
        alert.status === 'OVERDUE' ? 'งานเลยกำหนด' : 'งานใกล้ครบกำหนด',
        'โครงการ: ' + alert.project.title,
        'งาน: ' + alert.task.task_type,
        'กำหนด: ' + alert.task.due_date,
        'สถานะ: ' + alert.status
      ].join('\n');

      targets.forEach(function (target) {
        const key = target + ':' + alert.task.id;
        if (sentKeys[key]) return;
        sendLineText_(target, message);
        sentKeys[key] = true;
      });
    });

    return Object.keys(sentKeys).length;
  }
};

function runDailyDueCheck() {
  try {
    const lock = LockService.getScriptLock();
    lock.waitLock(CONFIG.lockTimeoutMs);

    try {
      const tasks = SheetRepository.readAll('Tasks');
      const projects = indexBy_(SheetRepository.readAll('Projects'), 'id');
      const today = startOfDay_(new Date());
      const soonLimit = addDays_(today, CONFIG.dueSoonDays);
      const updatedTasks = [];
      const alerts = [];

      tasks.forEach(function (task) {
        const nextStatus = calculateStatus_(task);
        if (task.status !== nextStatus) {
          task.status = nextStatus;
          updatedTasks.push(task);
        }

        if (task.status === 'DONE' || !task.due_date) return;

        const dueDate = startOfDay_(parseDate_(task.due_date));
        if (task.status === 'OVERDUE' || dueDate.getTime() <= soonLimit.getTime()) {
          alerts.push({
            status: task.status === 'OVERDUE' ? 'OVERDUE' : 'DUE_SOON',
            task: task,
            project: projects[task.project_id]
          });
        }
      });

      updatedTasks.forEach(function (task) {
        SheetRepository.updateRow('Tasks', task._rowNumber, task);
      });
      clearProjectCaches_();

      const sent = NotificationService.notifyDueAlerts(alerts);
      return ok_({ updatedStatuses: updatedTasks.length, alerts: alerts.length, lineMessages: sent }, 'Daily due check completed');
    } finally {
      lock.releaseLock();
    }
  } catch (error) {
    return err_(safeMessage_(error), error);
  }
}

function sendLineText_(to, text) {
  const token = PropertiesService.getScriptProperties().getProperty('LINE_CHANNEL_ACCESS_TOKEN');
  if (!token || !to) return;

  const response = UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Authorization: 'Bearer ' + token
    },
    muteHttpExceptions: true,
    payload: JSON.stringify({
      to: to,
      messages: [{ type: 'text', text: text }]
    })
  });

  const code = response.getResponseCode();
  if (code < 200 || code >= 300) {
    console.error('LINE push failed: ' + code + ' ' + response.getContentText());
  }
}

function collectLineTargets_(user) {
  const targets = [];
  const defaultTarget = PropertiesService.getScriptProperties().getProperty('LINE_DEFAULT_NOTIFY_TO');
  if (user && user.line_user_id) targets.push(user.line_user_id);
  if (defaultTarget) targets.push(defaultTarget);
  return targets.filter(function (value, index, self) {
    return value && self.indexOf(value) === index;
  });
}

function findUser_(userId) {
  if (!userId) return null;
  return StaticDataService.getUsers().find(function (user) { return user.id === userId; }) || null;
}

function indexBy_(items, key) {
  return items.reduce(function (acc, item) {
    acc[item[key]] = item;
    return acc;
  }, {});
}

function groupBy_(items, key) {
  return items.reduce(function (acc, item) {
    const groupKey = item[key];
    if (!acc[groupKey]) acc[groupKey] = [];
    acc[groupKey].push(item);
    return acc;
  }, {});
}

function stripInternal_(item) {
  const clone = Object.assign({}, item);
  delete clone._rowNumber;
  return clone;
}

function newId_(prefix) {
  return prefix + '_' + Utilities.getUuid().replace(/-/g, '').slice(0, 16);
}

function parseDate_(value) {
  if (value instanceof Date) return value;
  if (!value) throw new Error('Invalid date');
  const parts = String(value).slice(0, 10).split('-');
  if (parts.length === 3) {
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  }
  const date = new Date(value);
  if (isNaN(date.getTime())) throw new Error('Invalid date: ' + value);
  return date;
}

function formatDate_(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function formatDateTime_(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
}

function addDays_(date, days) {
  const next = new Date(date.getTime());
  next.setDate(next.getDate() + days);
  return next;
}

function startOfDay_(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
