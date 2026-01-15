import apiClient from '../api/axios';

export const getItems = async () => {
    try {
        // GET /items 요청
        // 인터셉터가 자동으로 Authorization 헤더를 추가해줍니다.
        const response = await apiClient.get('/items');
        return response.data; // 백엔드에서 보낸 아이템 목록 데이터
    } catch (error) {
        console.error('아이템 목록 조회 실패:', error.response ? error.response.data : error.message);
        // 401, 403 등의 에러가 발생하면 로그인 페이지로 리디렉션하는 로직 추가 가능
        throw error;
    }
};

export const createItem = async (itemData) => {
    try {
        // POST /items 요청
        const response = await apiClient.post('/items', itemData);
        return response.data;
    } catch (error) {
        console.error('아이템 생성 실패:', error.response ? error.response.data : error.message);
        throw error;
    }
};