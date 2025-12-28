import { useState } from "react";
import "./Page.css";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import logo from "../BlockEduTrustLogo.png";

import AdminsTab from "../components/admin/AdminsTab";
import ProfessorsTab from "../components/admin/ProfessorsTab";
import StudentsTab from "../components/admin/StudentsTab";

function AdminPage() {
  const [activeSection, setActiveSection] = useState("admins");
  const { userName } = useAuth();
  const navigate = useNavigate();

  const handleDisconnect = () => {
    navigate("/");
  };

  return (
    <>
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-left">
          <img src={logo} alt="BlockEduTrust Logo" className="navbar-logo" />
          <div className="navbar-brand">
            <h2 className="navbar-title">BlockEduTrust</h2>
            <p className="navbar-welcome">Welcome, {userName || "Admin"}</p>
          </div>
        </div>
        <div className="navbar-right">
          <span className="role-badge admin">Administrator</span>
          <button className="disconnect-btn" onClick={handleDisconnect}>
            Disconnect
          </button>
        </div>
      </nav>

      {/* Page with Sidebar */}
      <div className="page-with-sidebar">
        {/* Sidebar */}
        <aside className="sidebar">
          <h3 className="sidebar-title">Admin Menu</h3>
          <nav className="sidebar-nav">
            <button
              className={`sidebar-item ${activeSection === "admins" ? "active" : ""}`}
              onClick={() => setActiveSection("admins")}
            >
              Admins
            </button>
            <button
              className={`sidebar-item ${activeSection === "professors" ? "active" : ""}`}
              onClick={() => setActiveSection("professors")}
            >
              Professors & Modules
            </button>
            <button
              className={`sidebar-item ${activeSection === "students" ? "active" : ""}`}
              onClick={() => setActiveSection("students")}
            >
              Students
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          <div className="admin-page">
            {activeSection === "admins" && <AdminsTab />}
            {activeSection === "professors" && <ProfessorsTab />}
            {activeSection === "students" && <StudentsTab />}
          </div>
        </main>
      </div>
    </>
  );
}

export default AdminPage;
