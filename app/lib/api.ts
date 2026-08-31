import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== "undefined" && error.response?.status === 401) {
      const currentPath = window.location.pathname;
      if (currentPath !== "/login" && currentPath !== "/register" && currentPath !== "/") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);
