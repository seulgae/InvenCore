import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import ItemsPage from './pages/ItemsPage';
import JoinPage from './pages/JoinPage';

// 로그인이 필요한 페이지를 감싸는 PrivateRoute 컴포넌트
// 인증 여부를 확인하고, 인증되지 않은 경우 로그인 페이지로 리디렉션합니다.
function PrivateRoute({ children }) {
    const isAuthenticated = localStorage.getItem('accessToken') !== null;
    return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function App() {
    return (
        <Router>
            <Routes>
                {/* 앱의 기본 경로(/)로 접속 시 /login으로 자동 이동시킵니다. */}
                <Route path="/" element={<Navigate to="/login" replace />} />

                {/* 로그인 페이지 경로 */}
                <Route path="/login" element={<LoginPage />} />

                {/* 회원가입 페이지 경로 */}
                <Route path="/join" element={<JoinPage />} />

                {/* '/items' 경로는 PrivateRoute로 보호됩니다. */}
                <Route
                    path="/items"
                    element={
                        <PrivateRoute>
                            <ItemsPage />
                        </PrivateRoute>
                    }
                />
            </Routes>
        </Router>
    );
}

export default App;