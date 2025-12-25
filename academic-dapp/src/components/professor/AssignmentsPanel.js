// src/components/professor/AssignmentsPanel.js
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, ABI } from "../../constants/contract";
import { uploadFileToPinata } from "../../constants/pinataService";
import { generateKeyPair } from "../../constants/crypto";

const API_URL = "http://127.0.0.1:8000";

function AssignmentsPanel({ moduleId, onSelectAssignment }) {
  const [assignments, setAssignments] = useState([]);

  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [deadline, setDeadline] = useState("");
  const [loading, setLoading] = useState(false);

  /* ============================
        CONTRACT
  ============================ */
  async function getContract() {
    if (!window.ethereum) {
      throw new Error("MetaMask not found");
    }
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
  }

  /* ============================
        FETCH ASSIGNMENTS
  ============================ */
  async function fetchAssignments() {
    try {
      const contract = await getContract();

      // 1️⃣ On-chain assignments
      const raw = await contract.getAssignmentsByModule(Number(moduleId));

      const chainAssignments = raw.map((a) => ({
        id: Number(a[0]),
        moduleId: Number(a[1]),
        ipfsHash: a[2],
        publicKey: a[3],
        deadline: Number(a[4]),
        exists: a[5]
      }));

      // 2️⃣ Backend titles
      const res = await fetch(
        `${API_URL}/professor/assignments?moduleId=${moduleId}`
      );
      const dbAssignments = await res.json();

      const titleMap = {};
      dbAssignments.forEach((a) => {
        titleMap[a.assignmentId] = a.title;
      });

      setAssignments(
        chainAssignments.map((a) => ({
          ...a,
          title: titleMap[a.id] || "Untitled assignment"
        }))
      );
    } catch (err) {
      console.error("Failed to fetch assignments:", err);
      alert("Error loading assignments");
    }
  }

  useEffect(() => {
    if (moduleId) fetchAssignments();
  }, [moduleId]);

  /* ============================
        CREATE ASSIGNMENT
  ============================ */
  async function handleCreateAssignment() {
    if (!title || !file || !deadline) {
      alert("Please fill all fields before creating assignment");
      return;
    }

    try {
      setLoading(true);

      // 1️⃣ Generate RSA key pair
      const { publicKey, privateKey } = await generateKeyPair();

      // 2️⃣ Upload assignment PDF
      const cid = await uploadFileToPinata(file);

      // 3️⃣ Blockchain transaction
      const contract = await getContract();
      const tx = await contract.createAssignment(
        Number(moduleId),
        cid,
        publicKey,
        Math.floor(new Date(deadline).getTime() / 1000)
      );

      await tx.wait(); // ✅ confirmed

      // 4️⃣ Get assignmentId (counter after tx)
      const assignmentId = Number(await contract.assignmentCount());

      // 5️⃣ Save assignment metadata (title)
      await fetch(`${API_URL}/professor/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId,
          moduleId: Number(moduleId),
          title
        })
      });

      // 6️⃣ Save PRIVATE KEY (AFTER confirmation)
      const date = new Date().toISOString().split("T")[0];
      const safeTitle = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_|_$/g, "");

      const keyFile = {
        assignmentId,
        moduleId: Number(moduleId),
        title,
        createdAt: new Date().toISOString(),
        privateKey
      };

      const blob = new Blob(
        [JSON.stringify(keyFile, null, 2)],
        { type: "application/json" }
      );

      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${safeTitle}_${date}_private_key.json`;
      a.click();

      // Reset form
      setTitle("");
      setFile(null);
      setDeadline("");

      fetchAssignments();
    } catch (err) {
      console.error("Assignment creation failed:", err);
      alert("Assignment creation failed");
    } finally {
      setLoading(false);
    }
  }

  /* ============================
        RENDER
  ============================ */
  return (
    <div>
      <h4>Assignments</h4>

      {/* CREATE ASSIGNMENT */}
      <div
        style={{
          border: "1px solid #ccc",
          padding: "10px",
          marginBottom: "15px"
        }}
      >
        <input
          placeholder="Assignment title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files[0])}
        />

        <input
          type="datetime-local"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
        />

        <button onClick={handleCreateAssignment} disabled={loading}>
          {loading ? "Creating..." : "Create Assignment"}
        </button>
      </div>

      {/* LIST ASSIGNMENTS */}
      {assignments.length === 0 ? (
        <p>No assignments yet</p>
      ) : (
        <ul>
          {assignments.map((a) => (
            <li key={a.id} style={{ marginBottom: "12px" }}>
              <strong>{a.title}</strong>
              <br />
              Deadline:{" "}
              {new Date(a.deadline * 1000).toLocaleString()}
              <br />
              <button
                style={{ marginTop: "5px" }}
                onClick={() => onSelectAssignment(a.id)}
              >
                View Grades
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default AssignmentsPanel;
