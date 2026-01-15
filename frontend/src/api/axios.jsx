import axios from 'axios';

// 백엔드 API의 기본 URL
// Vite에서는 `import.meta.env.VITE_` 접두사를 사용해야 합니다.
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// 기본 인스턴스 생성
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 요청 인터셉터(interceptor) 추가
// API 요청을 보내기 전에 헤더에 JWT 토큰을 추가합니다.
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken'); // 로컬 스토리지에서 토큰 가져오기
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default apiClient;