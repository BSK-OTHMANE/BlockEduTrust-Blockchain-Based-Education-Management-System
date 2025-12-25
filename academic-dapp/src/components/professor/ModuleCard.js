// src/components/professor/ModuleCard.js
import { useState } from "react";
import MaterialsPanel from "./MaterialsPanel";
import AssignmentsPanel from "./AssignmentsPanel";
import GradesPanel from "./GradesPanel";

function ModuleCard({ module }) {
  const [activeTab, setActiveTab] = useState("materials");
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(null);

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

      {/* Tabs */}
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

        <button
          className={activeTab === "grades" ? "active" : ""}
          onClick={() => setActiveTab("grades")}
        >
          Grades
        </button>
      </div>

      {/* Content */}
      <div className="tab-content">
        {activeTab === "materials" && (
          <MaterialsPanel moduleId={module.id} />
        )}

        {activeTab === "assignments" && (
          <AssignmentsPanel
            moduleId={module.id}
            onSelectAssignment={(id) => {
              setSelectedAssignmentId(id);
              setActiveTab("grades"); // 🔥 auto jump to grades
            }}
          />
        )}

        {activeTab === "grades" && (
          selectedAssignmentId ? (
            <GradesPanel
              moduleId={module.id}
              assignmentId={selectedAssignmentId}
            />
          ) : (
            <p>Please select an assignment first.</p>
          )
        )}
      </div>
    </div>
  );
}

export default ModuleCard;
