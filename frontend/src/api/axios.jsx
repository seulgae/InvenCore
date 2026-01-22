import axios from 'axios';

// 1. 환경 변수 설정
// 개발(.env)과 배포(.env.production) 환경에 따라 주소가 자동으로 바뀝니다.
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    // 백엔드 SecurityConfig에서 .allowCredentials(true)를 설정했으므로 필수입니다.
    withCredentials: true,
});

// 2. 요청 인터셉터 (Request Interceptor)
// API 요청을 보낼 때마다 헤더에 토큰을 자동으로 실어 보냅니다.
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');

        // 토큰이 존재하면 Authorization 헤더 추가
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 3. 응답 인터셉터 (Response Interceptor)
// 백엔드 응답을 받았을 때 에러를 가로채서 처리합니다.
apiClient.interceptors.response.use(
    (response) => {
        // 정상 응답이면 그대로 리턴
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // 에러가 발생했는데, 상태 코드가 401(Unauthorized)이고
        // 아직 재시도를 안 한 요청이라면 (무한 루프 방지)
        if (error.response && error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            console.warn('인증이 만료되어 로그아웃 처리됩니다.');

            // 1. 로컬 스토리지의 토큰 삭제
            localStorage.removeItem('accessToken');

            // 2. 로그인 페이지로 강제 이동
            // .jsx 파일이라도 컴포넌트 내부가 아니므로 useNavigate 훅을 쓸 수 없습니다.
            // 따라서 window.location을 사용하여 이동시킵니다.
            window.location.href = '/login';

            return Promise.reject(error);
        }

        // 401 이외의 에러는 호출한 컴포넌트에서 catch로 처리하도록 넘김
        return Promise.reject(error);
    }
);

export default apiClient;