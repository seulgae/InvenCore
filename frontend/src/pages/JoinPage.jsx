import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { join } from '../services/authService';
import { checkServerHealth } from '../services/healthService';

function JoinPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
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
        setError('');

        if (!username || !password || !confirmPassword) {
            setError('모든 항목을 입력해주세요.');
            return;
        }

        if (password !== confirmPassword) {
            setError('비밀번호가 일치하지 않습니다.');
            return;
        }

        try {
            await join(username, password);
            alert('회원가입 성공! 로그인 페이지로 이동합니다.');
            navigate('/login');
        } catch (err) {
            if (!err.response) {
                // 네트워크 에러 또는 서버 연결 실패
                setError('서버에 연결할 수 없습니다. 서버 상태를 확인해주세요.');
                setServerStatus(false);
            } else if (err.response && err.response.data) {
                // 백엔드에서 보내는 예외 메시지를 표시 (e.g., "이미 존재하는 사용자 이름입니다.")
                setError(err.response.data.message || '회원가입 중 오류가 발생했습니다.');
            } else {
                setError('회원가입 중 오류가 발생했습니다. 서버 상태를 확인해주세요.');
            }
            console.error(err);
        }
    };

    return (
        <div className="auth-card">
            <h1>INVENCORE</h1>
            <p style={{ color: '#666', marginBottom: '2rem', fontSize: '1.1rem' }}>새 계정을 만들어 시작하세요</p>
            
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
                        placeholder="비밀번호를 입력하세요"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="confirmPassword">비밀번호 확인</label>
                    <input
                        type="password"
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="비밀번호를 다시 입력하세요"
                    />
                </div>
                {error && <div className="error-message">{error}</div>}
                <button type="submit" style={{ marginTop: '0.5rem' }}>회원가입</button>
            </form>
            <div className="auth-link">
                이미 계정이 있으신가요? <Link to="/login">로그인</Link>
            </div>
        </div>
    );
}

export default JoinPage;