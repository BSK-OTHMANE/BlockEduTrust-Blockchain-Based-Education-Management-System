// src/components/student/StudentMaterialsPanel.js
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, ABI } from "../../constants/contract";

function StudentMaterialsPanel({ moduleId }) {
  const [materials, setMaterials] = useState([]);

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
      <h4>Materials</h4>

      {materials.length === 0 ? (
        <p>No materials available</p>
      ) : (
        <ul>
          {materials.map((m) => (
            <li key={m.id}>
              <strong>{m.title}</strong>
              <br />
              <a
                href={`https://gateway.pinata.cloud/ipfs/${m.ipfsHash}`}
                target="_blank"
                rel="noreferrer"
              >
                View material
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default StudentMaterialsPanel;
