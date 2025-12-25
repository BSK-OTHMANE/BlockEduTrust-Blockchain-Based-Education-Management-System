// src/components/student/StudentModuleCard.js
import { useState } from "react";
import StudentMaterialsPanel from "./StudentMaterialsPanel";
import StudentAssignmentsPanel from "./StudentAssignmentsPanel";

function StudentModuleCard({ module }) {
  const [activeTab, setActiveTab] = useState("materials");

  return (
    <div
      style={{
        border: "1px solid #ccc",
        padding: "15px",
        marginBottom: "20px"
      }}
    >
      <h3>
        #{Number(module.id)} — {module.name}
      </h3>

      <div className="tabs">
        <button
          className={activeTab === "materials" ? "active" : ""}
          onClick={() => setActiveTab("materials")}
        >
          Materials
        </button>

        <button
          className={activeTab === "assignments" ? "active" : ""}
          onClick={() => setActiveTab("assignments")}
        >
          Assignments
        </button>
      </div>

      <div className="tab-content">
        {activeTab === "materials" && (
          <StudentMaterialsPanel moduleId={module.id} />
        )}

        {activeTab === "assignments" && (
          <StudentAssignmentsPanel moduleId={module.id} />
        )}
      </div>
    </div>
  );
}

export default StudentModuleCard;
