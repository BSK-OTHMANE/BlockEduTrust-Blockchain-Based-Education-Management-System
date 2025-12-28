import { ethers } from "ethers";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { CONTRACT_ADDRESS, ABI } from "../constants/contract";
import logo from "../BlockEduTrustLogo.png";
import "./Page.css";

// const CONTRACT_ADDRESS = "0x670EC683C06fFCF0ea7D1bF5F6386429B23320E6";
// const ABI = [
// 	{
// 		"inputs": [],
// 		"stateMutability": "nonpayable",
// 		"type": "constructor"
// 	},
// 	{
// 		"anonymous": false,
// 		"inputs": [
// 			{
// 				"indexed": true,
// 				"internalType": "address",
// 				"name": "user",
// 				"type": "address"
// 			},
// 			{
// 				"indexed": false,
// 				"internalType": "string",
// 				"name": "action",
// 				"type": "string"
// 			},
// 			{
// 				"indexed": false,
// 				"internalType": "uint256",
// 				"name": "timestamp",
// 				"type": "uint256"
// 			}
// 		],
// 		"name": "ActionLog",
// 		"type": "event"
// 	},
// 	{
// 		"inputs": [
// 			{
// 				"internalType": "address",
// 				"name": "_admin",
// 				"type": "address"
// 			}
// 		],
// 		"name": "addAdmin",
// 		"outputs": [],
// 		"stateMutability": "nonpayable",
// 		"type": "function"
// 	},
// 	{
// 		"inputs": [
// 			{
// 				"internalType": "uint256",
// 				"name": "_assignmentId",
// 				"type": "uint256"
// 			},
// 			{
// 				"internalType": "address",
// 				"name": "_student",
// 				"type": "address"
// 			},
// 			{
// 				"internalType": "uint8",
// 				"name": "_grade",
// 				"type": "uint8"
// 			},
// 			{
// 				"internalType": "string",
// 				"name": "_note",
// 				"type": "string"
// 			}
// 		],
// 		"name": "addGrade",
// 		"outputs": [],
// 		"stateMutability": "nonpayable",
// 		"type": "function"
// 	},
// 	{
// 		"inputs": [
// 			{
// 				"internalType": "address",
// 				"name": "_prof",
// 				"type": "address"
// 			}
// 		],
// 		"name": "addProfessor",
// 		"outputs": [],
// 		"stateMutability": "nonpayable",
// 		"type": "function"
// 	},
// 	{
// 		"inputs": [
// 			{
// 				"internalType": "address",
// 				"name": "_student",
// 				"type": "address"
// 			}
// 		],
// 		"name": "addStudent",
// 		"outputs": [],
// 		"stateMutability": "nonpayable",
// 		"type": "function"
// 	},
// 	{
// 		"inputs": [
// 			{
// 				"internalType": "uint256",
// 				"name": "_moduleId",
// 				"type": "uint256"
// 			},
// 			{
// 				"internalType": "address",
// 				"name": "_prof",
// 				"type": "address"
// 			}
// 		],
// 		"name": "assignProfessorToModule",
// 		"outputs": [],
// 		"stateMutability": "nonpayable",
// 		"type": "function"
// 	},
// 	{
// 		"inputs": [
// 			{
// 				"internalType": "uint256",
// 				"name": "_moduleId",
// 				"type": "uint256"
// 			},
// 			{
// 				"internalType": "string",
// 				"name": "_ipfsHash",
// 				"type": "string"
// 			},
// 			{
// 				"internalType": "string",
// 				"name": "_publicKey",
// 				"type": "string"
// 			},
// 			{
// 				"internalType": "uint256",
// 				"name": "_deadline",
// 				"type": "uint256"
// 			}
// 		],
// 		"name": "createAssignment",
// 		"outputs": [],
// 		"stateMutability": "nonpayable",
// 		"type": "function"
// 	},
// 	{
// 		"inputs": [
// 			{
// 				"internalType": "string",
// 				"name": "_name",
// 				"type": "string"
// 			}
// 		],
// 		"name": "createModule",
// 		"outputs": [],
// 		"stateMutability": "nonpayable",
// 		"type": "function"
// 	},
// 	{
// 		"inputs": [
// 			{
// 				"internalType": "uint256",
// 				"name": "_moduleId",
// 				"type": "uint256"
// 			},
// 			{
// 				"internalType": "address",
// 				"name": "_student",
// 				"type": "address"
// 			}
// 		],
// 		"name": "enrollStudentInModule",
// 		"outputs": [],
// 		"stateMutability": "nonpayable",
// 		"type": "function"
// 	},
// 	{
// 		"inputs": [
// 			{
// 				"internalType": "uint256",
// 				"name": "_moduleId",
// 				"type": "uint256"
// 			}
// 		],
// 		"name": "removeModule",
// 		"outputs": [],
// 		"stateMutability": "nonpayable",
// 		"type": "function"
// 	},
// 	{
// 		"inputs": [
// 			{
// 				"internalType": "address",
// 				"name": "_prof",
// 				"type": "address"
// 			}
// 		],
// 		"name": "removeProfessor",
// 		"outputs": [],
// 		"stateMutability": "nonpayable",
// 		"type": "function"
// 	},
// 	{
// 		"inputs": [
// 			{
// 				"internalType": "uint256",
// 				"name": "_moduleId",
// 				"type": "uint256"
// 			}
// 		],
// 		"name": "removeProfessorFromModule",
// 		"outputs": [],
// 		"stateMutability": "nonpayable",
// 		"type": "function"
// 	},
// 	{
// 		"inputs": [
// 			{
// 				"internalType": "address",
// 				"name": "_student",
// 				"type": "address"
// 			}
// 		],
// 		"name": "removeStudent",
// 		"outputs": [],
// 		"stateMutability": "nonpayable",
// 		"type": "function"
// 	},
// 	{
// 		"inputs": [
// 			{
// 				"internalType": "uint256",
// 				"name": "_moduleId",
// 				"type": "uint256"
// 			},
// 			{
// 				"internalType": "address",
// 				"name": "_student",
// 				"type": "address"
// 			}
// 		],
// 		"name": "removeStudentFromModule",
// 		"outputs": [],
// 		"stateMutability": "nonpayable",
// 		"type": "function"
// 	},
// 	{
// 		"inputs": [
// 			{
// 				"internalType": "uint256",
// 				"name": "_assignmentId",
// 				"type": "uint256"
// 			},
// 			{
// 				"internalType": "string",
// 				"name": "_encryptedIpfsHash",
// 				"type": "string"
// 			}
// 		],
// 		"name": "submitAssignment",
// 		"outputs": [],
// 		"stateMutability": "nonpayable",
// 		"type": "function"
// 	},
// 	{
// 		"inputs": [],
// 		"name": "assignmentCount",
// 		"outputs": [
// 			{
// 				"internalType": "uint256",
// 				"name": "",
// 				"type": "uint256"
// 			}
// 		],
// 		"stateMutability": "view",
// 		"type": "function"
// 	},
// 	{
// 		"inputs": [
// 			{
// 				"internalType": "uint256",
// 				"name": "",
// 				"type": "uint256"
// 			}
// 		],
// 		"name": "assignments",
// 		"outputs": [
// 			{
// 				"internalType": "uint256",
// 				"name": "id",
// 				"type": "uint256"
// 			},
// 			{
// 				"internalType": "uint256",
// 				"name": "moduleId",
// 				"type": "uint256"
// 			},
// 			{
// 				"internalType": "string",
// 				"name": "ipfsHash",
// 				"type": "string"
// 			},
// 			{
// 				"internalType": "string",
// 				"name": "professorPublicKey",
// 				"type": "string"
// 			},
// 			{
// 				"internalType": "uint256",
// 				"name": "deadline",
// 				"type": "uint256"
// 			},
// 			{
// 				"internalType": "bool",
// 				"name": "exists",
// 				"type": "bool"
// 			}
// 		],
// 		"stateMutability": "view",
// 		"type": "function"
// 	},
// 	{
// 		"inputs": [
// 			{
// 				"internalType": "address",
// 				"name": "_user",
// 				"type": "address"
// 			}
// 		],
// 		"name": "getRole",
// 		"outputs": [
// 			{
// 				"internalType": "enum AcademicManagementSystem.Role",
// 				"name": "",
// 				"type": "uint8"
// 			}
// 		],
// 		"stateMutability": "view",
// 		"type": "function"
// 	},
// 	{
// 		"inputs": [
// 			{
// 				"internalType": "uint256",
// 				"name": "",
// 				"type": "uint256"
// 			},
// 			{
// 				"internalType": "address",
// 				"name": "",
// 				"type": "address"
// 			}
// 		],
// 		"name": "grades",
// 		"outputs": [
// 			{
// 				"internalType": "uint8",
// 				"name": "value",
// 				"type": "uint8"
// 			},
// 			{
// 				"internalType": "string",
// 				"name": "note",
// 				"type": "string"
// 			}
// 		],
// 		"stateMutability": "view",
// 		"type": "function"
// 	},
// 	{
// 		"inputs": [],
// 		"name": "moduleCount",
// 		"outputs": [
// 			{
// 				"internalType": "uint256",
// 				"name": "",
// 				"type": "uint256"
// 			}
// 		],
// 		"stateMutability": "view",
// 		"type": "function"
// 	},
// 	{
// 		"inputs": [
// 			{
// 				"internalType": "uint256",
// 				"name": "",
// 				"type": "uint256"
// 			}
// 		],
// 		"name": "modules",
// 		"outputs": [
// 			{
// 				"internalType": "uint256",
// 				"name": "id",
// 				"type": "uint256"
// 			},
// 			{
// 				"internalType": "string",
// 				"name": "name",
// 				"type": "string"
// 			},
// 			{
// 				"internalType": "address",
// 				"name": "professor",
// 				"type": "address"
// 			},
// 			{
// 				"internalType": "bool",
// 				"name": "exists",
// 				"type": "bool"
// 			}
// 		],
// 		"stateMutability": "view",
// 		"type": "function"
// 	},
// 	{
// 		"inputs": [
// 			{
// 				"internalType": "uint256",
// 				"name": "",
// 				"type": "uint256"
// 			},
// 			{
// 				"internalType": "address",
// 				"name": "",
// 				"type": "address"
// 			}
// 		],
// 		"name": "moduleStudents",
// 		"outputs": [
// 			{
// 				"internalType": "bool",
// 				"name": "",
// 				"type": "bool"
// 			}
// 		],
// 		"stateMutability": "view",
// 		"type": "function"
// 	},
// 	{
// 		"inputs": [
// 			{
// 				"internalType": "uint256",
// 				"name": "",
// 				"type": "uint256"
// 			},
// 			{
// 				"internalType": "address",
// 				"name": "",
// 				"type": "address"
// 			}
// 		],
// 		"name": "submissions",
// 		"outputs": [
// 			{
// 				"internalType": "address",
// 				"name": "student",
// 				"type": "address"
// 			},
// 			{
// 				"internalType": "string",
// 				"name": "encryptedIpfsHash",
// 				"type": "string"
// 			},
// 			{
// 				"internalType": "bool",
// 				"name": "graded",
// 				"type": "bool"
// 			}
// 		],
// 		"stateMutability": "view",
// 		"type": "function"
// 	}
// ];

