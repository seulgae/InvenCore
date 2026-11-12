import apiClient from "../api/axios";

/** 상태 확인 API로 서버에 연결할 수 있는지 검사합니다. */
export const checkServerHealth = async () => {
  try {
    const response = await apiClient.get("/health");
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("서버 상태 확인 실패:", error);
    return {
      success: false,
      error: error.response?.data || error.message,
    };
  }
};
