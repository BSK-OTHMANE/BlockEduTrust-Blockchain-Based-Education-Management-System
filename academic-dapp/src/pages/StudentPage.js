// src/pages/StudentPage.js
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, ABI } from "../constants/contract";
import { useAuth } from "../context/AuthContext";
import StudentModuleCard from "../components/student/StudentModuleCard";
import "./Page.css";

function StudentPage() {
  const { account } = useAuth();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <p>Loading student dashboard...</p>;

  return (
    <div className="admin-page">
      <h2>Student Dashboard</h2>

      {modules.length === 0 && (
        <p>You are not enrolled in any module</p>
      )}

      {modules.map((mod) => (
        <StudentModuleCard key={mod.id} module={mod} />
      ))}
    </div>
  );
}

export default StudentPage;