function ConnectPage() {
  const navigate = useNavigate();
  const { setAccount, setRole, setUserName } = useAuth();

  async function connectWallet() {
    if (!window.ethereum) {
      alert("MetaMask not installed");
      return;
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const account = await signer.getAddress();

    const contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      ABI,
      signer
    );

    const role = await contract.getRole(account);

    // Fetch user name from backend
    try {
      const res = await fetch(`http://127.0.0.1:8000/admin/users/?role=${role == 1 ? 'ADMIN' : role == 2 ? 'PROFESSOR' : 'STUDENT'}`);
      const users = await res.json();
      const user = users.find(u => u.address.toLowerCase() === account.toLowerCase());
      if (user) {
        setUserName(user.name);
      }
    } catch (err) {
      console.error("Failed to fetch user name:", err);
    }

    setAccount(account);
    setRole(Number(role));

    if (role == 1) navigate("/admin");
    else if (role == 2) navigate("/professor");
    else if (role == 3) navigate("/student");
    else navigate("/norole");
  }

  return (
    <div className="center">
      <div className="center-card">
        <img src={logo} alt="BlockEduTrust Logo" className="login-logo" />
        <h1>BlockEduTrust</h1>
        <p>Secure, Blockchain-Based Education Management System</p>
        <p className="login-subtitle">Decentralized Academic Credentials on the Blockchain</p>
        <button onClick={connectWallet} className="login-btn">Connect Wallet with MetaMask</button>
      </div>
    </div>
  );
}

export default ConnectPage;
