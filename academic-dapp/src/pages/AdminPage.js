import { useState } from "react";
import "./Page.css";

import AdminsTab from "../components/admin/AdminsTab";
import ProfessorsTab from "../components/admin/ProfessorsTab";
import StudentsTab from "../components/admin/StudentsTab";

function AdminPage() {
  const [activeTab, setActiveTab] = useState("admins");

  return (
    <div className="admin-page">
      <h2>Admin Dashboard</h2>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={activeTab === "admins" ? "active" : ""}
          onClick={() => setActiveTab("admins")}
        >
          Admins
        </button>

        <button
          className={activeTab === "professors" ? "active" : ""}
          onClick={() => setActiveTab("professors")}
        >
          Professors
        </button>

        <button
          className={activeTab === "students" ? "active" : ""}
          onClick={() => setActiveTab("students")}
        >
          Students
        </button>
      </div>

      {/* Content */}
      <div className="tab-content">
        {activeTab === "admins" && <AdminsTab />}
        {activeTab === "professors" && <ProfessorsTab />}
        {activeTab === "students" && <StudentsTab />}
      </div>
    </div>
  );
}

export default AdminPage;
