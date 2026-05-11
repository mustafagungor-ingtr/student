import { useEffect, useMemo, useState } from 'react'
import { Alert, Badge, Container, Form, Navbar, Nav, Spinner, Table } from 'react-bootstrap'
import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

function Dashboard({ students }) {
  const totalCount = students.length
  const presentCount = students.filter((student) => student.isPresent).length

  return (
    <div className="page-content">
      <h1>Öğrenci Yoklama Sistemi</h1>
      <p className="lead">React Bootstrap arayüzü ve PostgreSQL destekli backend ile yoklama takibi.</p>
      <div className="summary-grid">
        <div className="summary-card">
          <h2>Toplam Öğrenci</h2>
          <strong>{totalCount}</strong>
        </div>
        <div className="summary-card">
          <h2>Derste Olan</h2>
          <strong>{presentCount}</strong>
        </div>
      </div>
    </div>
  )
}

function AttendancePage({ students, loading, error, onToggle }) {
  return (
    <div className="page-content">
      <h1>Öğrenci Listesi ve Yoklama</h1>
      <p className="lead">Grid üzerinde seçerek öğrencilerin derste olup olmadığını işaretleyin.</p>
      {error && <Alert variant="danger">{error}</Alert>}
      {loading ? (
        <div className="loading-box">
          <Spinner animation="border" />
        </div>
      ) : (
        <Table responsive bordered hover className="attendance-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Öğrenci Adı</th>
              <th>Durum</th>
              <th>Yoklama</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.id}>
                <td>{student.id}</td>
                <td>{student.fullName}</td>
                <td>
                  <Badge bg={student.isPresent ? 'success' : 'secondary'}>
                    {student.isPresent ? 'Burada' : 'Yok'}
                  </Badge>
                </td>
                <td>
                  <Form.Check
                    type="checkbox"
                    id={`attendance-${student.id}`}
                    checked={student.isPresent}
                    onChange={(event) => onToggle(student.id, event.target.checked)}
                    label="Katıldı"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  )
}

function App() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadStudents() {
      try {
        setLoading(true)
        const response = await fetch(`${API_URL}/api/students`)
        if (!response.ok) {
          throw new Error('Öğrenci listesi alınamadı.')
        }
        const payload = await response.json()
        setStudents(payload)
        setError('')
      } catch {
        setError('Backend bağlantısı kurulamadı. API servisinin çalıştığını kontrol edin.')
      } finally {
        setLoading(false)
      }
    }

    loadStudents()
  }, [])

  const presentCount = useMemo(
    () => students.filter((student) => student.isPresent).length,
    [students],
  )

  async function handleAttendanceToggle(studentId, isPresent) {
    const previousStudents = students
    setStudents((currentStudents) =>
      currentStudents.map((student) =>
        student.id === studentId ? { ...student, isPresent } : student,
      ),
    )

    try {
      const response = await fetch(`${API_URL}/api/students/${studentId}/attendance`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPresent }),
      })

      if (!response.ok) {
        throw new Error('Yoklama güncellenemedi.')
      }
    } catch {
      setStudents(previousStudents)
      setError('Yoklama güncellemesi başarısız oldu.')
    }
  }

  return (
    <>
      <Navbar bg="dark" variant="dark" expand="sm" className="mb-4">
        <Container>
          <Navbar.Brand>Student App</Navbar.Brand>
          <Nav className="ms-auto">
            <Nav.Link as={NavLink} to="/" end>
              Anasayfa
            </Nav.Link>
            <Nav.Link as={NavLink} to="/yoklama">
              Yoklama
            </Nav.Link>
          </Nav>
        </Container>
      </Navbar>

      <Container className="pb-5">
        <Alert variant="info">
          Bugünkü yoklama: <strong>{presentCount}</strong> öğrenci derste.
        </Alert>
        <Routes>
          <Route path="/" element={<Dashboard students={students} />} />
          <Route
            path="/yoklama"
            element={
              <AttendancePage
                students={students}
                loading={loading}
                error={error}
                onToggle={handleAttendanceToggle}
              />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Container>
    </>
  )
}

export default App
