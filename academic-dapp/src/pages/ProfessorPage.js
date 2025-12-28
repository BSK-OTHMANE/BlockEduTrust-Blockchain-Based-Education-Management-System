// src/pages/ProfessorPage.js
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, ABI } from "../constants/contract";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import logo from "../BlockEduTrustLogo.png";
import ModuleCard from "../components/professor/ModuleCard";
import "./Page.css";

function ProfessorPage() {
  const { account, userName } = useAuth();
  const navigate = useNavigate();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedModuleId, setSelectedModuleId] = useState(null);

  const handleDisconnect = () => {
    navigate("/");
  };

  async function getContract() {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
  }

  async function fetchModules() {
    try {
      const contract = await getContract();
      const result = await contract.getModulesByProfessor(account);
      setModules(result);
      if (result.length > 0 && !selectedModuleId) {
        setSelectedModuleId(result[0].id);
      }
    } catch (err) {
      console.error(err);
      alert("Error loading modules");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (account) fetchModules();
  }, [account]);

  if (loading) return <p className="loading">Loading professor dashboard...</p>;

  const selectedModule = modules.find(m => m.id === selectedModuleId);

  return (
    <>
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-left">
          <img src={logo} alt="BlockEduTrust Logo" className="navbar-logo" />
          <div className="navbar-brand">
            <h2 className="navbar-title">BlockEduTrust</h2>
            <p className="navbar-welcome">Welcome, {userName || "Professor"}</p>
          </div>
        </div>
        <div className="navbar-right">
          <span className="role-badge professor">Instructor</span>
          <button className="disconnect-btn" onClick={handleDisconnect}>
            Disconnect
          </button>
        </div>
      </nav>

      {/* Page with Sidebar */}
      <div className="page-with-sidebar">
        {/* Sidebar */}
        <aside className="sidebar">
          <h3 className="sidebar-title">My Modules</h3>
          {modules.length === 0 ? (
            <p className="sidebar-empty">No modules assigned</p>
          ) : (
            <nav className="sidebar-nav">
              {modules.map((mod) => (
                <button
                  key={mod.id}
                  className={`sidebar-item ${selectedModuleId === mod.id ? "active" : ""}`}
                  onClick={() => setSelectedModuleId(mod.id)}
                >
                  #{Number(mod.id)} — {mod.name}
                </button>
              ))}
            </nav>
          )}
        </aside>

        {/* Main Content */}
        <main className="main-content">
          <div className="professor-page">
            {selectedModule ? (
              <ModuleCard module={selectedModule} />
            ) : (
              <p className="empty-state">No module selected</p>
            )}
          </div>
        </main>
      </div>
    </>
  );
}

export default ProfessorPage;
