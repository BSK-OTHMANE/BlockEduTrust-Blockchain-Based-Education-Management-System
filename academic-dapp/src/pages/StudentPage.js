// src/pages/StudentPage.js
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, ABI } from "../constants/contract";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import logo from "../BlockEduTrustLogo.png";
import StudentModuleCard from "../components/student/StudentModuleCard";
import "./Page.css";

function StudentPage() {
  const { account, userName } = useAuth();
  const navigate = useNavigate();
  const [modules, setModules] = useState([]);
  const [selectedModuleId, setSelectedModuleId] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleDisconnect = () => {
    navigate("/");
  };

  async function getContract() {
    if (!window.ethereum) throw new Error("MetaMask not found");
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
  }

  async function fetchModules() {
    try {
      const contract = await getContract();
      const result = await contract.getModulesByStudent(account);
      setModules(result);
      // Auto-select first module
      if (result.length > 0 && !selectedModuleId) {
        setSelectedModuleId(result[0].id);
      }
    } catch (err) {
      console.error(err);
      alert("Error loading student modules");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (account) fetchModules();
  }, [account]);

  if (loading) return <p className="loading">Loading student dashboard...</p>;

  const selectedModule = modules.find(mod => mod.id === selectedModuleId);

  return (
    <>
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-left">
          <img src={logo} alt="BlockEduTrust Logo" className="navbar-logo" />
          <div className="navbar-brand">
            <h2 className="navbar-title">BlockEduTrust</h2>
            <p className="navbar-welcome">Welcome, {userName || "Student"}</p>
          </div>
        </div>
        <div className="navbar-right">
          <span className="role-badge student">Student</span>
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
          <nav className="sidebar-nav">
            {modules.length === 0 ? (
              <p className="empty-sidebar-message">No modules enrolled</p>
            ) : (
              modules.map(mod => (
                <button
                  key={mod.id}
                  className={`sidebar-item ${selectedModuleId === mod.id ? "active" : ""}`}
                  onClick={() => setSelectedModuleId(mod.id)}
                >
                  #{Number(mod.id)} — {mod.name}
                </button>
              ))
            )}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          {modules.length === 0 && (
            <p className="empty-state">You are not enrolled in any module</p>
          )}

          {selectedModule ? (
            <StudentModuleCard key={selectedModule.id} module={selectedModule} />
          ) : (
            <p className="empty-state">No module selected</p>
          )}
        </main>
      </div>
    </>
  );
}

export default StudentPage;
