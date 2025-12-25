import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, ABI } from "../../constants/contract";
import { computeCID } from "../../constants/ipfs";
import { uploadFileToPinata } from "../../constants/pinataService";

function MaterialsPanel({ moduleId }) {
  const [materials, setMaterials] = useState([]);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  async function getContract() {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
  }

  async function fetchMaterials() {
    const contract = await getContract();
    const result = await contract.getMaterialsByModule(Number(moduleId));
    setMaterials(result);
  }

  useEffect(() => {
    fetchMaterials();
  }, [moduleId]);

  /* ============================
        FINAL SAFE ADD MATERIAL
  ============================ */
  async function handleAddMaterial() {
    if (!title || !file) {
      alert("Please provide title and PDF");
      return;
    }

    try {
      setLoading(true);

      // 1️⃣ Compute CID locally
      const cid = await computeCID(file);

      // 2️⃣ Prevent duplicate in same module
      if (materials.some((m) => m.ipfsHash === cid)) {
        alert("This material already exists in this module.");
        return;
      }

      // 3️⃣ Upload to Pinata (always safe)
      await uploadFileToPinata(file);

      // 4️⃣ Blockchain transaction
      const contract = await getContract();
      const tx = await contract.addModuleMaterial(
        Number(moduleId),
        title,
        cid
      );
      await tx.wait();

      // ✅ Success
      setTitle("");
      setFile(null);
      fetchMaterials();

    } catch (err) {
      console.error("ADD MATERIAL ERROR:", err);
      alert("Transaction failed. No file was removed from IPFS.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h4>Materials</h4>

      <input
        placeholder="Material title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => setFile(e.target.files[0])}
      />

      <button onClick={handleAddMaterial} disabled={loading}>
        {loading ? "Processing..." : "Add Material"}
      </button>

      <ul>
        {materials.map((mat) => (
          <li key={mat.id}>
            <strong>{mat.title}</strong>
            <br />
            <a
              href={`https://tomato-advanced-quelea-361.mypinata.cloud/ipfs/${mat.ipfsHash}`}
              target="_blank"
              rel="noreferrer"
            >
              View PDF
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default MaterialsPanel;
