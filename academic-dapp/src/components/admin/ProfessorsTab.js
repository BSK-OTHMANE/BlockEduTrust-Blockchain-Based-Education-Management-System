import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, ABI } from "../../constants/contract";
import ModuleStudentsPanel from "./ModuleStudentsPanel";

const API_URL = "http://127.0.0.1:8000";

function ProfessorsTab() {
  /* ============================
        STATE
  ============================ */
  const [professors, setProfessors] = useState([]);
  const [expandedProf, setExpandedProf] = useState(null);

  // Add professor
  const [newProfAddress, setNewProfAddress] = useState("");
  const [newProfName, setNewProfName] = useState("");
  const [newProfEmail, setNewProfEmail] = useState("");
  const [profLoading, setProfLoading] = useState(false);

  // Modules
  const [modules, setModules] = useState([]);
  const [newModuleName, setNewModuleName] = useState("");
  const [moduleLoading, setModuleLoading] = useState(false);

  // Per-professor module selection
  const [selectedModules, setSelectedModules] = useState({});

  // 👇 NEW: toggle enrolled students per module
  const [openModuleStudents, setOpenModuleStudents] = useState({});

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
  async function fetchProfessors() {
    const res = await fetch(`${API_URL}/admin/users/?role=PROFESSOR`);
    const data = await res.json();
    setProfessors(data);
  }

  async function fetchModules() {
    const contract = await getContract();
    const allModules = await contract.getAllModules();
    setModules(allModules);
  }

  useEffect(() => {
    fetchProfessors();
    fetchModules();
  }, []);

  /* ============================
        ADD PROFESSOR
  ============================ */
  async function handleAddProfessor() {
    if (!newProfAddress || !newProfName || !newProfEmail) {
      alert("Please fill all fields");
      return;
    }

    try {
      setProfLoading(true);
      const contract = await getContract();

      const tx = await contract.addProfessor(newProfAddress);
      await tx.wait();

      await fetch(`${API_URL}/admin/users/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: newProfAddress,
          role: "PROFESSOR",
          name: newProfName,
          email: newProfEmail
        })
      });

      setNewProfAddress("");
      setNewProfName("");
      setNewProfEmail("");

      fetchProfessors();
    } catch (err) {
      console.error(err);
      alert("Error adding professor");
    } finally {
      setProfLoading(false);
    }
  }

  /* ============================
        MODULE MANAGEMENT
  ============================ */
  async function handleAddModule() {
    if (!newModuleName) {
      alert("Enter module name");
      return;
    }

    try {
      setModuleLoading(true);
      const contract = await getContract();

      const tx = await contract.createModule(newModuleName);
      await tx.wait();

      setNewModuleName("");
      fetchModules();
    } catch (err) {
      console.error(err);
      alert("Error creating module");
    } finally {
      setModuleLoading(false);
    }
  }

  async function handleRemoveModule(moduleId) {
    if (!window.confirm("Remove this module?")) return;

    try {
      const contract = await getContract();
      const tx = await contract.removeModule(Number(moduleId));
      await tx.wait();
      fetchModules();
    } catch (err) {
      console.error(err);
      alert("Error removing module");
    }
  }

  /* ============================
        ASSIGN / UNASSIGN MODULE
  ============================ */
  async function assignModule(profAddress) {
    const moduleId = selectedModules[profAddress];
    if (!moduleId) {
      alert("Select a module");
      return;
    }

    try {
      const contract = await getContract();
      const tx = await contract.assignProfessorToModule(
        Number(moduleId),
        profAddress
      );
      await tx.wait();

      fetchModules();
      setSelectedModules({ ...selectedModules, [profAddress]: "" });
    } catch (err) {
      console.error(err);
      alert("Error assigning module");
    }
  }

  async function unassignModule(moduleId) {
    try {
      const contract = await getContract();
      const tx = await contract.removeProfessorFromModule(Number(moduleId));
      await tx.wait();
      fetchModules();
    } catch (err) {
      console.error(err);
      alert("Error unassigning module");
    }
  }

  /* ============================
        RENDER
  ============================ */
  return (
    <div>
      <h3>Professors</h3>

      {/* ============================
            ADD PROFESSOR
      ============================ */}
      <div style={{ marginBottom: "25px" }}>
        <h4>Add Professor</h4>
        <input
          placeholder="Professor address"
          value={newProfAddress}
          onChange={(e) => setNewProfAddress(e.target.value)}
        />
        <input
          placeholder="Professor name"
          value={newProfName}
          onChange={(e) => setNewProfName(e.target.value)}
        />
        <input
          placeholder="Professor email"
          value={newProfEmail}
          onChange={(e) => setNewProfEmail(e.target.value)}
        />
        <button onClick={handleAddProfessor} disabled={profLoading}>
          {profLoading ? "Adding..." : "Add Professor"}
        </button>
      </div>

      {/* ============================
            PROFESSOR LIST
      ============================ */}
      {professors.map((prof) => {
        const profModules = modules.filter(
          (m) => m.professor.toLowerCase() === prof.address.toLowerCase()
        );

        const freeModules = modules.filter(
          (m) => m.professor === ethers.ZeroAddress
        );

        return (
          <div
            key={prof.address}
            style={{
              border: "1px solid #ccc",
              padding: "10px",
              marginBottom: "15px"
            }}
          >
            <div
              style={{ cursor: "pointer", fontWeight: "bold" }}
              onClick={() =>
                setExpandedProf(
                  expandedProf === prof.address ? null : prof.address
                )
              }
            >
              {prof.name} — {prof.address}
            </div>

            {expandedProf === prof.address && (
              <div style={{ marginTop: "10px" }}>
                <h4>Assigned Modules</h4>

                {profModules.length === 0 && <p>No modules assigned</p>}

                {profModules.map((mod) => (
                  <div key={mod.id} style={{ marginBottom: "10px" }}>
                    #{Number(mod.id)} — {mod.name}

                    <button
                      style={{ marginLeft: "10px" }}
                      onClick={() => unassignModule(mod.id)}
                    >
                      Unassign
                    </button>

                    <button
                      style={{ marginLeft: "10px" }}
                      onClick={() =>
                        setOpenModuleStudents((prev) => ({
                          ...prev,
                          [mod.id]: !prev[mod.id]
                        }))
                      }
                    >
                      {openModuleStudents[mod.id]
                        ? "Hide students"
                        : "View students"}
                    </button>

                    {openModuleStudents[mod.id] && (
                      <div style={{ marginTop: "10px" }}>
                        <ModuleStudentsPanel
  moduleId={mod.id}
  moduleName={mod.name}
  moduleProfessor={mod.professor}
/>
                      </div>
                    )}
                  </div>
                ))}

                <hr />

                <h4>Assign New Module</h4>
                <select
                  value={selectedModules[prof.address] || ""}
                  onChange={(e) =>
                    setSelectedModules({
                      ...selectedModules,
                      [prof.address]: e.target.value
                    })
                  }
                >
                  <option value="">Select module</option>
                  {freeModules.map((mod) => (
                    <option key={mod.id} value={mod.id.toString()}>
                      #{Number(mod.id)} — {mod.name}
                    </option>
                  ))}
                </select>

                <button
                  style={{ marginLeft: "10px" }}
                  onClick={() => assignModule(prof.address)}
                >
                  Assign
                </button>
              </div>
            )}
          </div>
        );
      })}

      {/* ============================
            MODULE MANAGEMENT
      ============================ */}
      <div style={{ marginTop: "30px", borderTop: "2px solid #ccc" }}>
        <h3>Modules</h3>

        <input
          placeholder="Module name"
          value={newModuleName}
          onChange={(e) => setNewModuleName(e.target.value)}
        />
        <button onClick={handleAddModule} disabled={moduleLoading}>
          {moduleLoading ? "Creating..." : "Create Module"}
        </button>

        <ul>
          {modules.map((mod) => (
            <li key={mod.id}>
              #{Number(mod.id)} — {mod.name}
              <button
                style={{ marginLeft: "10px", color: "red" }}
                onClick={() => handleRemoveModule(mod.id)}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default ProfessorsTab;
