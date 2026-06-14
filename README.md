# Nursing Project Management System

ระบบบริหารจัดการและติดตามความก้าวหน้าโครงการ ภารกิจด้านการพยาบาล โรงพยาบาลสมเด็จพระยุพราชสว่างแดนดิน

## โครงสร้างไฟล์

- `apps-script/Code.gs` - Backend/API สำหรับ Google Apps Script
- `index.html` - GitHub Pages frontend
- `assets/css/styles.css` - CSS
- `assets/js/app.js` - Vanilla JavaScript frontend

## STEP 1: Setup Google Sheets Database

1. สร้าง Google Sheet เปล่า 1 ไฟล์
2. สร้าง Google Apps Script project แล้ววางโค้ดจาก `apps-script/Code.gs`
3. ตั้งค่า Script Properties:
   - `SPREADSHEET_ID` = id ของ Google Sheet
   - `LINE_CHANNEL_ACCESS_TOKEN` = Channel access token ของ LINE Messaging API
   - `LINE_DEFAULT_NOTIFY_TO` = LINE user/group id สำหรับรับแจ้งเตือนรวม ถ้ามี
4. Run ฟังก์ชัน `setupDatabase()`

ฟังก์ชันนี้จะสร้าง Sheets และ Header อัตโนมัติ:

- `Departments`: `id, name`
- `Users`: `id, name, department_id, line_user_id`
- `Projects`: `id, project_code, title, department_id, owner_id, created_at`
- `Tasks`: `id, project_id, task_type, weight_percent, start_date, due_date, actual_end_date, status`

## STEP 2: Deploy Apps Script API

Deploy เป็น Web App:

- Execute as: `Me`
- Who has access: เลือกตามนโยบายองค์กร หรือ `Anyone with the link` หากใช้กับ GitHub Pages ภายนอกโดเมน

คัดลอก Web App URL แล้วนำไปใส่ใน `index.html`:

```html
<script>
  window.NPMS_API_URL = 'https://script.google.com/macros/s/DEPLOYMENT_ID/exec';
</script>
```

## STEP 3: Data และ Notification

- เพิ่มข้อมูลผู้ใช้ใน Sheet `Users`
- `department_id` ต้องตรงกับ `Departments.id`
- `line_user_id` คือ LINE user id หรือใส่ `LINE_DEFAULT_NOTIFY_TO` เพื่อส่งเข้ากลุ่ม/ผู้รับกลาง
- `setupDatabase()` จะสร้าง daily trigger `runDailyDueCheck()` เวลา 08:00 น.

## STEP 4: GitHub Pages

เปิดใช้งาน GitHub Pages จาก repository นี้ โดยให้ root เป็น source หลัก จากนั้นหน้าเว็บจะโหลด `index.html` โดยตรง

## API Actions

ทุก response เป็น JSON รูปแบบ:

```json
{ "status": "success", "message": "OK", "data": [] }
```

Actions หลัก:

- `setupDatabase`
- `getBootstrapData`
- `getProjects`
- `createProject`
- `updateTask`
- `runDailyDueCheck`

## Performance และ Concurrency

- อ่านข้อมูลจาก Sheets ด้วย bulk `getValues()` ผ่าน `SheetRepository.readAll()`
- เขียนข้อมูลด้วย bulk `setValues()`
- ใช้ `CacheService` กับข้อมูล static เช่น `Departments` และ `Users`
- ใช้ `LockService.getScriptLock().waitLock(30000)` กับ setup, create project, update task และ daily job
- Backend ทุก route คืนค่า JSON และมี try/catch ครอบเสมอ
