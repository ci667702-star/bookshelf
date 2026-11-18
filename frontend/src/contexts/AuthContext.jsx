import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../services/index.js';
import { setUnauthorizedHandler } from '../services/api.js';

const AuthContext = createContext(null);

// 계정이 바뀔 때 이전 사용자의 캐시를 지운다.
// (qc.clear() 는 살아 있는 ['me'] 구독까지 끊어 로그인 상태가 갱신되지 않으므로 'me' 는 남긴다)
export function resetUserCache(qc, me) {
  qc.cancelQueries();
  qc.removeQueries({ predicate: (q) => q.queryKey[0] !== 'me' });
  qc.setQueryData(['me'], me);
}

export function AuthProvider({ children }) {
  const qc = useQueryClient();
  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      try {
        return await authApi.me();
      } catch (err) {
        if (err.status === 401) return null;
        throw err;
      }
    },
    staleTime: 60 * 1000,
    retry: 1,
  });

  // 다른 요청에서 401(세션 만료)이 나면 로그아웃 상태로 전환
  useEffect(() => {
    setUnauthorizedHandler(() => qc.setQueryData(['me'], null));
  }, [qc]);

  const login = useCallback(
    async (body) => {
      const res = await authApi.login(body);
      resetUserCache(qc, { user: res.user });
      qc.invalidateQueries({ queryKey: ['me'] });
      return res.user;
    },
    [qc]
  );

  const register = useCallback(
    async (body) => {
      const res = await authApi.register(body);
      resetUserCache(qc, { user: res.user });
      return res.user;
    },
    [qc]
  );

  const logout = useCallback(async () => {
    await authApi.logout().catch(() => {});
    resetUserCache(qc, null);
  }, [qc]);

  const refresh = useCallback(() => qc.invalidateQueries({ queryKey: ['me'] }), [qc]);

  const value = useMemo(
    () => ({
      user: meQuery.data?.user ?? null,
      isLoading: meQuery.isPending,
      isError: meQuery.isError,
      login,
      register,
      logout,
      refresh,
    }),
    [meQuery.data, meQuery.isPending, meQuery.isError, login, register, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
