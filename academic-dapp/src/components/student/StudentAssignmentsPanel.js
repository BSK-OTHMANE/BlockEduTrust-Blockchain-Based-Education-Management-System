import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, ABI } from "../../constants/contract";
import { uploadFileToPinata } from "../../constants/pinataService";
import { encryptWithPublicKey } from "../../constants/crypto";

const API_URL = "http://127.0.0.1:8000";

function StudentAssignmentsPanel({ moduleId }) {
  const [assignments, setAssignments] = useState([]);
  const [files, setFiles] = useState({});
  const [submissions, setSubmissions] = useState({});
  const [grades, setGrades] = useState({});
  const [loadingId, setLoadingId] = useState(null);
  const [submissionsExpanded, setSubmissionsExpanded] = useState(true);

  /* ============================
        CONTRACT
  ============================ */
  async function getContract() {
    if (!window.ethereum) throw new Error("MetaMask not found");
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
  }

  /* ============================
        FETCH ASSIGNMENTS
  ============================ */
  async function fetchAssignments() {
    const contract = await getContract();
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const student = await signer.getAddress();

    const raw = await contract.getAssignmentsByModule(Number(moduleId));

    const chainAssignments = raw.map((a) => ({
      id: Number(a[0]),
      moduleId: Number(a[1]),
      ipfsHash: a[2],
      publicKey: a[3],
      deadline: Number(a[4])
    }));

    // titles from backend
    const res = await fetch(
      `${API_URL}/professor/assignments?moduleId=${moduleId}`
    );
    const dbAssignments = await res.json();

    const titleMap = {};
    dbAssignments.forEach((a) => {
      titleMap[a.assignmentId] = a.title;
    });

    const submissionMap = {};
    const gradeMap = {};

    for (const a of chainAssignments) {
      // submission
      const s = await contract.submissions(a.id, student);
      submissionMap[a.id] = s[0] !== ethers.ZeroAddress;

      // grade
      const g = await contract.grades(a.id, student);
      if (g.value > 0 || g.note !== "") {
        gradeMap[a.id] = {
          value: Number(g.value),
          note: g.note
        };
      }
    }

    setSubmissions(submissionMap);
    setGrades(gradeMap);

    setAssignments(
      chainAssignments.map((a) => ({
        ...a,
        title: titleMap[a.id] || "Untitled assignment"
      }))
    );
  }

  useEffect(() => {
    fetchAssignments();
  }, [moduleId]);

  /* ============================
        SUBMIT ASSIGNMENT
  ============================ */
  async function handleSubmit(a) {
    const file = files[a.id];
    if (!file) {
      alert("Please select a PDF file");
      return;
    }

    try {
      setLoadingId(a.id);

      const cid = await uploadFileToPinata(file);
      const encryptedCid = await encryptWithPublicKey(
        cid,
        a.publicKey
      );

      const contract = await getContract();
      const tx = await contract.submitAssignment(
        a.id,
        encryptedCid
      );

      await tx.wait();

      alert("Submission successful");
      fetchAssignments();
    } catch (err) {
      console.error(err);
      alert("Submission failed");
    } finally {
      setLoadingId(null);
    }
  }

  /* ============================
        RENDER
  ============================ */
  return (
    <div>
      <button
        className="expandable-list-header"
        onClick={() => setSubmissionsExpanded(!submissionsExpanded)}
      >
        <span className="toggle-icon">{submissionsExpanded ? "▼" : "▶"}</span>
        <span>My Submissions ({assignments.length})</span>
      </button>

      {submissionsExpanded && (
        <div className="expandable-list-content">
          {assignments.length === 0 ? (
            <p className="empty-message">No assignments for this module</p>
          ) : (
            <div className="assignments-grid">
              {assignments.map((a) => {
                const deadlinePassed =
                  Date.now() / 1000 > a.deadline;

                const grade = grades[a.id];
                const submitted = submissions[a.id];

                return (
              <div key={a.id} className="assignment-item">
                <div className="assignment-header">
                  <span className="assignment-title">{a.title}</span>
                  <span className={`submission-status ${submitted ? 'submitted' : 'pending'}`}>
                    {submitted ? '✓ Submitted' : '○ Pending'}
                  </span>
                </div>

                <div className="assignment-meta">
                  <span className="deadline">
                    📅 Deadline: {new Date(a.deadline * 1000).toLocaleString()}
                  </span>
                  {deadlinePassed && (
                    <span className="deadline-passed">Submission Closed</span>
                  )}
                </div>

                <a
                  href={`https://gateway.pinata.cloud/ipfs/${a.ipfsHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="material-link"
                  style={{ marginTop: "8px", display: "block" }}
                >
                  📄 View Assignment Details
                </a>

                {/* GRADE DISPLAY */}
                {grade ? (
                  <div className="grade-section">
                    <strong>Your Grade:</strong> {grade.value} / 20
                    {grade.note && (
                      <div className="grade-note">
                        <strong>Feedback:</strong> {grade.note}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="not-graded">⏳ Waiting for grading...</p>
                )}

                {/* SUBMISSION UI */}
                {!deadlinePassed && (
                  <div className="submission-section">
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) =>
                        setFiles({
                          ...files,
                          [a.id]: e.target.files[0]
                        })
                      }
                    />

                    <button
                      onClick={() => handleSubmit(a)}
                      disabled={loadingId === a.id}
                      className="btn-primary"
                      style={{ marginTop: "8px" }}
                    >
                      {loadingId === a.id
                        ? "Submitting..."
                        : submitted
                        ? "Resubmit Assignment"
                        : "Submit Assignment"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default StudentAssignmentsPanel;
