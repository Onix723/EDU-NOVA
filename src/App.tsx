import { AuthProvider, useAuth } from './contexts/AuthContext';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import TeacherLayout from './pages/Teacher/TeacherLayout';
import TeacherDashboard from './pages/Teacher/Dashboard';
import TeacherStudents from './pages/Teacher/Students';
import TeacherCourses from './pages/Teacher/Courses';
import TeacherGrades from './pages/Teacher/Grades';
import TeacherSettings from './pages/Teacher/Settings';
import TeacherQuizzes from './pages/Teacher/Quizzes';
import StudentLayout from './pages/Student/StudentLayout';
import StudentDashboard from './pages/Student/Dashboard';
import StudentCourses from './pages/Student/Courses';
import StudentGrades from './pages/Student/Grades';
import StudentProfile from './pages/Student/Profile';
import StudentQuiz from './pages/Student/Quiz';


function AppContent() {
  const { user, profile, loading, error } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-white text-2xl">Cargando...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-red-900/20 border border-red-500 text-red-200 p-6 rounded-2xl text-center max-w-md">
          <h2 className="text-xl font-bold mb-2">Error de Conexión</h2>
          <p className="text-sm mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={(!user || !profile) ? <Login /> : <Navigate to={profile.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard'} />} />
      
       <Route path="/teacher" element={user && profile?.role === 'teacher' ? <TeacherLayout /> : <Navigate to="/login" />}>
         <Route path="dashboard" element={<TeacherDashboard />} />
         <Route path="students" element={<TeacherStudents />} />
         <Route path="courses" element={<TeacherCourses />} />
        <Route path="grades" element={<TeacherGrades />} />
          <Route path="settings" element={<TeacherSettings />} />
          <Route path="quizzes" element={<TeacherQuizzes />} />
        </Route>

        <Route path="/student" element={user && profile?.role === 'student' ? <StudentLayout /> : <Navigate to="/login" />}>
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="courses" element={<StudentCourses />} />
          <Route path="grades" element={<StudentGrades />} />
          <Route path="profile" element={<StudentProfile />} />
          <Route path="quiz/:courseId" element={<StudentQuiz />} />
        </Route>
      
      <Route path="/" element={<Navigate to="/login" />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
