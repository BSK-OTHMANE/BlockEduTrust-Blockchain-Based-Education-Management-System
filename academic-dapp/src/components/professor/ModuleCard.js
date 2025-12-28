// src/components/professor/ModuleCard.js
import { useState } from "react";
import MaterialsPanel from "./MaterialsPanel";
import AssignmentsPanel from "./AssignmentsPanel";
import GradesPanel from "./GradesPanel";

function ModuleCard({ module }) {
  const [expandedSections, setExpandedSections] = useState({
    materials: true,
    assignments: true,
    grades: false
  });
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(null);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div className="module-details">
      <h2 className="module-title">
        #{Number(module.id)} — {module.name}
      </h2>

      {/* Collapsible Sections */}
      <div className="collapsible-sections">
        {/* Materials Section */}
        <div className="collapsible-section">
          <button
            className="collapsible-header"
            onClick={() => toggleSection("materials")}
          >
            <span className="toggle-icon">
              {expandedSections.materials ? "▼" : "▶"}
            </span>
            <span className="section-title">📚 Course Materials</span>
          </button>
          {expandedSections.materials && (
            <div className="collapsible-content">
              <MaterialsPanel moduleId={module.id} />
            </div>
          )}
        </div>

        {/* Assignments Section */}
        <div className="collapsible-section">
          <button
            className="collapsible-header"
            onClick={() => toggleSection("assignments")}
          >
            <span className="toggle-icon">
              {expandedSections.assignments ? "▼" : "▶"}
            </span>
            <span className="section-title">📝 Assignments</span>
          </button>
          {expandedSections.assignments && (
            <div className="collapsible-content">
              <AssignmentsPanel
                moduleId={module.id}
                onSelectAssignment={(id) => {
                  setSelectedAssignmentId(id);
                  setExpandedSections(prev => ({ ...prev, grades: true }));
                }}
              />
            </div>
          )}
        </div>

        {/* Grades Section */}
        <div className="collapsible-section">
          <button
            className="collapsible-header"
            onClick={() => toggleSection("grades")}
          >
            <span className="toggle-icon">
              {expandedSections.grades ? "▼" : "▶"}
            </span>
            <span className="section-title">📊 Grade Submissions</span>
          </button>
          {expandedSections.grades && (
            <div className="collapsible-content">
              {selectedAssignmentId ? (
                <GradesPanel
                  moduleId={module.id}
                  assignmentId={selectedAssignmentId}
                />
              ) : (
                <p className="empty-message">Please select an assignment to grade.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ModuleCard;
