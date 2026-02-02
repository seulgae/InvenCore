import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import '../styles/MainPage.css';
import LoginPage from './auth/LoginPage';
import JoinPage from './auth/JoinPage';
import apiClient from '../api/axios';

function MainPage() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [username, setUsername] = useState('');
    const [role, setRole] = useState(null);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const [notices, setNotices] = useState([]);
    const location = useLocation();
    const navigate = useNavigate();
    const isHomePage = location.pathname === '/';

    useEffect(() => {
        const accessToken = sessionStorage.getItem('accessToken');
        const storedUsername = sessionStorage.getItem('username');
        const storedRole = sessionStorage.getItem('role');

        if (accessToken && storedUsername && storedRole) {
            setIsLoggedIn(true);
            setUsername(storedUsername);
            setRole(parseInt(storedRole, 10));
        }
    }, []);

    useEffect(() => {
        if (isHomePage) {
            fetchNotices();
        }
    }, [isHomePage]);

    const fetchNotices = async () => {
        try {
            const response = await apiClient.get('/notices');
            setNotices(response.data.slice(0, 5));
        } catch (err) {
            console.error('공지사항 목록을 불러오는 데 실패했습니다.', err);
        }
    };

    useEffect(() => {
        if (isSidebarOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = 'auto';
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isSidebarOpen]);

    const handleLogout = () => {
        sessionStorage.removeItem('accessToken');
        sessionStorage.removeItem('username');
        sessionStorage.removeItem('role');
        setIsLoggedIn(false);
        setUsername('');
        setRole(null);
        window.location.reload();
    };

    const handleLoginSuccess = (loggedInUsername, loggedInRole) => {
        setIsLoggedIn(true);
        setUsername(loggedInUsername);
        setRole(loggedInRole);
        setShowLoginModal(false);
    };

    const handleJoinSuccess = () => {
        setShowJoinModal(false);
        setShowLoginModal(true);
    };

    const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
    const closeSidebar = () => setIsSidebarOpen(false);

    return (
        <div className="page-wrapper">
            <nav className="navbar">
                <div className="navbar-left">
                    <button
                        className="menu-button"
                        onClick={toggleSidebar}
                        aria-label="메뉴 열기"
                        aria-expanded={isSidebarOpen}
                    >
                        <span />
                        <span />
                        <span />
                    </button>

                    <div className="navbar-logo">
                        <a href="/">
                            <span>InvenCore</span>
                        </a>
                    </div>
                </div>

                <div className="navbar-auth">
                    {isLoggedIn ? (
                        <>
                            <span className="navbar-welcome">{username}님 </span>
                            <button onClick={handleLogout} className="nav-button">
                                로그아웃
                            </button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => setShowLoginModal(true)} className="nav-button">
                                로그인
                            </button>
                            <button onClick={() => setShowJoinModal(true)} className="nav-button">
                                회원가입
                            </button>
                        </>
                    )}
                </div>
            </nav>

            <div
                className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`}
                onClick={closeSidebar}
                aria-hidden={!isSidebarOpen}
            />

            <div className="main-page-container">
                <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
                    <ul>
                        <li><Link to="/notice" onClick={closeSidebar}>공지사항</Link></li>
                        <li><Link to="/requestboard" onClick={closeSidebar}>요청 게시판</Link></li>
                        {/* 모든 로그인 사용자가 볼 수 있도록 isLoggedIn으로 조건 변경 */}
                        {isLoggedIn && (
                            <li><Link to="/servercapacity" onClick={closeSidebar}>서버용량조사</Link></li>
                        )}
                    </ul>
                </aside>

                <div className={`main-content ${isSidebarOpen ? 'sidebar-open' : ''}`}>
                    {isHomePage ? (
                        <div className="home-content">
                            <div className="board-section">
                                <div className="section-header">
                                    <h2>공지사항</h2>
                                    <button onClick={() => navigate('/notice')} className="more-button">더보기</button>
                                </div>
                                <div className="board-list-preview">
                                    {notices.length === 0 ? (
                                        <p className="home-empty-message">공지사항이 없습니다.</p>
                                    ) : (
                                        notices.map(notice => (
                                            <div
                                                key={notice.id}
                                                className="board-item-preview"
                                                onClick={() => navigate(`/notice/${notice.id}`)}
                                            >
                                                <h3>{notice.title}</h3>
                                                <div className="item-meta">
                                                    <span>{notice.author}</span>
                                                    <span>{new Date(notice.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <Outlet context={{
                            isLoggedIn,
                            userRole: role,
                            openLoginModal: () => setShowLoginModal(true),
                            openJoinModal: () => setShowJoinModal(true)
                        }} />
                    )}
                </div>
            </div>

            {showLoginModal && (
                <LoginPage
                    onClose={() => setShowLoginModal(false)}
                    onLoginSuccess={handleLoginSuccess}
                />
            )}

            {showJoinModal && (
                <JoinPage
                    onClose={() => setShowJoinModal(false)}
                    onJoinSuccess={handleJoinSuccess}
                />
            )}
        </div>
    );
}

export default MainPage;
