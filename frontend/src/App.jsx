import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import MainPage from './pages/MainPage';
import BoardList from './pages/BoardList';
import BoardDetail from './pages/BoardDetail';
import BoardEdit from './pages/BoardEdit';
import BoardRegist from './pages/BoardRegist';

function PrivateRoute({ children }) {
    const isAuthenticated = localStorage.getItem('accessToken') !== null;
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
                    {/* ✅ 게시판 라우트를 MainPage의 자식으로 설정 */}
                    <Route path="board" element={<BoardList />} /> {/* ✅ PrivateRoute 제거 */}
                    <Route path="board/regist" element={<PrivateRoute><BoardRegist /></PrivateRoute>} />
                    <Route path="board/:id" element={<BoardDetail />} /> {/* ✅ PrivateRoute 제거 */}
                    <Route path="board/edit/:id" element={<PrivateRoute><BoardEdit /></PrivateRoute>} />
                </Route>
            </Routes>
        </Router>
    );
}

export default App;