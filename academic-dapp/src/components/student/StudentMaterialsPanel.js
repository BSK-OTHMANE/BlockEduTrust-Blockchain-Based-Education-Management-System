// src/components/student/StudentMaterialsPanel.js
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, ABI } from "../../constants/contract";

function StudentMaterialsPanel({ moduleId }) {
  const [materials, setMaterials] = useState([]);
  const [materialsExpanded, setMaterialsExpanded] = useState(true);

  async function getContract() {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
  }

  async function fetchMaterials() {
    try {
      const contract = await getContract();
      const result = await contract.getMaterialsByModule(
        Number(moduleId)
      );
      setMaterials(result);
    } catch (err) {
      console.error(err);
      alert("Error loading materials");
    }
  }

  useEffect(() => {
    fetchMaterials();
  }, [moduleId]);

  return (
    <div>
      <button
        className="expandable-list-header"
        onClick={() => setMaterialsExpanded(!materialsExpanded)}
      >
        <span className="toggle-icon">{materialsExpanded ? "▼" : "▶"}</span>
        <span>Course Materials ({materials.length})</span>
      </button>
      {materialsExpanded && (
        <div className="expandable-list-content">
          {materials.length === 0 ? (
            <p className="empty-message">No materials available for this module</p>
          ) : (
            <div className="materials-grid">
              {materials.map((m) => (
                <div key={m.id} className="material-item">
                  <div className="material-header">
                    <span className="material-title">{m.title}</span>
                  </div>
                  <a
                    href={`https://gateway.pinata.cloud/ipfs/${m.ipfsHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="material-link"
                  >
                    📄 Download & View
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default StudentMaterialsPanel;
