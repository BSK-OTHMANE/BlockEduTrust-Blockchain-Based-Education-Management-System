import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, ABI } from "../../constants/contract";

const API_URL = "http://127.0.0.1:8000";

function StudentsTab() {
  const [students, setStudents] = useState([]);
  const [expandedStudent, setExpandedStudent] = useState(null);
  const [addOpen, setAddOpen] = useState(true);

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
      <h3>Students</h3>

      <div className="card">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12}}>
          <h4 style={{margin:0}}>Add Student</h4>
          <div>
            <button className="btn-ghost" onClick={()=>setAddOpen(!addOpen)}>{addOpen? 'Collapse' : 'Expand'}</button>
          </div>
        </div>

        {addOpen && (
          <div className="form-row" style={{marginTop:12}}>
            <input
              placeholder="Student address"
              value={newStudentAddress}
              onChange={(e) => setNewStudentAddress(e.target.value)}
            />
            <input
              placeholder="Student name"
              value={newStudentName}
              onChange={(e) => setNewStudentName(e.target.value)}
            />
            <input
              placeholder="Student email"
              value={newStudentEmail}
              onChange={(e) => setNewStudentEmail(e.target.value)}
            />
            <button className="btn-primary" onClick={handleAddStudent} disabled={studentLoading}>
              {studentLoading ? "Adding..." : "Add Student"}
            </button>
          </div>
        )}
      </div>

      {/* ============================
            SHOW STUDENTS (visualization)
      ============================ */}
      <div style={{marginTop:18}}>
        <h4>All Students</h4>
        <div className="prof-grid">
          {students.map((student) => {
            const enrolledModules = studentModules[student.address] || [];
            const enrolledIds = enrolledModules.map((m) => Number(m.id));
            const availableModules = modules.filter(
              (mod) => !enrolledIds.includes(Number(mod.id))
            );

            const initials = 'S';

            return (
              <div key={student.address} className="prof-card">
                <div className="prof-head">
                  <div className="avatar">{initials}</div>
                  <div className="prof-meta">
                    <div className="prof-name">Name: {student.name}</div>
                    <div className="prof-address">Address: {student.address}</div>
                  </div>
                </div>

                <div className="prof-stats">
                  <div className="stat">Enrolled: {enrolledModules.length}</div>
                </div>

                <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                  {enrolledModules.slice(0,3).map((m)=> (
                    <div key={m.id} className="module-chip-mini">#{Number(m.id)} {m.name}</div>
                  ))}

                  {enrolledModules.length>3 && (
                    <div className="module-chip-mini">+{enrolledModules.length-3} more</div>
                  )}
                </div>

                <div style={{display:'flex',justifyContent:'flex-end',gap:8}}>
                  <button className="btn-ghost" onClick={()=>setExpandedStudent(expandedStudent===student.address?null:student.address)}>
                    {expandedStudent===student.address? 'Hide' : 'Details'}
                  </button>
                  <button className="btn-primary" onClick={()=>{ setExpandedStudent(student.address); }}>
                    Manage
                  </button>
                </div>

                {expandedStudent === student.address && (
                  <div className="card" style={{ marginTop: "12px" }}>
                    <h4 style={{marginTop:0}}>Enrolled Modules</h4>

                    {enrolledModules.length === 0 && <p>No modules enrolled</p>}

                    {enrolledModules.map((mod) => (
                      <div key={mod.id} className="module-chip">
                        <div className="module-left">
                          <div className="module-id">#{Number(mod.id)}</div>
                          <div className="module-name">{mod.name}</div>
                        </div>

                        <div className="module-actions">
                          <button className="btn-ghost" onClick={() => removeStudentFromModule(student.address, mod.id)}>
                            Remove
                          </button>
                          <button className="btn-danger" onClick={() => removeStudentFromModule(student.address, mod.id)} title="Remove module">
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}

                    <hr />

                    <h4 style={{marginBottom:8}}>Enroll in Module</h4>

                    {availableModules.length === 0 ? (
                      <p>Student already enrolled in all modules</p>
                    ) : (
                      <div className="form-row" style={{alignItems:'center'}}>
                        <div style={{flex:1,display:'flex',gap:12}}>
                          <select
                            value={selectedModules[student.address] || ""}
                            onChange={(e) =>
                              setSelectedModules({
                                ...selectedModules,
                                [student.address]: e.target.value
                              })
                            }
                          >
                            <option value="">Select module</option>
                            {availableModules.map((mod) => (
                              <option key={mod.id} value={mod.id.toString()}>
                                #{Number(mod.id)} — {mod.name}
                              </option>
                            ))}
                          </select>
                          <small style={{color:'var(--muted)',alignSelf:'center'}}>Available modules: {availableModules.length}</small>
                        </div>

                        <button
                          className="btn-primary"
                          onClick={() => enrollStudent(student.address)}
                          disabled={!selectedModules[student.address]}
                          title={!selectedModules[student.address] ? 'Select a module first' : 'Enroll student'}
                        >
                          Enroll
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {students.length === 0 && <p style={{marginTop:12,textAlign:'center',color:'var(--muted)'}}>No students found</p>}
    </div>
  );
}

export default StudentsTab;
