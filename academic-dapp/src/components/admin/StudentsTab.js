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

      {/* ADD STUDENT */}
      <div style={{ marginBottom: "25px" }}>
        <h4>Add Student</h4>
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
        <button onClick={handleAddStudent} disabled={studentLoading}>
          {studentLoading ? "Adding..." : "Add Student"}
        </button>
      </div>

      {/* LIST STUDENTS */}
      {students.map((student) => {
        const enrolledModules = studentModules[student.address] || [];
        const enrolledIds = enrolledModules.map((m) => Number(m.id));

        const availableModules = modules.filter(
          (mod) => !enrolledIds.includes(Number(mod.id))
        );

        return (
          <div
            key={student.address}
            style={{
              border: "1px solid #ccc",
              padding: "10px",
              marginBottom: "15px"
            }}
          >
            <div
              style={{ cursor: "pointer", fontWeight: "bold" }}
              onClick={() => {
                setExpandedStudent(
                  expandedStudent === student.address
                    ? null
                    : student.address
                );
                fetchStudentModules(student.address);
              }}
            >
              {student.name} — {student.address}
            </div>

            {expandedStudent === student.address && (
              <div style={{ marginTop: "10px" }}>
                <h4>Enrolled Modules</h4>

                {enrolledModules.length === 0 && <p>No modules enrolled</p>}

                {enrolledModules.map((mod) => (
                  <div key={mod.id}>
                    #{Number(mod.id)} — {mod.name}
                    <button
                      style={{ marginLeft: "10px" }}
                      onClick={() =>
                        removeStudentFromModule(student.address, mod.id)
                      }
                    >
                      Remove
                    </button>
                  </div>
                ))}

                <hr />

                <h4>Enroll in Module</h4>

                {availableModules.length === 0 ? (
                  <p>Student already enrolled in all modules</p>
                ) : (
                  <>
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

                    <button
                      style={{ marginLeft: "10px" }}
                      onClick={() => enrollStudent(student.address)}
                    >
                      Enroll
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}

      {students.length === 0 && <p>No students found</p>}
    </div>
  );
}

export default StudentsTab;
