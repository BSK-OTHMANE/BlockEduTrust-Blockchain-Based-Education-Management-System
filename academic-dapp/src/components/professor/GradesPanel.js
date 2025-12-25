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
  function handleDecrypt(student, encryptedCid) {
    if (!privateKey) {
      alert("Paste the assignment private key first");
      return;
    }

    try {
      const cid = decryptWithPrivateKey(encryptedCid, privateKey);
      setDecryptedCids((prev) => ({ ...prev, [student]: cid }));
    } catch {
      alert("Invalid private key");
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
    <div style={{ marginTop: "15px" }}>
      <h4>Grades — {assignmentTitle}</h4>

      <input
        type="password"
        placeholder="Paste assignment private key"
        value={privateKey}
        onChange={(e) => setPrivateKey(e.target.value)}
        style={{ width: "100%", marginBottom: "15px" }}
      />

      {submissions.length === 0 && <p>No submissions yet</p>}

      {submissions.map((s) => {
        const student = s.studentAddress;
        const name =
          studentNames[student.toLowerCase()] || student;
        const decrypted = decryptedCids[student];
        const isEditing = editing[student];

        return (
          <div
            key={student}
            style={{
              border: "1px solid #ccc",
              padding: "10px",
              marginBottom: "10px"
            }}
          >
            <strong>{name}</strong>
            <br />
            <small>{student}</small>

            <div style={{ marginTop: "10px" }}>
              {!decrypted ? (
                <button
                  onClick={() =>
                    handleDecrypt(student, s.encryptedCid)
                  }
                >
                  Decrypt submission
                </button>
              ) : (
                <a
                  href={`https://gateway.pinata.cloud/ipfs/${decrypted}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  View submission
                </a>
              )}
            </div>

            <div style={{ marginTop: "10px" }}>
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

              <input
                disabled={s.graded && !isEditing}
                placeholder="Note"
                value={notes[student] || ""}
                onChange={(e) =>
                  setNotes({
                    ...notes,
                    [student]: e.target.value
                  })
                }
              />

              {!s.graded ? (
                <button
                  onClick={() => handleGrade(student)}
                  disabled={loading}
                >
                  Submit grade
                </button>
              ) : !isEditing ? (
                <button
                  onClick={() =>
                    setEditing({ ...editing, [student]: true })
                  }
                >
                  Update grade
                </button>
              ) : (
                <>
                  <button
                    onClick={() => handleGrade(student)}
                    disabled={loading}
                  >
                    Save update
                  </button>
                  <button
                    onClick={() => handleCancelEdit(student)}
                    style={{ marginLeft: "8px" }}
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default GradesPanel;
