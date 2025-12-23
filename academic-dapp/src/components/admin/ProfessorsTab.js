import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, ABI } from "../../constants/contract";

const API_URL = "http://127.0.0.1:8000";

function ProfessorsTab() {
  /* ============================
        STATE
  ============================ */
  const [professors, setProfessors] = useState([]);
  const [expandedProf, setExpandedProf] = useState(null);
  const [addOpen, setAddOpen] = useState(true);

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
            1️⃣ ADD PROFESSOR
      ============================ */}
      <div className="card">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12}}>
          <h4 style={{margin:0}}>Add Professor</h4>
          <div>
            <button className="btn-ghost" onClick={()=>setAddOpen(!addOpen)}>{addOpen? 'Collapse' : 'Expand'}</button>
          </div>
        </div>

        {addOpen && (
          <div className="form-row" style={{marginTop:12}}>
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
            <button className="btn-primary" onClick={handleAddProfessor} disabled={profLoading}>
              {profLoading ? "Adding..." : "Add Professor"}
            </button>
          </div>
        )}
      </div>

        {/* ============================
              SHOW PROFESSORS (visualization)
        ============================ */}
        <div style={{marginTop:18}}>
          <h4>All Professors</h4>
          <div className="prof-grid">
            {professors.map((prof) => {
              const profModules = modules.filter(
                (m) => m.professor.toLowerCase() === prof.address.toLowerCase()
              );

              const freeModules = modules.filter((m) => m.professor === ethers.ZeroAddress);

              const initials = (prof.name || 'P').split(' ').map(s=>s[0]).slice(0,2).join('').toUpperCase();

              return (
                <div key={prof.address} className="prof-card">
                  <div className="prof-head">
                    <div className="avatar">{initials}</div>
                    <div className="prof-meta">
                      <div className="prof-name">Name: {prof.name}</div>
                      <div className="prof-address">Address: {prof.address}</div>
                    </div>
                  </div>

                  <div className="prof-stats">
                    <div className="stat">Modules: {profModules.length}</div>
                  </div>

                  <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                    {profModules.slice(0,3).map((m)=> (
                      <div key={m.id} className="module-chip-mini">#{Number(m.id)} {m.name}</div>
                    ))}

                    {profModules.length>3 && (
                      <div className="module-chip-mini">+{profModules.length-3} more</div>
                    )}
                  </div>

                  <div style={{display:'flex',justifyContent:'flex-end',gap:8}}>
                    <button className="btn-ghost" onClick={()=>setExpandedProf(expandedProf===prof.address?null:prof.address)}>
                      {expandedProf===prof.address? 'Hide' : 'Details'}
                    </button>
                    <button className="btn-primary" onClick={()=>{ setExpandedProf(prof.address); }}>
                      Manage
                    </button>
                  </div>

                  {expandedProf === prof.address && (
                    <div className="card" style={{ marginTop: "12px" }}>
                      <h4 style={{marginTop:0}}>Assigned Modules</h4>

                      {profModules.length === 0 && <p>No modules assigned</p>}

                      {profModules.map((mod) => (
                        <div key={mod.id} className="module-chip">
                          <div className="module-left">
                            <div className="module-id">#{Number(mod.id)}</div>
                            <div className="module-name">{mod.name}</div>
                          </div>

                          <div className="module-actions">
                            <button className="btn-ghost" onClick={() => unassignModule(mod.id)}>
                              Unassign
                            </button>
                            <button className="btn-danger" onClick={() => unassignModule(mod.id)} title="Remove module">
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}

                      <hr />

                      <h4 style={{marginBottom:8}}>Assign New Module</h4>
                      <div className="form-row" style={{alignItems:'center'}}>
                        <div style={{flex:1,display:'flex',gap:12}}>
                          <select
                            value={selectedModules[prof.address] || ""}
                            onChange={(e) =>
                              setSelectedModules({
                                ...selectedModules,
                                [prof.address]: e.target.value
                              })
                            }
                          >
                            <option value="">Select module to assign</option>
                            {freeModules.map((mod) => (
                              <option key={mod.id} value={mod.id.toString()}>
                                #{Number(mod.id)} — {mod.name}
                              </option>
                            ))}
                          </select>
                          <small style={{color:'var(--muted)',alignSelf:'center'}}>Free modules: {freeModules.length}</small>
                        </div>

                        <button
                          className="btn-primary"
                          onClick={() => assignModule(prof.address)}
                          disabled={!selectedModules[prof.address]}
                          title={!selectedModules[prof.address] ? 'Select a module first' : 'Assign module'}
                        >
                          Assign
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

      {/* Professors grid above is the single source of truth for professor cards. */}

      {/* ============================
            3️⃣ MODULE MANAGEMENT
      ============================ */}
      <div style={{ marginTop: "30px", borderTop: "2px solid #ccc", paddingTop: '18px' }}>
        <h3>Modules</h3>

        <div className="card">
          <div className="form-row">
            <input
              placeholder="Module name"
              value={newModuleName}
              onChange={(e) => setNewModuleName(e.target.value)}
            />
            <button className="btn-primary" onClick={handleAddModule} disabled={moduleLoading}>
              {moduleLoading ? "Creating..." : "Create Module"}
            </button>
          </div>

          <ul>
            {modules.map((mod) => (
              <li key={mod.id}>
                <div className="meta">#{Number(mod.id)} — {mod.name}</div>
                <button className="btn-danger" onClick={() => handleRemoveModule(mod.id)}>
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default ProfessorsTab;
