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
            localStorage.setItem('accessToken', token);
            localStorage.setItem('username', loggedInUsername);
            localStorage.setItem('role', role); // ✅ role 저장

            console.log('로그인 성공 및 토큰/사용자 정보 저장 완료!');
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
    localStorage.removeItem('accessToken');
    localStorage.removeItem('username');
    localStorage.removeItem('role'); // ✅ 로그아웃 시 role도 제거
    console.log('로그아웃 완료!');
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