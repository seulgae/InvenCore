import axios from "axios";
import { isTokenExpired } from "../services/tokenSession";

const apiClient = axios.create({ baseURL: "/api", withCredentials: true });

/** 로그인 요청인지 판별해 인증 오류 처리에서 구분합니다. */
const isLoginRequest = (config) => /\/members\/(login|register)(?:\?|$)/.test(config?.url || "");

/** 공개 게시판 API 요청인지 판별합니다. */
const isPublicBoardRequest = (config) =>
  /^\/(requestboards|comments|benchmarks|gw-sync|order-lab|practice)(?:\/|\?|$)/.test(
    config?.url || "",
  );

apiClient.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("accessToken");
  if (token && !isLoginRequest(config) && !isPublicBoardRequest(config)) {
    if (isTokenExpired(token)) {
      const error = new Error("로그인이 만료되었습니다. 다시 로그인한 후 요청해 주세요.");
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
      // 다시 로그인하는 동안 현재 경로와 작성 중인 폼을 유지합니다.
      window.dispatchEvent(new Event("invencore:authentication-required"));
    }
    return Promise.reject(error);
  },
);

export default apiClient;
