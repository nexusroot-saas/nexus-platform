import React, { createContext, useState, useEffect } from 'react';
import {
  getToken,
  setToken,
  removeToken,
  isAuthenticated,
} from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (token && isAuthenticated()) {
      // Decodificar JWT para pegar role/companyid
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUser(payload);
    }
    setLoading(false);
  }, []);

  const login = (token) => {
    setToken(token);
    const payload = JSON.parse(atob(token.split('.')[1]));
    setUser(payload);
  };

  const logout = () => {
    setUser(null);
    removeToken();
  };

  // Só TENANTADMIN acessa templates
  const canManageTemplates = user?.role === 'TENANTADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
        canManageTemplates,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
