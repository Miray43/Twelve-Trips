import { createContext, useContext, useState, useCallback } from 'react';
import { api, getToken, setToken } from './api.js';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [email, setEmail] = useState(() => (getToken() ? sessionStorage.getItem('tt_email') : null));

  const finish = (data) => {
    setToken(data.token);
    try { sessionStorage.setItem('tt_email', data.user.email); } catch { /* ignore */ }
    setEmail(data.user.email);
  };
  const login = useCallback(async (e, p) => finish(await api('/auth/login', { method: 'POST', body: { email: e, password: p } })), []);
  const signup = useCallback(async (e, p) => finish(await api('/auth/signup', { method: 'POST', body: { email: e, password: p } })), []);
  const logout = useCallback(() => { setToken(null); try { sessionStorage.removeItem('tt_email'); } catch { /* ignore */ } setEmail(null); }, []);

  return <AuthCtx.Provider value={{ email, login, signup, logout }}>{children}</AuthCtx.Provider>;
}
