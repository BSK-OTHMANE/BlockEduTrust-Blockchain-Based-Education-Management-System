import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, ABI } from "../../constants/contract";

const API_URL = "http://127.0.0.1:8000";

function StudentsTab() {
  const [students, setStudents] = useState([]);
  const [expandedStudent, setExpandedStudent] = useState(null);

  // Add student
  const [newStudentAddress, setNewStudentAddress] = useState("");
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentEmail, setNewStudentEmail] = useState("");
  const [studentLoading, setStudentLoading] = useState(false);

  const [modules, setModules] = useState([]);

  // studentAddress -> [modules]
  const [studentModules, setStudentModules] = useState({});

  // per-student selected module
  const [selectedModules, setSelectedModules] = useState({});

  /* ============================
        CONTRACT INSTANCE
  ============================ */
  async function getContract() {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
  }

  /* ============================
        FETCH DATA
  ============================ */
  async function fetchStudents() {
    const res = await fetch(`${API_URL}/admin/users/?role=STUDENT`);
    const data = await res.json();
    setStudents(data);
  }

  async function fetchModules() {
    const contract = await getContract();
    const allModules = await contract.getAllModules();
    setModules(allModules);
  }

  useEffect(() => {
    fetchStudents();
    fetchModules();
  }, []);

  /* ============================
        FETCH STUDENT MODULES
  ============================ */
  async function fetchStudentModules(studentAddress) {
    const contract = await getContract();
    const enrolled = [];

    for (const mod of modules) {
      if (!mod.exists) continue;

      const studentsInModule = await contract.getStudentsByModule(
        Number(mod.id)
      );

      if (
        studentsInModule.some(
          (addr) => addr.toLowerCase() === studentAddress.toLowerCase()
        )
      ) {
        enrolled.push(mod);
      }
    }

    setStudentModules((prev) => ({
      ...prev,
      [studentAddress]: enrolled
    }));
  }

  /* ============================
        ADD STUDENT
  ============================ */
  async function handleAddStudent() {
    if (!newStudentAddress || !newStudentName || !newStudentEmail) {
      alert("Please fill all fields");
      return;
    }

    try {
      setStudentLoading(true);
      const contract = await getContract();

      const tx = await contract.addStudent(newStudentAddress);
      await tx.wait();

      await fetch(`${API_URL}/admin/users/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: newStudentAddress,
          role: "STUDENT",
          name: newStudentName,
          email: newStudentEmail
        })
      });

      setNewStudentAddress("");
      setNewStudentName("");
      setNewStudentEmail("");

      fetchStudents();
    } catch (err) {
      console.error(err);
      alert("Error adding student");
    } finally {
      setStudentLoading(false);
    }
  }

  async function handleRemoveStudent(e, studentAddress) {
  e.stopPropagation(); // prevent expand toggle

  if (!window.confirm("Remove this student completely?")) return;

  try {
    const contract = await getContract();

    // 1️⃣ Remove role on-chain
    const tx = await contract.removeStudent(studentAddress);
    await tx.wait();

    // 2️⃣ Remove from backend
    await fetch(`${API_URL}/admin/users/${studentAddress}`, {
      method: "DELETE"
    });

    fetchStudents();
  } catch (err) {
    console.error(err);
    alert("Failed to remove student");
  }
}


  /* ============================
        ENROLL STUDENT
  ============================ */
  async function enrollStudent(studentAddress) {
    const moduleId = selectedModules[studentAddress];
    if (!moduleId) {
      alert("Select a module");
      return;
    }

    try {
      const contract = await getContract();
      const tx = await contract.enrollStudentInModule(
        Number(moduleId),
        studentAddress
      );
      await tx.wait();

      fetchStudentModules(studentAddress);
      setSelectedModules({ ...selectedModules, [studentAddress]: "" });
    } catch (err) {
      console.error(err);
      alert("Error enrolling student");
    }
  }

  /* ============================
        REMOVE STUDENT FROM MODULE
  ============================ */
  async function removeStudentFromModule(studentAddress, moduleId) {
    try {
      const contract = await getContract();
      const tx = await contract.removeStudentFromModule(
        Number(moduleId),
        studentAddress
      );
      await tx.wait();

      fetchStudentModules(studentAddress);
    } catch (err) {
      console.error(err);
      alert("Error removing student from module");
    }
  }

  /* ============================
        RENDER
  ============================ */
  return (
    <div>
      <h3>Students Management</h3>

      {/* ADD STUDENT */}
      <div className="form-card">
        <h4>Add New Student</h4>
        <form onSubmit={(e) => { e.preventDefault(); handleAddStudent(); }}>
          <div className="form-group">
            <label>Wallet Address *</label>
            <input
              type="text"
              placeholder="0x742d35Cc6634C0532925a3b844Bc666B42999999"
              value={newStudentAddress}
              onChange={(e) => setNewStudentAddress(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Full Name *</label>
            <input
              type="text"
              placeholder="Alice Johnson"
              value={newStudentName}
              onChange={(e) => setNewStudentName(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Email Address *</label>
            <input
              type="email"
              placeholder="alice.johnson@student.university.edu"
              value={newStudentEmail}
              onChange={(e) => setNewStudentEmail(e.target.value)}
            />
          </div>
          <button type="submit" disabled={studentLoading} className="btn-primary">
            {studentLoading ? "Adding..." : "Add Student"}
          </button>
        </form>
      </div>

      {/* LIST STUDENTS */}
      {students.length === 0 ? (
        <div className="empty-state-card">
          <p>No students registered yet</p>
        </div>
      ) : (
        <div className="table-card">
          <h4>Students List</h4>
          {students.map((student) => {
            const enrolledModules = studentModules[student.address] || [];
            const enrolledIds = enrolledModules.map((m) => Number(m.id));

            const availableModules = modules.filter(
              (mod) => !enrolledIds.includes(Number(mod.id))
            );

            return (
              <div key={student.address} className="expandable-card">
                <div
                  className="expandable-header"
                  onClick={() => {
                    setExpandedStudent(
                      expandedStudent === student.address
                        ? null
                        : student.address
                    );
                    fetchStudentModules(student.address);
                  }}
                >
                  <span className="expand-icon">
                    {expandedStudent === student.address ? "▼" : "▶"}
                  </span>
                  <div className="prof-info">
                    <span className="prof-name">{student.name}</span>
                    <span className="prof-address">{student.address.substring(0, 10)}...{student.address.substring(student.address.length - 8)}</span>
                  </div>
                  <span className="prof-email">{student.email}</span>
                  <button
                  className="btn-danger-small"
                  onClick={(e) => handleRemoveStudent(e, student.address)}
                >
                  Remove
                </button>

                </div>

                {expandedStudent === student.address && (
                  <div className="expandable-content">
                    <div className="section">
                      <h5>Enrolled Modules ({enrolledModules.length})</h5>

                      {enrolledModules.length === 0 ? (
                        <p className="empty-message">Not enrolled in any module</p>
                      ) : (
                        <div className="module-list">
                          {enrolledModules.map((mod) => (
                            <div key={mod.id} className="module-item">
                              <span className="module-info">#{Number(mod.id)} — {mod.name}</span>
                              <button
                                className="btn-danger-small"
                                onClick={() =>
                                  removeStudentFromModule(student.address, mod.id)
                                }
                              >
                                Remove from Module
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="section">
                      <h5>Enroll in Module</h5>

                      {availableModules.length === 0 ? (
                        <p className="empty-message">Already enrolled in all modules</p>
                      ) : (
                        <div className="assign-module">
                          <select
                            value={selectedModules[student.address] || ""}
                            onChange={(e) =>
                              setSelectedModules({
                                ...selectedModules,
                                [student.address]: e.target.value
                              })
                            }
                          >
                            <option value="">Select module...</option>
                            {availableModules.map((mod) => (
                              <option key={mod.id} value={mod.id.toString()}>
                                #{Number(mod.id)} — {mod.name}
                              </option>
                            ))}
                          </select>
                          <button
                            className="btn-primary"
                            onClick={() => enrollStudent(student.address)}
                          >
                            Enroll
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default StudentsTab;
