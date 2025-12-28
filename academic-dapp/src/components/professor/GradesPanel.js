import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, ABI } from "../../constants/contract";
import { decryptWithPrivateKey } from "../../constants/crypto";

const API_URL = "http://127.0.0.1:8000";

function GradesPanel({ assignmentId, moduleId }) {
  const [submissions, setSubmissions] = useState([]);
  const [grades, setGrades] = useState({});
  const [notes, setNotes] = useState({});
  const [originalGrades, setOriginalGrades] = useState({});
  const [originalNotes, setOriginalNotes] = useState({});
  const [editing, setEditing] = useState({});
  const [loading, setLoading] = useState(false);

  const [assignmentTitle, setAssignmentTitle] = useState("");
  const [studentNames, setStudentNames] = useState({});
  const [privateKey, setPrivateKey] = useState("");
  const [decryptedCids, setDecryptedCids] = useState({});

  /* ============================
        CONTRACT
  ============================ */
  async function getContract() {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
  }

  /* ============================
        BACKEND DATA
  ============================ */
  async function fetchAssignmentTitle() {
    const res = await fetch(
      `${API_URL}/professor/assignments?moduleId=${moduleId}`
    );
    const data = await res.json();
    const found = data.find(
      (a) => Number(a.assignmentId) === Number(assignmentId)
    );
    setAssignmentTitle(found?.title || `Assignment #${assignmentId}`);
  }

  async function fetchStudentNames() {
    const res = await fetch(`${API_URL}/admin/users?role=STUDENT`);
    const students = await res.json();
    const map = {};
    students.forEach((s) => {
      map[s.address.toLowerCase()] = s.name;
    });
    setStudentNames(map);
  }

  /* ============================
        SUBMISSIONS
  ============================ */
  async function fetchSubmissions() {
    try {
      const contract = await getContract();
      const students = await contract.getStudentsByModule(Number(moduleId));

      const subs = [];
      const g = {};
      const n = {};

      for (const student of students) {
        const submission = await contract.submissions(
          Number(assignmentId),
          student
        );

        if (submission[0] !== ethers.ZeroAddress) {
          const grade = await contract.grades(
            Number(assignmentId),
            student
          );

          subs.push({
            studentAddress: student,
            encryptedCid: submission[1],
            graded: submission[2]
          });

          if (grade.value > 0 || grade.note !== "") {
            g[student] = grade.value.toString();
            n[student] = grade.note;
          }
        }
      }

      setSubmissions(subs);
      setGrades(g);
      setNotes(n);
      setOriginalGrades(g);
      setOriginalNotes(n);
    } catch (err) {
      console.error(err);
      alert("Error loading submissions");
    }
  }

  useEffect(() => {
    if (assignmentId && moduleId) {
      fetchAssignmentTitle();
      fetchStudentNames();
      fetchSubmissions();
    }
  }, [assignmentId, moduleId]);

  /* ============================
        DECRYPT
  ============================ */
async function handleDecrypt(studentAddress, encryptedCid) {
  if (!privateKey) {
    alert("Please paste the private key first");
    return;
  }

  try {
    const cid = await decryptWithPrivateKey(
      encryptedCid,
      privateKey
    );

    setDecryptedCids((prev) => ({
      ...prev,
      [studentAddress]: cid
    }));
  } catch (err) {
    console.error("Decryption failed:", err);
    alert("Invalid private key or corrupted submission");
  }
}


  /* ============================
        GRADE
  ============================ */
  async function handleGrade(student) {
    const grade = grades[student];
    const note = notes[student] || "";

    if (!grade) {
      alert("Enter a grade");
      return;
    }

    try {
      setLoading(true);
      const contract = await getContract();
      const tx = await contract.addGrade(
        Number(assignmentId),
        student,
        Number(grade),
        note
      );
      await tx.wait();
      fetchSubmissions();
      setEditing((prev) => ({ ...prev, [student]: false }));
    } catch {
      alert("Grading failed");
    } finally {
      setLoading(false);
    }
  }

  function handleCancelEdit(student) {
    setGrades((prev) => ({
      ...prev,
      [student]: originalGrades[student] || ""
    }));

    setNotes((prev) => ({
      ...prev,
      [student]: originalNotes[student] || ""
    }));

    setEditing((prev) => ({ ...prev, [student]: false }));
  }

  /* ============================
        RENDER
  ============================ */
  return (
    <div>
      <h4>Grade Submissions — {assignmentTitle}</h4>

      {/* Private Key Input */}
      <div className="form-section">
        <h5>Decrypt Submissions</h5>
        <form onSubmit={(e) => e.preventDefault()}>
          <div className="form-group">
            <label htmlFor="priv-key">Assignment Private Key (JSON) *</label>
            <textarea
              id="priv-key"
              placeholder="Paste the private key JSON here to decrypt submissions"
              value={privateKey}
              onChange={(e) => setPrivateKey(e.target.value)}
              style={{ minHeight: "100px", fontFamily: "monospace", fontSize: "0.85rem" }}
            />
            <p className="form-hint">This key is needed to decrypt and view student submissions.</p>
          </div>
        </form>
      </div>

      {/* Submissions List */}
      <div className="content-section">
        <h5>Student Submissions ({submissions.length})</h5>
        {submissions.length === 0 ? (
          <p className="empty-message">No submissions yet</p>
        ) : (
          <div className="submissions-grid">
            {submissions.map((s) => {
              const student = s.studentAddress;
              const name =
                studentNames[student.toLowerCase()] || student;
              const decrypted = decryptedCids[student];
              const isEditing = editing[student];

              return (
                <div key={student} className="submission-card">
                  <div className="submission-header">
                    <span className="student-name">{name}</span>
                    <span className={`grading-status ${s.graded ? 'graded' : 'pending'}`}>
                      {s.graded ? '✓ Graded' : '◦ Pending'}
                    </span>
                  </div>
                  
                  <div className="submission-address">
                    <small>{student}</small>
                  </div>

                  {/* Submission Access */}
                  <div className="submission-action">
                    {!decrypted ? (
                      <button
                        className="btn-secondary"
                        onClick={() =>
                          handleDecrypt(student, s.encryptedCid)
                        }
                      >
                        🔓 Decrypt Submission
                      </button>
                    ) : (
                      <a
                        href={`https://gateway.pinata.cloud/ipfs/${decrypted}`}
                        target="_blank"
                        rel="noreferrer"
                        className="material-link"
                      >
                        📄 View Submission
                      </a>
                    )}
                  </div>

                  {/* Grading Form */}
                  <div className="grading-form">
                    <div className="form-group">
                      <label>Grade (out of 20)</label>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        disabled={s.graded && !isEditing}
                        value={grades[student] || ""}
                        onChange={(e) =>
                          setGrades({
                            ...grades,
                            [student]: e.target.value
                          })
                        }
                      />
                    </div>

                    <div className="form-group">
                      <label>Feedback/Note</label>
                      <textarea
                        disabled={s.graded && !isEditing}
                        placeholder="Add feedback for the student..."
                        value={notes[student] || ""}
                        onChange={(e) =>
                          setNotes({
                            ...notes,
                            [student]: e.target.value
                          })
                        }
                        style={{ minHeight: "80px" }}
                      />
                    </div>

                    <div className="grading-buttons">
                      {!s.graded ? (
                        <button
                          className="btn-primary"
                          onClick={() => handleGrade(student)}
                          disabled={loading}
                        >
                          Submit Grade
                        </button>
                      ) : !isEditing ? (
                        <button
                          className="btn-secondary"
                          onClick={() =>
                            setEditing({ ...editing, [student]: true })
                          }
                        >
                          Update Grade
                        </button>
                      ) : (
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            className="btn-primary"
                            onClick={() => handleGrade(student)}
                            disabled={loading}
                          >
                            Save Update
                          </button>
                          <button
                            className="btn-danger-small"
                            onClick={() => handleCancelEdit(student)}
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default GradesPanel;
