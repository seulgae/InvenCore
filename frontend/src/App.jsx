import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import MainPage from './pages/MainPage';
import RequestBoardList from './pages/requestboard/RequestBoardList';
import RequestBoardDetail from './pages/requestboard/RequestBoardDetail';
import RequestBoardEdit from './pages/requestboard/RequestBoardEdit';
import RequestBoardRegist from './pages/requestboard/RequestBoardRegist';
import NoticeList from './pages/notice/NoticeList';
import NoticeDetail from './pages/notice/NoticeDetail';
import NoticeEdit from './pages/notice/NoticeEdit';
import NoticeRegist from './pages/notice/NoticeRegist';
import ServerCapacityPage from './pages/servercapacity/ServerCapacityPage'; // 컴포넌트 임포트

function PrivateRoute({ children }) {
    const isAuthenticated = sessionStorage.getItem('accessToken') !== null;
    if (!isAuthenticated) {
        alert('로그인이 필요합니다.');
        return <Navigate to="/" replace />;
    }
    return children;
}

function App() {
    return (
        <Router>
            <Routes>
                {/* ✅ MainPage가 레이아웃 역할을 하도록 중첩 구조로 변경 */}
                <Route path="/" element={<MainPage />}>
                    <Route path="requestboard" element={<RequestBoardList />} />
                    <Route path="requestboard/regist" element={<PrivateRoute><RequestBoardRegist /></PrivateRoute>} />
                    <Route path="requestboard/:id" element={<RequestBoardDetail />} />
                    <Route path="requestboard/edit/:id" element={<PrivateRoute><RequestBoardEdit /></PrivateRoute>} />
                    <Route path="notice" element={<NoticeList />} />
                    <Route path="notice/regist" element={<PrivateRoute><NoticeRegist /></PrivateRoute>} />
                    <Route path="notice/:id" element={<NoticeDetail />} />
                    <Route path="notice/edit/:id" element={<PrivateRoute><NoticeEdit /></PrivateRoute>} />
                    {/* 서버용량조사 페이지 라우트 추가 */}
                    <Route path="servercapacity" element={<PrivateRoute><ServerCapacityPage /></PrivateRoute>} />
                </Route>
            </Routes>
        </Router>
    );
}

export default App;
