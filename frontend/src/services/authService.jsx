import apiClient from "../api/axios";

/** 로그인 API에서 토큰을 받아 세션 정보를 저장합니다. */
export const login = async (username, password) => {
  try {
    const response = await apiClient.post("/members/login", {
      username,
      password,
    });

    // 로그인 응답에서 사용자 역할을 함께 읽습니다.
    const { success, token, username: loggedInUsername, role } = response.data;

    if (success && token) {
      sessionStorage.setItem("accessToken", token);
      sessionStorage.setItem("username", loggedInUsername);
      sessionStorage.setItem("role", role); // ✅ role 저장

      // 화면에서 세션을 구성할 수 있도록 사용자 역할도 반환합니다.
      return { success: true, username: loggedInUsername, role };
    }
    return { success: false };
  } catch (error) {
    console.error("로그인 실패:", error.response ? error.response.data : error.message);
    throw error;
  }
};

/** 저장한 토큰과 사용자 정보를 제거합니다. */
export const logout = () => {
  sessionStorage.removeItem("accessToken");
  sessionStorage.removeItem("username");
  sessionStorage.removeItem("role"); // ✅ 로그아웃 시 role도 제거
};

/** 회원가입 API에 입력 정보를 전달합니다. */
export const join = async (username, password) => {
  try {
    await apiClient.post("/members/register", {
      username,
      password,
    });
  } catch (error) {
    console.error("회원가입 실패:", error.response ? error.response.data : error.message);
    throw error;
  }
};

/** 아이디 중복 여부를 서버에 조회합니다. */
export const checkUsernameAvailability = async (username) => {
  try {
    const response = await apiClient.get(`/members/check-username?username=${username}`);
    return response.data;
  } catch (error) {
    console.error("아이디 중복 확인 실패:", error.response ? error.response.data : error.message);
    throw error;
  }
};
