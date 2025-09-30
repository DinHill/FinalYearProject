import React, { createContext, useCallback, useMemo, useState } from 'react';

type UserRole = 'student' | 'teacher';

interface RoleContextValue {
  isAuthenticated: boolean;
  role: UserRole | null;
  login: (username: string, password: string) => Promise<{ ok: boolean; message?: string }>;
  logout: () => void;
}

export const RoleContext = createContext<RoleContextValue>({
  isAuthenticated: false,
  role: null,
  login: async () => ({ ok: false }),
  logout: () => {},
});

export const RoleProvider = ({ children }: { children: React.ReactNode }) => {
  const [role, setRole] = useState<UserRole | null>(null);

  const login = useCallback(async (username: string, password: string) => {
    // Demo accounts
    if (username === 'HieuNDGCD220033' && password === 'Hieu@123456') {
      setRole('student');
      return { ok: true };
    }
    if (username === 'TeacherDemo' && password === 'Teacher@123456') {
      setRole('teacher');
      return { ok: true };
    }
    return { ok: false, message: 'Invalid credentials' };
  }, []);

  const logout = useCallback(() => {
    setRole(null);
  }, []);

  const value = useMemo(
    () => ({ isAuthenticated: !!role, role, login, logout }),
    [role, login, logout],
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
};


