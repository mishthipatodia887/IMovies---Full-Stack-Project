import { createContext, useContext, useEffect, useState } from 'react';
import { api, getToken } from '../api';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // restore the session from the stored JWT
  useEffect(() => {
    if (getToken()) api('/auth/me').then(r => setUser(r.user)).catch(() => localStorage.removeItem('im_token'));
  }, []);

  const authenticate = async (mode, name, password) => {
    const r = await api(`/auth/${mode}`, { method: 'POST', body: { name, password } });
    localStorage.setItem('im_token', r.token);
    setUser(r.user);
    return r.user;
  };
  const logout = () => { localStorage.removeItem('im_token'); setUser(null); };

  return <Ctx.Provider value={{ user, isAdmin: user?.role === 'admin', login: (n, p) => authenticate('login', n, p), register: (n, p) => authenticate('register', n, p), logout }}>{children}</Ctx.Provider>;
}
