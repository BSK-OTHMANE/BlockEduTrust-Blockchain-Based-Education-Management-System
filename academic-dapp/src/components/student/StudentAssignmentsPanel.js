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
      <h4>Assignments</h4>

      {assignments.map((a) => {
        const deadlinePassed =
          Date.now() / 1000 > a.deadline;

        const grade = grades[a.id];

        return (
          <div
            key={a.id}
            style={{
              border: "1px solid #ccc",
              padding: "15px",
              marginBottom: "15px"
            }}
          >
            <strong>{a.title}</strong>
            <br />
            Deadline:{" "}
            {new Date(a.deadline * 1000).toLocaleString()}
            <br />

            <a
              href={`https://gateway.pinata.cloud/ipfs/${a.ipfsHash}`}
              target="_blank"
              rel="noreferrer"
            >
              View assignment PDF
            </a>

            <br /><br />

            {submissions[a.id] ? (
              <p style={{ color: "green" }}>✔ Submitted</p>
            ) : (
              <p style={{ color: "red" }}>✖ Not submitted</p>
            )}

            {/* GRADE DISPLAY */}
            {grade ? (
              <div style={{ marginTop: "10px" }}>
                <strong>Grade:</strong> {grade.value} / 20
                <br />
                {grade.note && (
                  <>
                    <strong>Note:</strong> {grade.note}
                  </>
                )}
              </div>
            ) : (
              <p style={{ color: "#777" }}>Not graded yet</p>
            )}

            {/* SUBMISSION UI */}
            {!deadlinePassed && (
              <>
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
                  style={{ marginLeft: "10px" }}
                >
                  {loadingId === a.id
                    ? "Submitting..."
                    : submissions[a.id]
                    ? "Resubmit"
                    : "Submit"}
                </button>
              </>
            )}

            {deadlinePassed && (
              <p style={{ color: "gray" }}>
                Submission closed
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default StudentAssignmentsPanel;
