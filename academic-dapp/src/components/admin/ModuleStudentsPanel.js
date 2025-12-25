import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, ABI } from "../../constants/contract";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const API_URL = "http://127.0.0.1:8000";

function ModuleStudentsPanel({ moduleId, moduleName, moduleProfessor }) {
  const [students, setStudents] = useState([]);
  const [professor, setProfessor] = useState(null);
  const [loading, setLoading] = useState(false);

  /* ============================
        CONTRACT
  ============================ */
  async function getContract() {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
  }

  /* ============================
        FETCH STUDENTS
  ============================ */
  async function fetchStudents() {
    try {
      setLoading(true);

      // 1️⃣ Get enrolled addresses from blockchain
      const contract = await getContract();
      const enrolledAddresses = await contract.getStudentsByModule(
        Number(moduleId)
      );

      // 2️⃣ Get students metadata from backend
      const res = await fetch(`${API_URL}/admin/users?role=STUDENT`);
      const allStudents = await res.json();

      const map = {};
      allStudents.forEach((s) => {
        map[s.address.toLowerCase()] = s;
      });

      const merged = enrolledAddresses.map((addr) => ({
        address: addr,
        name: map[addr.toLowerCase()]?.name || "Unknown",
        email: map[addr.toLowerCase()]?.email || "-"
      }));

      setStudents(merged);
    } catch (err) {
      console.error(err);
      alert("Failed to load enrolled students");
    } finally {
      setLoading(false);
    }
  }

  /* ============================
        FETCH PROFESSOR
  ============================ */
  async function fetchProfessor() {
    if (!moduleProfessor || moduleProfessor === ethers.ZeroAddress) {
      setProfessor(null);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/admin/users?role=PROFESSOR`);
      const profs = await res.json();

      const found = profs.find(
        (p) =>
          p.address.toLowerCase() === moduleProfessor.toLowerCase()
      );

      setProfessor(found || null);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    fetchStudents();
    fetchProfessor();
  }, [moduleId, moduleProfessor]);

  /* ============================
        EXPORT PDF
  ============================ */
  function downloadPDF() {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("Enrolled Students", 14, 15);

    doc.setFontSize(12);
    doc.text(`Module: ${moduleName} (#${moduleId})`, 14, 25);

    let startY = 35;

    if (professor) {
      doc.text("Professor:", 14, startY);
      doc.text(`Name: ${professor.name}`, 14, startY + 7);
      doc.text(`Address: ${professor.address}`, 14, startY + 14);
      doc.text(`Email: ${professor.email}`, 14, startY + 21);
      startY += 30;
    }

    autoTable(doc, {
      startY,
      head: [["Name", "Address", "Email"]],
      body: students.map((s) => [
        s.name,
        s.address,
        s.email
      ])
    });

    doc.save(`module_${moduleId}_students.pdf`);
  }

  /* ============================
        RENDER
  ============================ */
  return (
    <div style={{ marginTop: "10px" }}>
      <h4>Enrolled Students</h4>

      {loading && <p>Loading...</p>}

      {!loading && students.length === 0 && (
        <p>No students enrolled</p>
      )}

      {!loading && students.length > 0 && (
        <>
          <table width="100%" border="1" cellPadding="8">
            <thead>
              <tr>
                <th>Name</th>
                <th>Address</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.address}>
                  <td>{s.name}</td>
                  <td>{s.address}</td>
                  <td>{s.email}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <button
            onClick={downloadPDF}
            style={{ marginTop: "10px" }}
          >
            Download PDF
          </button>
        </>
      )}
    </div>
  );
}

export default ModuleStudentsPanel;
