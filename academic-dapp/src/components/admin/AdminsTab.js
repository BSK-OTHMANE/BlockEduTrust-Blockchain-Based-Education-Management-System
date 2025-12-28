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
      <div className="form-card">
        <h4>Add New Admin</h4>
        <form onSubmit={(e) => { e.preventDefault(); handleAddAdmin(); }}>
          <div className="form-group">
            <label htmlFor="admin-address">Wallet Address *</label>
            <input
              id="admin-address"
              type="text"
              placeholder="0x742d35Cc6634C0532925a3b844Bc666B42999999"
              value={newAdminAddress}
              onChange={(e) => setNewAdminAddress(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="admin-name">Full Name *</label>
            <input
              id="admin-name"
              type="text"
              placeholder="John Doe"
              value={newAdminName}
              onChange={(e) => setNewAdminName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="admin-email">Email Address *</label>
            <input
              id="admin-email"
              type="email"
              placeholder="john.doe@university.edu"
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "Adding..." : "Add Admin"}
          </button>
        </form>
      </div>

      {/* ADMINS TABLE */}
      <div className="table-card">
        <h4>Admins List</h4>
        {admins.length === 0 ? (
          <p className="empty-message">No admins found</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name & Address</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => (
                <tr key={admin.address}>
                  <td>
                    <div className="name-with-address">
                      <span className="primary-name">{admin.name}</span>
                      <span className="secondary-address">{admin.address}</span>
                    </div>
                  </td>
                  <td>{admin.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default AdminsTab;
