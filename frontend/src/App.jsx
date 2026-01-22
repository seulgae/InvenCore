import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
// import LoginPage from './pages/LoginPage'; // LoginPage 임포트 제거
import ItemsPage from './pages/ItemsPage';
// import JoinPage from './pages/JoinPage';   // JoinPage 임포트 제거
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
                {/* 앱의 기본 경로(/)로 접속 시 MainPage를 렌더링합니다. */}
                <Route path="/" element={<MainPage />} />

                {/* 로그인 페이지 경로 및 회원가입 페이지 경로 제거 */}
                {/* <Route path="/login" element={<LoginPage />} */}
                {/* <Route path="/join" element={<JoinPage />} */}

                {/* '/items' 경로는 PrivateRoute로 보호됩니다. */}
                <Route
                    path="/items"
                    element={
                        <PrivateRoute>
                            <ItemsPage />
                        </PrivateRoute>
                    }
                />
                {/* '/items/new' 경로는 PrivateRoute로 보호됩니다. */}
                {/* ProductRegistrationPage는 아직 App.jsx에 추가되지 않았지만,
                    MainPage.jsx에서 Link to="/items/new"로 연결될 예정이므로
                    여기에 라우트를 추가해야 합니다. */}
                <Route
                    path="/items/new"
                    element={
                        <PrivateRoute>
                            {/* ProductRegistrationPage 임포트 추가 */}
                            {/* import ProductRegistrationPage from './pages/ProductRegistrationPage'; */}
                            {/* <ProductRegistrationPage /> */}
                            {/* 이 부분은 다음 단계에서 ProductRegistrationPage를 App.jsx에 추가할 때 처리하겠습니다. */}
                            {/* 현재는 MainPage에서 모달을 띄우는 것에 집중합니다. */}
                            <ItemsPage /> {/* 임시로 ItemsPage로 대체 */}
                        </PrivateRoute>
                    }
                />
            </Routes>
        </Router>
    );
}

export default App;