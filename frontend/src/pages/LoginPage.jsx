import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../services/authService';
import { checkServerHealth } from '../services/healthService';

function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [serverStatus, setServerStatus] = useState(null);
    const navigate = useNavigate();

    // 컴포넌트 마운트 시 서버 상태 확인
    useEffect(() => {
        const verifyServer = async () => {
            const result = await checkServerHealth();
            setServerStatus(result.success);
            if (!result.success) {
                setError('서버에 연결할 수 없습니다. 서버 상태를 확인해주세요.');
            }
        };
        verifyServer();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); // 이전 에러 메시지 초기화

        if (!username || !password) {
            setError('아이디와 비밀번호를 모두 입력해주세요.');
            return;
        }

        try {
            const success = await login(username, password);
            if (success) {
                alert('로그인 성공!');
                // 로그인 성공 시 재고 목록 페이지로 이동
                navigate('/items');
            } else {
                // authService에서 false를 반환한 경우 (토큰이 없는 경우 등)
                setError('로그인에 실패했습니다. 아이디와 비밀번호를 확인해주세요.');
            }
        } catch (err) {
            // API 응답 상태 코드에 따라 다른 에러 메시지를 표시합니다.
            if (!err.response) {
                // 네트워크 에러 또는 서버 연결 실패
                setError('서버에 연결할 수 없습니다. 서버 상태를 확인해주세요.');
                setServerStatus(false);
            } else if (err.response.status === 401) {
                setError('아이디 또는 비밀번호가 올바르지 않습니다.');
            } else {
                setError('로그인 중 오류가 발생했습니다. 서버 상태를 확인해주세요.');
            }
            console.error(err);
        }
    };

    return (
        <div className="auth-card">
            <h1>INVENCORE</h1>
            <p style={{ color: '#666', marginBottom: '2rem', fontSize: '1.1rem' }}>로그인하여 시작하세요</p>
            
            {serverStatus === false && (
                <div className="status-message status-error">
                    <span>⚠️</span>
                    <span>서버 연결 실패: 서버 상태를 확인해주세요.</span>
                </div>
            )}
            {serverStatus === true && (
                <div className="status-message status-success">
                    <span>✓</span>
                    <span>서버 연결 정상</span>
                </div>
            )}
            
            <form onSubmit={handleSubmit} className="auth-form">
                <div className="form-group">
                    <label htmlFor="username">아이디</label>
                    <input
                        type="text"
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        autoComplete="username"
                        placeholder="아이디를 입력하세요"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="password">비밀번호</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        placeholder="비밀번호를 입력하세요"
                    />
                </div>
                {error && <div className="error-message">{error}</div>}
                <button type="submit" style={{ marginTop: '0.5rem' }}>로그인</button>
            </form>
            <div className="auth-link">
                계정이 없으신가요? <Link to="/join">회원가입</Link>
            </div>
        </div>
    );
}

export default LoginPage;