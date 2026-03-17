// Armazena JWT no localStorage
export const setToken = (token) => localStorage.setItem('nexus_token', token);
export const getToken = () => localStorage.getItem('nexus_token');
export const removeToken = () => localStorage.removeItem('nexus_token');

// Verifica se token válido (simples)
export const isAuthenticated = () => Boolean(getToken());
