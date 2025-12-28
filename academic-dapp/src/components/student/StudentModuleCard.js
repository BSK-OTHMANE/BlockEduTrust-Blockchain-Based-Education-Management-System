// src/components/student/StudentModuleCard.js
import { useState, useEffect } from "react";
import StudentMaterialsPanel from "./StudentMaterialsPanel";
import StudentAssignmentsPanel from "./StudentAssignmentsPanel";

const API_URL = "http://127.0.0.1:8000";

function StudentModuleCard({ module }) {
  const [expandedSections, setExpandedSections] = useState({
    materials: true,
    assignments: true
  });

  const [professorName, setProfessorName] = useState("Professor");
  const [professorEmail, setProfessorEmail] = useState("");
  const [loadingProfessor, setLoadingProfessor] = useState(true);

  /* ============================
        FETCH PROFESSOR INFO
  ============================ */
  useEffect(() => {
    async function fetchProfessorInfo() {
      try {
        setLoadingProfessor(true);

        // ✅ CORRECT ROLE (uppercase)
        const res = await fetch(
          `${API_URL}/admin/users?role=PROFESSOR`
        );

        const professors = await res.json();

        const prof = professors.find(
          (p) =>
            p.address &&
            p.address.toLowerCase() === module.professor.toLowerCase()
        );

        if (prof) {
          setProfessorName(prof.name || "Professor");
          setProfessorEmail(prof.email || "");
        }
      } catch (err) {
        console.error("Failed to fetch professor info:", err);
      } finally {
        setLoadingProfessor(false);
      }
    }

    if (module.professor && module.professor !== "0x0000000000000000000000000000000000000000") {
      fetchProfessorInfo();
    }
  }, [module.professor]);

  /* ============================
        TOGGLE SECTIONS
  ============================ */
  function toggleSection(section) {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section]
    }));
  }

  /* ============================
        RENDER
  ============================ */
  return (
    <div className="module-details">
      <h2 className="module-title">
        #{Number(module.id)} — {module.name}
      </h2>

      <p className="module-professor">
        Instructor:{" "}
        <strong>
          {loadingProfessor ? "Loading..." : professorName}
        </strong>
        {professorEmail && (
          <span className="professor-email"> • {professorEmail}</span>
        )}
      </p>

      {/* Materials */}
      <div className="collapsible-section">
        <button
          className="collapsible-header"
          onClick={() => toggleSection("materials")}
        >
          {expandedSections.materials ? "▼" : "▶"} 📚 Course Materials
        </button>

        {expandedSections.materials && (
          <div className="collapsible-content">
            <StudentMaterialsPanel moduleId={module.id} />
          </div>
        )}
      </div>

      {/* Assignments */}
      <div className="collapsible-section">
        <button
          className="collapsible-header"
          onClick={() => toggleSection("assignments")}
        >
          {expandedSections.assignments ? "▼" : "▶"} 📝 Assignments
        </button>

        {expandedSections.assignments && (
          <div className="collapsible-content">
            <StudentAssignmentsPanel moduleId={module.id} />
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentModuleCard;
