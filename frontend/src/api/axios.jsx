import axios from "axios";
import { isTokenExpired } from "../services/tokenSession";

const apiClient = axios.create({ baseURL: "/api", withCredentials: true });
const isLoginRequest = (config) =>
  /\/members\/(login|register)(?:\?|$)/.test(config?.url || "");
const isPublicBoardRequest = (config) =>
  /^\/(requestboards|comments|benchmarks|gw-sync|order-lab|practice)(?:\/|\?|$)/.test(config?.url || "");

apiClient.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("accessToken");
  if (token && !isLoginRequest(config) && !isPublicBoardRequest(config)) {
    if (isTokenExpired(token)) {
      const error = new Error(
        "로그인이 만료되었습니다. 다시 로그인한 후 요청해 주세요.",
      );
      error.code = "AUTH_EXPIRED";
      error.config = config;
      return Promise.reject(error);
    }
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      !isLoginRequest(error.config) &&
      !isPublicBoardRequest(error.config) &&
      (error.code === "AUTH_EXPIRED" || error.response?.status === 401)
    ) {
      sessionStorage.removeItem("accessToken");
      sessionStorage.removeItem("username");
      sessionStorage.removeItem("role");
      // Keep the current route and draft mounted while the user signs in again.
      window.dispatchEvent(new Event("invencore:authentication-required"));
    }
    return Promise.reject(error);
  },
);

export default apiClient;
