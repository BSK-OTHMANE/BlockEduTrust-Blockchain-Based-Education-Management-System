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
  const [materialsExpanded, setMaterialsExpanded] = useState(true);

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
      <h4>Module Materials</h4>

      {/* Add Material Form */}
      <div className="form-section">
        <h5>Upload New Material</h5>
        <form onSubmit={(e) => { e.preventDefault(); handleAddMaterial(); }}>
          <div className="form-group">
            <label htmlFor="mat-title">Material Title *</label>
            <input
              id="mat-title"
              type="text"
              placeholder="e.g., Lecture Notes - Chapter 3"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="mat-file">PDF File *</label>
            <input
              id="mat-file"
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files[0])}
            />
            {file && (
              <p className="file-info">Selected: {file.name}</p>
            )}
          </div>

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "Processing..." : "Upload Material"}
          </button>
        </form>
      </div>

      {/* Materials List */}
      <div className="content-section">
        <button
          className="expandable-list-header"
          onClick={() => setMaterialsExpanded(!materialsExpanded)}
        >
          <span className="toggle-icon">{materialsExpanded ? "▼" : "▶"}</span>
          <span>Materials List ({materials.length})</span>
        </button>
        {materialsExpanded && (
          <div className="expandable-list-content">
            {materials.length === 0 ? (
              <p className="empty-message">No materials uploaded yet</p>
            ) : (
              <div className="materials-grid">
                {materials.map((mat) => (
                  <div key={mat.id} className="material-item">
                    <div className="material-header">
                      <span className="material-title">{mat.title}</span>
                    </div>
                    <a
                      href={`https://tomato-advanced-quelea-361.mypinata.cloud/ipfs/${mat.ipfsHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="material-link"
                    >
                      📄 View PDF
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default MaterialsPanel;
