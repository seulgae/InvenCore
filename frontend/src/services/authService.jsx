import apiClient from '../api/axios';

export const login = async (username, password) => {
    try {
        // 백엔드의 /api/members/login 엔드포인트로 POST 요청
        const response = await apiClient.post('/members/login', {
            username,
            password,
        });

        // 응답 본문에서 토큰 추출
        const { success, token } = response.data;

        if (success && token) {
            // 토큰을 로컬 스토리지에 저장
            localStorage.setItem('accessToken', token);

            console.log('로그인 성공 및 토큰 저장 완료!');
            return true;
        }
        return false;
    } catch (error) {
        console.error('로그인 실패:', error.response ? error.response.data : error.message);
        throw error; // UI 컴포넌트에서 에러를 직접 처리할 수 있도록 에러를 다시 던집니다.
    }
};

export const logout = () => {
    // 로컬 스토리지에서 토큰 제거
    localStorage.removeItem('accessToken');
    console.log('로그아웃 완료!');
};

export const join = async (username, password) => {
    try {
        // 백엔드의 /api/members/register 엔드포인트로 POST 요청
        await apiClient.post('/members/register', {
            username,
            password,
        });
    } catch (error) {
        console.error('회원가입 실패:', error.response ? error.response.data : error.message);
        throw error; // UI 컴포넌트에서 에러를 직접 처리할 수 있도록 에러를 다시 던집니다.
    }
};

// 아이디 중복 확인 함수 추가
export const checkUsernameAvailability = async (username) => {
    try {
        // 백엔드의 /api/members/check-username 엔드포인트로 GET 요청
        const response = await apiClient.get(`/members/check-username?username=${username}`);
        return response.data; // { isAvailable: boolean } 형태의 응답을 기대
    } catch (error) {
        console.error('아이디 중복 확인 실패:', error.response ? error.response.data : error.message);
        throw error;
    }
};