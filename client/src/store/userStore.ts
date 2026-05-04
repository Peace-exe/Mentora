import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

interface User {
  first_name: string;
  last_name: string;
  email: string;
  role: "user" | "admin";
  photo_url: string | null;
}

interface UserStore {
  user: User | null;
  expires_at: string | null;
  wsToken: string | null;
  isHydrated: boolean;
  setUser: (user: User, expires_at: string) => void;
  setWsToken: (token: string) => void;
  clearUser: () => void;
  isLoggedIn: () => boolean;
  _setHydrated: () => void;
}

export const useUserStore = create<UserStore>()(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        expires_at: null,
        wsToken: null,
        isHydrated: false,

        setUser: (user, expires_at) =>
          set({ user, expires_at }, false, "setUser"),

        setWsToken: (token) =>
          set({ wsToken: token }, false, "setWsToken"),

        clearUser: () =>
          set({ user: null, expires_at: null, wsToken: null }, false, "clearUser"),

        isLoggedIn: () => {
          const { expires_at } = get();
          if (!expires_at) return false;
          return new Date(expires_at) > new Date();
        },

        _setHydrated: () =>
          set({ isHydrated: true }, false, "_setHydrated"),
      }),
      {
        name: "mentora-user",
        onRehydrateStorage: () => (state) => {
          state?._setHydrated();
        },
      }
    )
  )
);