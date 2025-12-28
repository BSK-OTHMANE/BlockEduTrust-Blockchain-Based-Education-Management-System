import { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [account, setAccount] = useState(null);
  const [role, setRole] = useState(null); // 1 admin, 2 prof, 3 student
  const [userName, setUserName] = useState(null);

  return (
    <AuthContext.Provider value={{ account, role, userName, setAccount, setRole, setUserName }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
