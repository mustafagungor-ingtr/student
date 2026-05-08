import { useEffect, useMemo, useState } from 'react'
import './App.css'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.message || 'İstek başarısız.')
  }

  return data
}

const initialStudentForm = {
  full_name: '',
  school: '',
  class_name: '',
  phone: '',
  parent_name: '',
  parent_phone: '',
  course_id: '',
  subcourse_id: '',
  lesson_hour: '',
}

const initialTeacherForm = { full_name: '', email: '', password: '', phone: '' }

function App() {
  const [user, setUser] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [loginForm, setLoginForm] = useState({ email: 'admin@example.com', password: 'admin123' })
  const [studentForm, setStudentForm] = useState(initialStudentForm)
  const [teacherForm, setTeacherForm] = useState(initialTeacherForm)
  const [subcourseForm, setSubcourseForm] = useState({ course_id: '', name: '' })
  const [assignmentForm, setAssignmentForm] = useState({ teacher_id: '', student_id: '' })
  const [attendanceForm, setAttendanceForm] = useState({ student_id: '', attended_on: '', status: true, notes: '' })
  const [homeworkForm, setHomeworkForm] = useState({ student_id: '', title: '', description: '', due_date: '' })
  const [commentForm, setCommentForm] = useState({ student_id: '', comment: '' })

  const [courses, setCourses] = useState([])
  const [students, setStudents] = useState([])
  const [teachers, setTeachers] = useState([])
  const [attendance, setAttendance] = useState([])
  const [homeworks, setHomeworks] = useState([])
  const [comments, setComments] = useState([])

  const selectedCourse = useMemo(
    () => courses.find((course) => String(course.id) === String(studentForm.course_id)),
    [courses, studentForm.course_id],
  )

  const isAdmin = user?.role === 'admin'

  const setNotice = (message, isError = false) => {
    if (isError) {
      setError(message)
      setSuccess('')
      return
    }
    setSuccess(message)
    setError('')
  }

  const refreshAll = async () => {
    const [coursesData, studentsData, teachersData, attendanceData, homeworksData, commentsData] = await Promise.all([
      apiFetch('/courses'),
      apiFetch('/students'),
      apiFetch('/teachers'),
      apiFetch('/attendance'),
      apiFetch('/homeworks'),
      apiFetch('/comments'),
    ])

    setCourses(coursesData.courses || [])
    setStudents(studentsData.students || [])
    setTeachers(teachersData.teachers || [])
    setAttendance(attendanceData.attendance || [])
    setHomeworks(homeworksData.homeworks || [])
    setComments(commentsData.comments || [])
  }

  useEffect(() => {
    apiFetch('/me')
      .then(async (data) => {
        setUser(data.user)
        await refreshAll()
      })
      .catch(() => {
        setUser(null)
      })
  }, [])

  const onSubmitLogin = async (event) => {
    event.preventDefault()
    try {
      const data = await apiFetch('/login', {
        method: 'POST',
        body: JSON.stringify(loginForm),
      })
      setUser(data.user)
      await refreshAll()
      setNotice('Giriş başarılı.')
    } catch (e) {
      setNotice(e.message, true)
    }
  }

  const onLogout = async () => {
    await apiFetch('/logout', { method: 'POST' })
    setUser(null)
    setNotice('Çıkış yapıldı.')
  }

  const createTeacher = async (event) => {
    event.preventDefault()
    try {
      await apiFetch('/teachers', { method: 'POST', body: JSON.stringify(teacherForm) })
      setTeacherForm(initialTeacherForm)
      await refreshAll()
      setNotice('Öğretmen eklendi.')
    } catch (e) {
      setNotice(e.message, true)
    }
  }

  const createSubcourse = async (event) => {
    event.preventDefault()
    try {
      await apiFetch('/subcourses', { method: 'POST', body: JSON.stringify(subcourseForm) })
      setSubcourseForm({ course_id: '', name: '' })
      await refreshAll()
      setNotice('Alt ders eklendi.')
    } catch (e) {
      setNotice(e.message, true)
    }
  }

  const createStudent = async (event) => {
    event.preventDefault()
    try {
      await apiFetch('/students', { method: 'POST', body: JSON.stringify(studentForm) })
      setStudentForm(initialStudentForm)
      await refreshAll()
      setNotice('Öğrenci eklendi.')
    } catch (e) {
      setNotice(e.message, true)
    }
  }

  const assignTeacher = async (event) => {
    event.preventDefault()
    try {
      await apiFetch('/teacher-assignments', { method: 'POST', body: JSON.stringify(assignmentForm) })
      setAssignmentForm({ teacher_id: '', student_id: '' })
      await refreshAll()
      setNotice('Öğretmen ataması kaydedildi.')
    } catch (e) {
      setNotice(e.message, true)
    }
  }

  const createAttendance = async (event) => {
    event.preventDefault()
    try {
      await apiFetch('/attendance', { method: 'POST', body: JSON.stringify(attendanceForm) })
      setAttendanceForm({ student_id: '', attended_on: '', status: true, notes: '' })
      await refreshAll()
      setNotice('Yoklama eklendi.')
    } catch (e) {
      setNotice(e.message, true)
    }
  }

  const createHomework = async (event) => {
    event.preventDefault()
    try {
      await apiFetch('/homeworks', { method: 'POST', body: JSON.stringify(homeworkForm) })
      setHomeworkForm({ student_id: '', title: '', description: '', due_date: '' })
      await refreshAll()
      setNotice('Ödev eklendi.')
    } catch (e) {
      setNotice(e.message, true)
    }
  }

  const createComment = async (event) => {
    event.preventDefault()
    try {
      await apiFetch('/comments', { method: 'POST', body: JSON.stringify(commentForm) })
      setCommentForm({ student_id: '', comment: '' })
      await refreshAll()
      setNotice('Yorum eklendi.')
    } catch (e) {
      setNotice(e.message, true)
    }
  }

  if (!user) {
    return (
      <main className="container">
        <h1>Öğrenci Takip Uygulaması</h1>
        <form onSubmit={onSubmitLogin} className="card form-grid">
          <h2>Giriş</h2>
          <input
            value={loginForm.email}
            onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
            placeholder="E-posta"
            required
          />
          <input
            type="password"
            value={loginForm.password}
            onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
            placeholder="Şifre"
            required
          />
          <button type="submit">Giriş Yap</button>
          {error && <p className="error">{error}</p>}
        </form>
      </main>
    )
  }

  return (
    <main className="container">
      <header className="topbar">
        <div>
          <h1>Öğrenci Takip Uygulaması</h1>
          <p>
            {user.full_name} ({user.role})
          </p>
        </div>
        <button onClick={onLogout}>Çıkış</button>
      </header>

      {success && <p className="success">{success}</p>}
      {error && <p className="error">{error}</p>}

      {isAdmin && (
        <section className="grid-two">
          <form onSubmit={createTeacher} className="card form-grid">
            <h2>Öğretmen Ekle</h2>
            <input placeholder="Ad Soyad" value={teacherForm.full_name} onChange={(e) => setTeacherForm({ ...teacherForm, full_name: e.target.value })} required />
            <input placeholder="E-posta" value={teacherForm.email} onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })} required />
            <input placeholder="Şifre" type="password" value={teacherForm.password} onChange={(e) => setTeacherForm({ ...teacherForm, password: e.target.value })} required />
            <input placeholder="Telefon" value={teacherForm.phone} onChange={(e) => setTeacherForm({ ...teacherForm, phone: e.target.value })} />
            <button type="submit">Öğretmeni Kaydet</button>
          </form>

          <form onSubmit={createSubcourse} className="card form-grid">
            <h2>Alt Ders Ekle</h2>
            <select value={subcourseForm.course_id} onChange={(e) => setSubcourseForm({ ...subcourseForm, course_id: e.target.value })} required>
              <option value="">Ders Seçin</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>{course.name}</option>
              ))}
            </select>
            <input placeholder="Alt ders adı" value={subcourseForm.name} onChange={(e) => setSubcourseForm({ ...subcourseForm, name: e.target.value })} required />
            <button type="submit">Alt Dersi Kaydet</button>
          </form>
        </section>
      )}

      <section className="grid-two">
        <form onSubmit={createStudent} className="card form-grid">
          <h2>Öğrenci Ekle</h2>
          <input placeholder="İsim Soyisim" value={studentForm.full_name} onChange={(e) => setStudentForm({ ...studentForm, full_name: e.target.value })} required />
          <input list="schools" placeholder="Okul (seç veya yaz)" value={studentForm.school} onChange={(e) => setStudentForm({ ...studentForm, school: e.target.value })} />
          <datalist id="schools">
            <option value="Anadolu Lisesi" />
            <option value="İmam Hatip Lisesi" />
            <option value="Ortaokul" />
          </datalist>
          <input list="classes" placeholder="Sınıf (seç veya yaz)" value={studentForm.class_name} onChange={(e) => setStudentForm({ ...studentForm, class_name: e.target.value })} />
          <datalist id="classes">
            <option value="5" /><option value="6" /><option value="7" /><option value="8" />
            <option value="9" /><option value="10" /><option value="11" /><option value="12" />
          </datalist>
          <input placeholder="Telefon" value={studentForm.phone} onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })} />
          <input placeholder="Veli Adı" value={studentForm.parent_name} onChange={(e) => setStudentForm({ ...studentForm, parent_name: e.target.value })} />
          <input placeholder="Veli Telefon" value={studentForm.parent_phone} onChange={(e) => setStudentForm({ ...studentForm, parent_phone: e.target.value })} />
          <select value={studentForm.course_id} onChange={(e) => setStudentForm({ ...studentForm, course_id: e.target.value, subcourse_id: '' })} required>
            <option value="">Ders Seçin</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>{course.name}</option>
            ))}
          </select>
          <select value={studentForm.subcourse_id} onChange={(e) => setStudentForm({ ...studentForm, subcourse_id: e.target.value })}>
            <option value="">Alt ders (opsiyonel)</option>
            {(selectedCourse?.subcourses || []).map((subcourse) => (
              <option key={subcourse.id} value={subcourse.id}>{subcourse.name}</option>
            ))}
          </select>
          <input list="hours" placeholder="Ders Saati (seç veya yaz)" value={studentForm.lesson_hour} onChange={(e) => setStudentForm({ ...studentForm, lesson_hour: e.target.value })} />
          <datalist id="hours">
            <option value="09:00-10:00" />
            <option value="10:00-11:00" />
            <option value="13:00-14:00" />
          </datalist>
          <button type="submit">Öğrenciyi Kaydet</button>
        </form>

        {isAdmin && (
          <form onSubmit={assignTeacher} className="card form-grid">
            <h2>Öğretmen Ata</h2>
            <select value={assignmentForm.teacher_id} onChange={(e) => setAssignmentForm({ ...assignmentForm, teacher_id: e.target.value })} required>
              <option value="">Öğretmen Seçin</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>{teacher.full_name}</option>
              ))}
            </select>
            <select value={assignmentForm.student_id} onChange={(e) => setAssignmentForm({ ...assignmentForm, student_id: e.target.value })} required>
              <option value="">Öğrenci Seçin</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>{student.full_name}</option>
              ))}
            </select>
            <button type="submit">Atamayı Kaydet</button>
          </form>
        )}
      </section>

      <section className="grid-three">
        <form onSubmit={createAttendance} className="card form-grid">
          <h2>Yoklama</h2>
          <select value={attendanceForm.student_id} onChange={(e) => setAttendanceForm({ ...attendanceForm, student_id: e.target.value })} required>
            <option value="">Öğrenci Seçin</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>{student.full_name}</option>
            ))}
          </select>
          <input type="date" value={attendanceForm.attended_on} onChange={(e) => setAttendanceForm({ ...attendanceForm, attended_on: e.target.value })} required />
          <select value={attendanceForm.status ? '1' : '0'} onChange={(e) => setAttendanceForm({ ...attendanceForm, status: e.target.value === '1' })}>
            <option value="1">Katıldı</option>
            <option value="0">Katılmadı</option>
          </select>
          <input placeholder="Not" value={attendanceForm.notes} onChange={(e) => setAttendanceForm({ ...attendanceForm, notes: e.target.value })} />
          <button type="submit">Yoklama Kaydet</button>
        </form>

        <form onSubmit={createHomework} className="card form-grid">
          <h2>Ödev Ver</h2>
          <select value={homeworkForm.student_id} onChange={(e) => setHomeworkForm({ ...homeworkForm, student_id: e.target.value })} required>
            <option value="">Öğrenci Seçin</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>{student.full_name}</option>
            ))}
          </select>
          <input placeholder="Ödev başlığı" value={homeworkForm.title} onChange={(e) => setHomeworkForm({ ...homeworkForm, title: e.target.value })} required />
          <textarea placeholder="Açıklama" value={homeworkForm.description} onChange={(e) => setHomeworkForm({ ...homeworkForm, description: e.target.value })} />
          <input type="date" value={homeworkForm.due_date} onChange={(e) => setHomeworkForm({ ...homeworkForm, due_date: e.target.value })} />
          <button type="submit">Ödevi Kaydet</button>
        </form>

        <form onSubmit={createComment} className="card form-grid">
          <h2>Öğrenci Yorumu</h2>
          <select value={commentForm.student_id} onChange={(e) => setCommentForm({ ...commentForm, student_id: e.target.value })} required>
            <option value="">Öğrenci Seçin</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>{student.full_name}</option>
            ))}
          </select>
          <textarea placeholder="Yorum" value={commentForm.comment} onChange={(e) => setCommentForm({ ...commentForm, comment: e.target.value })} required />
          <button type="submit">Yorum Kaydet</button>
        </form>
      </section>

      <section className="card">
        <h2>Öğrenciler</h2>
        <table>
          <thead>
            <tr>
              <th>Ad Soyad</th><th>Ders</th><th>Alt Ders</th><th>Ders Saati</th><th>Okul/Sınıf</th><th>Veli</th><th>Öğretmen</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.id}>
                <td>{student.full_name}</td>
                <td>{student.course_name}</td>
                <td>{student.subcourse_name || '-'}</td>
                <td>{student.lesson_hour || '-'}</td>
                <td>{student.school || '-'} / {student.class_name || '-'}</td>
                <td>{student.parent_name || '-'} ({student.parent_phone || '-'})</td>
                <td>{student.teachers || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="grid-three">
        <div className="card">
          <h2>Son Yoklamalar</h2>
          <ul>
            {attendance.slice(0, 8).map((item) => (
              <li key={item.id}>{item.student_name} - {item.attended_on} - {item.status ? 'Katıldı' : 'Yok'}</li>
            ))}
          </ul>
        </div>
        <div className="card">
          <h2>Son Ödevler</h2>
          <ul>
            {homeworks.slice(0, 8).map((item) => (
              <li key={item.id}>{item.student_name} - {item.title}</li>
            ))}
          </ul>
        </div>
        <div className="card">
          <h2>Son Yorumlar</h2>
          <ul>
            {comments.slice(0, 8).map((item) => (
              <li key={item.id}>{item.student_name} - {item.comment}</li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  )
}

export default App
