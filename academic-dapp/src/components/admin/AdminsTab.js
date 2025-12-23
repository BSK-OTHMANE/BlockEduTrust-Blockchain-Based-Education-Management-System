import { useEffect, useState } from "react";
import { CONTRACT_ADDRESS, ABI } from "../../constants/contract";
import { ethers } from "ethers";
import { useAuth } from "../../context/AuthContext";

const API_URL = "http://127.0.0.1:8000";

function AdminsTab() {
  const { account } = useAuth();

  const [admins, setAdmins] = useState([]);
  const [newAdminAddress, setNewAdminAddress] = useState("");
  const [newAdminName, setNewAdminName] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [loading, setLoading] = useState(false);

  /* ============================
        FETCH ADMINS (DB)
  ============================ */
  async function fetchAdmins() {
    try {
      const res = await fetch(`${API_URL}/admin/users/?role=ADMIN`);
      if (!res.ok) throw new Error("Failed to fetch admins");
      const data = await res.json();
      setAdmins(data);
    } catch (err) {
      console.error(err);
      alert("Cannot fetch admins (backend issue)");
    }
  }

  useEffect(() => {
    fetchAdmins();
  }, []);

  /* ============================
        CONTRACT INSTANCE
  ============================ */
  async function getContract() {
    if (!window.ethereum) throw new Error("MetaMask not found");
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
  }

  /* ============================
        ADD ADMIN
  ============================ */
  async function handleAddAdmin() {
    if (!newAdminAddress || !newAdminName || !newAdminEmail) {
      alert("Please fill all fields");
      return;
    }

    try {
      setLoading(true);

      const contract = await getContract();

      // ⛓️ 1. Blockchain (authority)
      const tx = await contract.addAdmin(newAdminAddress);
      await tx.wait();

      // 🗄️ 2. Backend (metadata)
      const res = await fetch(`${API_URL}/admin/users/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: newAdminAddress,
          role: "ADMIN",
          name: newAdminName,
          email: newAdminEmail
        })
      });

      if (!res.ok) {
        throw new Error("Backend user creation failed");
      }

      // Reset form
      setNewAdminAddress("");
      setNewAdminName("");
      setNewAdminEmail("");

      fetchAdmins();
    } catch (err) {
      console.error(err);
      alert("Error adding admin (check blockchain or backend)");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h3>Admins</h3>

      {/* ADD ADMIN FORM */}
      <div className="card">
        <h4>Add Admin</h4>
        <div className="form-row">
          <input
            placeholder="Admin address"
            value={newAdminAddress}
            onChange={(e) => setNewAdminAddress(e.target.value)}
          />

          <input
            placeholder="Admin name"
            value={newAdminName}
            onChange={(e) => setNewAdminName(e.target.value)}
          />

          <input
            placeholder="Admin email"
            value={newAdminEmail}
            onChange={(e) => setNewAdminEmail(e.target.value)}
          />

          <button className="btn-primary" onClick={handleAddAdmin} disabled={loading}>
            {loading ? "Adding..." : "Add Admin"}
          </button>
        </div>
      </div>

      {/* ADMINS TABLE */}
      <table className="data-table" cellPadding="8">
        <thead>
          <tr>
            <th>Name</th>
            <th>Address</th>
            <th>Email</th>
          </tr>
        </thead>
        <tbody>
          {admins.map((admin) => (
            <tr key={admin.address}>
              <td>{admin.name}</td>
              <td>{admin.address}</td>
              <td>{admin.email}</td>
            </tr>
          ))}

          {admins.length === 0 && (
            <tr>
              <td colSpan="3">No admins found</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default AdminsTab;
