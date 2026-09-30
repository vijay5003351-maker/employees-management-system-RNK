# Employee Activity Monitoring - Project Analysis

## 1. Purpose

This project is an employee administration and monitoring application. It provides employee management, project assignment, meeting-room booking, attendance tracking through face recognition, and dashboards for administrators, managers, and employees.

## 2. Technology Stack

| Layer | Technology | Purpose |
| --- | --- | --- |
| Frontend | React 19, Vite, React Router, Bootstrap | Web interface and dashboard routing |
| Backend | Node.js, Express 5, Mongoose | REST API and MongoDB access |
| Database | MongoDB | Employees, projects, room bookings, and recognition attendance records |
| AI service | Python, Flask, OpenCV, `face_recognition` | Face detection and recognition |
| Browser AI | TensorFlow.js and COCO-SSD | Intended phone/object detection for activity monitoring |
| Deployment | Docker Compose | Starts the frontend and Node.js backend containers |

## 3. Application Roles

### Administrator

The administrator interface is available under `/aside` and includes:

- Dashboard with employee, project, and present-attendance counts.
- Add, edit, list, and delete employees.
- Create, list, assign, and delete projects.
- Book, list, and delete meeting-room reservations.
- Face-recognition attendance screen.
- Activity-monitoring screen.
- Local to-do list.

### Manager

The manager interface is available under `/manageraside` and includes:

- Dashboard.
- List of assigned projects.
- List of booked meeting rooms.
- Local to-do list.

### Employee

The employee interface is available under `/userAside` and includes:

- Dashboard.
- List of assigned projects.
- List of booked meeting rooms.
- Local to-do list.

## 4. Main User Activities

### 4.1 Login

1. A user enters an email address and password on the login page.
2. The frontend sends a request to `POST /fun/login`.
3. The backend searches the `Admin` collection and returns `userType: "admin"` when the password matches.
4. The frontend navigates an administrator to `/aside`.

### 4.2 Add an Employee

1. The administrator completes personal, contact, address, status, and role fields.
2. The administrator uploads exactly three face images.
3. The frontend submits multipart form data to `POST /api/add-employee`.
4. The backend stores employee data and image buffers in MongoDB.
5. The backend starts two background scripts:
   - `extractImages.js` rebuilds the face-image dataset from MongoDB.
   - `generate_encodings.py` generates face encodings in `face_recognition/encodings.json`.

### 4.3 Maintain Employees

- `GET /fun/alluser` loads all employees.
- `POST /fun/update` updates an employee.
- `DELETE /fun/employee/:id` removes an employee.

The employee list shows basic profile details, role, status, and action buttons for editing and deletion.

### 4.4 Create and Assign a Project

1. The administrator creates a project with its title, manager, start date, and end date.
2. The project is saved through `POST /fun/project`.
3. The administrator selects the project and chooses one or more employees.
4. Assignment data is saved through `POST /project/assignproject`.
5. The frontend calls `POST /project/notify-manager-and-employees`.

The notification endpoint currently logs messages only; no email, SMS, push notification, or persistent notification is sent.

### 4.5 Book a Meeting Room

1. The administrator provides project head, room, reason, date, start time, end time, and any additional requirement.
2. The frontend submits `POST /project/room-booking`.
3. Bookings are shown through `GET /project/all-booked-rooms`.
4. A booking can be deleted using `DELETE /project/booked-room/:id`.

### 4.6 Face Attendance

1. The administrator starts the device camera from the attendance screen.
2. The frontend captures a video frame every three seconds.
3. Each frame is sent to `POST /api/face-recognize`.
4. Express forwards the image to the Flask service at `http://127.0.0.1:5001/api/face-recognize`.
5. Flask compares detected faces against the saved encodings and returns names and face boxes.
6. Express stores a recognition event in the `Attendance` collection, avoiding duplicate entries within one minute.
7. The frontend marks the identified employee present through `PUT /project/attendance/:id`.

The screen also displays detected names, camera overlays, face boxes, and All/Present/Absent employee filters.

### 4.7 Activity Monitoring

The intended activity-monitoring functionality includes:

- Camera session timer and idle-time counter.
- Face presence and multiple-face detection.
- Looking-away detection.
- Prolonged eye-closure detection.
- Phone detection with the TensorFlow COCO-SSD model.
- Focus percentage, confidence values, warning messages, and a recent event list.

## 5. Backend API Reference

