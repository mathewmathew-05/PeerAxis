import { useState, useEffect, createContext, useContext } from "react";
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
        const response = await fetch(
          `http://localhost:5000/api/users/${parsedUser.user_id}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch user");
        }

        const data = await response.json();

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
    setIsLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      setUser(data.user);
      localStorage.setItem(
        "mentoring_user",
        JSON.stringify(data.user)
      );

      return data.user;
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------------
  // REGISTER
  // -------------------------------
  const register = async (userData) => {
    setIsLoading(true);

    try {
      setUser(null);
      localStorage.removeItem("mentoring_user");
      
      const response = await fetch(
        "http://localhost:5000/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      setUser(data.user);
      localStorage.setItem(
        "mentoring_user",
        JSON.stringify(data.user)
      );

      return data.user;
    } finally {
      setIsLoading(false);
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
