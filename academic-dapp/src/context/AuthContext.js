import { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [account, setAccount] = useState(null);
  const [role, setRole] = useState(null); // 1 admin, 2 prof, 3 student

  return (
    <AuthContext.Provider value={{ account, role, setAccount, setRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
