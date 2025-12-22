import { BrowserRouter, Routes, Route } from "react-router-dom";
import ConnectPage from "./pages/ConnectPage";
import AdminPage from "./pages/AdminPage";
import ProfessorPage from "./pages/ProfessorPage";
import StudentPage from "./pages/StudentPage";
import NoRolePage from "./pages/NoRolePage";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ConnectPage />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRole={1}>
              <AdminPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/professor"
          element={
            <ProtectedRoute allowedRole={2}>
              <ProfessorPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student"
          element={
            <ProtectedRoute allowedRole={3}>
              <StudentPage />
            </ProtectedRoute>
          }
        />

        <Route path="/norole" element={<NoRolePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
