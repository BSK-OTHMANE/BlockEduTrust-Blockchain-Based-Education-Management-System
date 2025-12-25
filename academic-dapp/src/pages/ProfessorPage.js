// src/pages/ProfessorPage.js
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, ABI } from "../constants/contract";
import { useAuth } from "../context/AuthContext";
import ModuleCard from "../components/professor/ModuleCard";
import "./Page.css";

function ProfessorPage() {
  const { account } = useAuth();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <p>Loading professor dashboard...</p>;

  return (
    <div className="admin-page">
      <h2>Professor Dashboard</h2>

      {modules.length === 0 && <p>No modules assigned</p>}

      {modules.map((mod) => (
        <ModuleCard key={mod.id} module={mod} />
      ))}
    </div>
  );
}

export default ProfessorPage;
