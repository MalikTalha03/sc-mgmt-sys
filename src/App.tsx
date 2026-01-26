import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import { Sidebar } from "./components/sidebar";
import StudentPage from "./pages/student";
import TeacherPage from "./pages/teacher";
import AdminPage from "./pages/admin";
import CoursesPage from "./pages/courses";
import DepartmentsPage from "./pages/departments";
import GradesPage from "./pages/grades";

function App() {
  return (
    <BrowserRouter>
      <Sidebar />
      <main className="ml-64 transition-all duration-300 min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-8">
        <Routes>
          <Route path="/" element={<AdminPage />} />
          <Route path="/student" element={<StudentPage />} />
          <Route path="/teacher" element={<TeacherPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/departments" element={<DepartmentsPage />} />
          <Route path="/teacher/:courseId/grades" element={<GradesPage />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;
