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
  setUser: (user: User, expires_at: string) => void;
  clearUser: () => void;
  isLoggedIn: () => boolean;
}

export const useUserStore = create<UserStore>()(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        expires_at: null,

        setUser: (user, expires_at) =>
          set({ user, expires_at }, false, "setUser"),

        clearUser: () =>
          set({ user: null, expires_at: null }, false, "clearUser"),

        isLoggedIn: () => {
          const { expires_at } = get();
          if (!expires_at) return false;
          return new Date(expires_at) > new Date();
        },
      }),
      { name: "mentora-user" }
    )
  )
);