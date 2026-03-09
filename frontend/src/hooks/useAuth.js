import { useState, useEffect, createContext, useContext } from "react";
import api from "../lib/api";
import { USER_ROLES } from "../types";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // 🔥 FIX: Sync user with DB on app load
  useEffect(() => {
    const loadUser = async () => {
      const savedUser = localStorage.getItem("mentoring_user");

      if (!savedUser) {
        setIsLoading(false);
        return;
      }

      const parsedUser = JSON.parse(savedUser);

      try {
        // Always fetch latest user from DB
        const response = await api.get(`/users/${parsedUser.user_id}`);
        const data = response.data;

        setUser(data.user);
        localStorage.setItem(
          "mentoring_user",
          JSON.stringify(data.user)
        );
      } catch (err) {
        console.error("User sync failed, using cached user:", err);
        // fallback to cached user if API fails
        setUser(parsedUser);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  // -------------------------------
  // LOGIN
  // -------------------------------
  const login = async (email, password) => {
    try {
      const res = await api.post("/auth/login", { email, password });

      const { user, token } = res.data;
      const userWithToken = { ...user, token };

      setUser(userWithToken);
      localStorage.setItem("mentoring_user", JSON.stringify(userWithToken));

      return userWithToken;
    } catch (err) {
      console.error("Login failed:", err);
      throw err;
    }
  };

  // -------------------------------
  // REGISTER
  // -------------------------------
  const register = async (userData) => {
    try {
      const res = await api.post("/auth/register", userData);

      const { user, token } = res.data;
      const userWithToken = { ...user, token };

      setUser(userWithToken);
      localStorage.setItem("mentoring_user", JSON.stringify(userWithToken));

      return userWithToken;
    } catch (err) {
      console.error("Registration failed:", err);
      throw err;
    }
  };

  // -------------------------------
  // LOGOUT
  // -------------------------------
  const logout = () => {
    setUser(null);
    localStorage.removeItem("mentoring_user");
  };

  // -------------------------------
  // UPDATE PROFILE (PARTIAL UPDATE)
  // -------------------------------
  const updateProfile = (updates) => {
    setUser((prevUser) => {
      const updatedUser = { ...prevUser, ...updates };
      localStorage.setItem(
        "mentoring_user",
        JSON.stringify(updatedUser)
      );
      return updatedUser;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
