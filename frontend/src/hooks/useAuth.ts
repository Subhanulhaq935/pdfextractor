"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { clearToken, getToken } from "@/lib/auth";
import { User } from "@/lib/types";

export function useAuth(requireAuth = true) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      if (requireAuth) router.replace("/login");
      return;
    }

    try {
      const res = await api.get<User>("/auth/me");
      setUser(res.data);
    } catch {
      clearToken();
      if (requireAuth) router.replace("/login");
    } finally {
      setLoading(false);
    }
  }, [requireAuth, router]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const logout = () => {
    clearToken();
    setUser(null);
    router.push("/login");
  };

  return { user, loading, logout, refetch: fetchUser };
}