| Method | Endpoint | Function |
| --- | --- | --- |
| GET | `/ping` | Node.js health check |
| POST | `/fun/login` | Administrator login |
| GET | `/fun/alluser` | Fetch employees |
| POST | `/fun/update` | Update an employee |
| DELETE | `/fun/employee/:id` | Delete an employee |
| POST | `/fun/project` | Create a project |
| GET | `/fun/allprojects` | Fetch projects |
| DELETE | `/fun/project/:id` | Delete a project |
| POST | `/api/add-employee` | Add employee and initiate face-model update |
| POST | `/project/assignproject` | Assign employees to a project |
| GET | `/project/assignedprojects` | Fetch project assignments |
| PUT | `/project/attendance/:id` | Set employee presence status |
| POST | `/project/room-booking` | Create a room booking |
| GET | `/project/all-booked-rooms` | Fetch room bookings |
| GET | `/project/booked-rooms` | Fetch room bookings for dashboards |
| DELETE | `/project/booked-room/:id` | Delete a booking |
| POST | `/project/notify-manager-and-employees` | Log assignment notification messages |
| POST | `/api/face-recognize` | Forward frame to Python face recognition and save recognition events |
| GET | `/api/face-recognize/latest` | Fetch recognition attendance records |

## 6. Database Models

### Employee

Stores first and last name, email, password, phone, date of birth, username, gender, address, face-image buffers, employment status, role, creation date, and `isPresent`.

### Project Assignment

Stores project name, manager name, start/end dates, and selected employee names.

### Room Booking

Stores project head, selected room, purpose, booking date, start/end times, and optional requirements.

### Recognition Attendance

Stores the recognized employee name and recognition time.

## 7. Important Current Limitations

1. **Activity Monitoring is disabled.** In `ActivityMonitoring.jsx`, the camera-start function and the Start button handler are commented out. The screen UI appears, but monitoring cannot start.
2. **Authentication is incomplete.** There is no JWT, session cookie, route guard, or backend authorization check. Dashboard routes can be opened directly.
3. **Only admin login is implemented.** The frontend contains manager and employee routes, but the backend login endpoint only authenticates an `Admin` record and returns `userType: "admin"`.
4. **Password handling is inconsistent.** Employee records hash passwords before saving, while the login route performs a direct string comparison for admin passwords. Password verification should use `bcrypt.compare`.
5. **Attendance state can toggle incorrectly.** The frontend toggles presence every time a recognized face is scanned. A repeated scan may mark a present employee absent.
6. **Attendance UI image access is inconsistent.** Employee images are stored as `images`, but some UI code reads `emp.image`, so employee photos may not display.
7. **Notifications are placeholders.** The notification endpoint only writes to the backend console.
8. **Docker is incomplete for the whole system.** `docker-compose.yaml` starts only the client and backend. MongoDB and the Flask recognition service must be started separately.
9. **No automated tests are implemented.** The backend test script intentionally exits with an error, and no test suite is present.
10. **Face-image processing uses background shell commands without completion handling.** The employee API response returns before image extraction and encoding generation finish.

## 8. Important Source Files

| Area | File |
| --- | --- |
| Express server | `backend/app.js` |
| Admin and employee APIs | `backend/Routes/adminRoutes.js` |
| Employee upload and face-model update | `backend/Routes/addEmployeeRoute.js` |
| Projects, attendance, and rooms | `backend/Routes/projectRoutes.js` |
| Face-recognition proxy | `backend/Routes/faceRecognitionRoute.js` |
| Shared frontend state | `client/src/Context/AdminContext/Datacontext.jsx` |
| Project, attendance, and navigation state | `client/src/Context/AdminContext/AnotherContext.jsx` |
| Attendance UI | `client/src/Components/Admin-Dashboard/pages/Attendance.jsx` |
| Activity-monitoring UI | `client/src/Components/Admin-Dashboard/pages/ActivityMonitoring.jsx` |
| Flask face-recognition API | `face_recognition/app.py` |
| Encoding generator | `face_recognition/generate_encodings.py` |

## 9. Recommended Next Improvements

1. Implement JWT authentication, protected frontend routes, and role-based backend authorization.
2. Enable and complete activity monitoring, including consent and privacy controls.
3. Replace attendance toggling with an idempotent operation that always sets `isPresent: true` for recognized employees.
4. Add manager and employee authentication with secure password verification.
5. Run MongoDB and the Flask service as Docker Compose services.
6. Add validation for dates, room conflicts, email uniqueness errors, and uploaded image content.
7. Replace console-only notifications with a real notification provider.
8. Add unit, API, and end-to-end tests for the critical workflows.
