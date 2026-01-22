import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import MainPage from './pages/MainPage';

// 로그인이 필요한 페이지를 감싸는 PrivateRoute 컴포넌트
// 인증 여부를 확인하고, 인증되지 않은 경우 로그인 페이지로 리디렉션합니다.
function PrivateRoute({ children }) {
    const isAuthenticated = localStorage.getItem('accessToken') !== null;
    // 이제 /login 경로가 없어지므로, 인증되지 않은 경우 메인 페이지로 리디렉션하거나
    // 다른 방식으로 처리해야 합니다. 여기서는 일단 메인 페이지로 리디렉션하도록 변경합니다.
    // 하지만 실제로는 MainPage에서 모달을 띄우는 방식이므로, 이 PrivateRoute는
    // /items와 같은 보호된 경로에만 사용될 것입니다.
    return isAuthenticated ? children : <Navigate to="/" replace />;
}

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<MainPage />} />
            </Routes>
        </Router>
    );
}

export default App;