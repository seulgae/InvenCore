import apiClient from '../api/axios';

export const login = async (username, password) => {
    try {
        const response = await apiClient.post('/members/login', {
            username,
            password,
        });

        // ✅ 응답에서 role도 추출
        const { success, token, username: loggedInUsername, role } = response.data;

        if (success && token) {
            sessionStorage.setItem('accessToken', token);
            sessionStorage.setItem('username', loggedInUsername);
            sessionStorage.setItem('role', role); // ✅ role 저장

            // ✅ role도 함께 반환
            return { success: true, username: loggedInUsername, role };
        }
        return { success: false };
    } catch (error) {
        console.error('로그인 실패:', error.response ? error.response.data : error.message);
        throw error;
    }
};

export const logout = () => {
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('username');
    sessionStorage.removeItem('role'); // ✅ 로그아웃 시 role도 제거
};

export const join = async (username, password) => {
    try {
        await apiClient.post('/members/register', {
            username,
            password,
        });
    } catch (error) {
        console.error('회원가입 실패:', error.response ? error.response.data : error.message);
        throw error;
    }
};

export const checkUsernameAvailability = async (username) => {
    try {
        const response = await apiClient.get(`/members/check-username?username=${username}`);
        return response.data;
    } catch (error) {
        console.error('아이디 중복 확인 실패:', error.response ? error.response.data : error.message);
        throw error;
    }
};