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

  // ADD this function inside ProfessorsTab

async function handleRemoveProfessor(e, profAddress) {
  e.stopPropagation(); // prevent expand toggle

  if (!window.confirm("Remove this professor completely?")) return;

  try {
    const contract = await getContract();

    // 1️⃣ Remove role on-chain
    const tx = await contract.removeProfessor(profAddress);
    await tx.wait();

    // 2️⃣ Remove from backend
    await fetch(`${API_URL}/admin/users/${profAddress}`, {
      method: "DELETE"
    });

    fetchProfessors();
    fetchModules();
  } catch (err) {
    console.error(err);
    alert("Failed to remove professor");
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
      <h3>Professors Management</h3>

      {/* ============================
            ADD PROFESSOR
      ============================ */}
      <div className="form-card">
        <h4>Add New Professor</h4>
        <form onSubmit={(e) => { e.preventDefault(); handleAddProfessor(); }}>
          <div className="form-group">
            <label>Wallet Address *</label>
            <input
              type="text"
              placeholder="0x742d35Cc6634C0532925a3b844Bc666B42999999"
              value={newProfAddress}
              onChange={(e) => setNewProfAddress(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Full Name *</label>
            <input
              type="text"
              placeholder="Dr. Jane Smith"
              value={newProfName}
              onChange={(e) => setNewProfName(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Email Address *</label>
            <input
              type="email"
              placeholder="jane.smith@university.edu"
              value={newProfEmail}
              onChange={(e) => setNewProfEmail(e.target.value)}
            />
          </div>
          <button type="submit" disabled={profLoading} className="btn-primary">
            {profLoading ? "Adding..." : "Add Professor"}
          </button>
        </form>
      </div>

      {/* ============================
            PROFESSOR LIST
      ============================ */}
      {professors.length === 0 ? (
        <div className="empty-state-card">
          <p>No professors registered yet</p>
        </div>
      ) : (
        <div className="table-card">
          <h4>Professors List</h4>
          {professors.map((prof) => {
            const profModules = modules.filter(
              (m) => m.professor.toLowerCase() === prof.address.toLowerCase()
            );

            const freeModules = modules.filter(
              (m) => m.professor === ethers.ZeroAddress
            );

            return (
              <div key={prof.address} className="expandable-card">
                <div
                  className="expandable-header"
                  onClick={() =>
                    setExpandedProf(
                      expandedProf === prof.address ? null : prof.address
                    )
                  }     
                >
                  <span className="expand-icon">
                    {expandedProf === prof.address ? "▼" : "▶"}
                  </span>
                  <div className="prof-info">
                    <span className="prof-name">{prof.name}</span>
                    <span className="prof-address">{prof.address.substring(0, 10)}...{prof.address.substring(prof.address.length - 8)}</span>
                  </div>
                  <span className="prof-email">{prof.email}</span>
                  <button
                    className="btn-danger-small"
                    onClick={(e) => handleRemoveProfessor(e, prof.address)}
                  >
                    Remove
                  </button>
                </div>

                {expandedProf === prof.address && (
                  <div className="expandable-content">
                    <div className="section">
                      <h5>Assigned Modules ({profModules.length})</h5>
                      {profModules.length === 0 ? (
                        <p className="empty-message">No modules assigned</p>
                      ) : (
                        <div className="module-list">
                          {profModules.map((mod) => (
                            <div key={mod.id} className="module-item">
                              <span className="module-info">#{Number(mod.id)} — {mod.name}</span>
                              <div className="button-group">
                                <button
                                  className="btn-secondary"
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
                                <button
                                  className="btn-danger"
                                  onClick={() => unassignModule(mod.id)}
                                >
                                  Unassign
                                </button>
                              </div>

                              {openModuleStudents[mod.id] && (
                                <div className="student-panel">
                                  <ModuleStudentsPanel
                                    moduleId={mod.id}
                                    moduleName={mod.name}
                                    moduleProfessor={mod.professor}
                                  />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="section">
                      <h5>Assign New Module</h5>
                      <div className="assign-module">
                        <select
                          value={selectedModules[prof.address] || ""}
                          onChange={(e) =>
                            setSelectedModules({
                              ...selectedModules,
                              [prof.address]: e.target.value
                            })
                          }
                        >
                          <option value="">Select module...</option>
                          {freeModules.map((mod) => (
                            <option key={mod.id} value={mod.id.toString()}>
                              #{Number(mod.id)} — {mod.name}
                            </option>
                          ))}
                        </select>
                        <button
                          className="btn-primary"
                          onClick={() => assignModule(prof.address)}
                        >
                          Assign
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ============================
            MODULE MANAGEMENT
      ============================ */}
      <div className="form-card" style={{ marginTop: "30px" }}>
        <h4>Create New Module</h4>
        <form onSubmit={(e) => { e.preventDefault(); handleAddModule(); }}>
          <div className="form-group">
            <label>Module Name *</label>
            <input
              type="text"
              placeholder="Advanced Algorithms"
              value={newModuleName}
              onChange={(e) => setNewModuleName(e.target.value)}
            />
          </div>
          <button type="submit" disabled={moduleLoading} className="btn-primary">
            {moduleLoading ? "Creating..." : "Create Module"}
          </button>
        </form>
      </div>

      {modules.length > 0 && (
        <div className="table-card">
          <h4>All Modules</h4>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {modules.map((mod) => (
                <tr key={mod.id}>
                  <td>#{Number(mod.id)}</td>
                  <td>{mod.name}</td>
                  <td>
                    <button
                      className="btn-danger-small"
                      onClick={() => handleRemoveModule(mod.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ProfessorsTab;
