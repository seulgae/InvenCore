import React, { useState, useEffect } from 'react';
import { login } from '../../services/authService';
import { checkServerHealth } from '../../services/healthService';
import '../../styles/Modal.css';
import '../../styles/Auth.css';

function LoginPage({ onClose, onLoginSuccess }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [serverStatus, setServerStatus] = useState(null);

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

    const handleUsernameChange = (e) => {
        let newUsername = e.target.value;
        newUsername = newUsername.replace(/\s/g, ''); // 공백 제거
        newUsername = newUsername.slice(0, 20); // 20자 제한
        setUsername(newUsername);
    };

    const handlePasswordChange = (e) => {
        let newPassword = e.target.value;
        newPassword = newPassword.replace(/\s/g, ''); // 공백 제거
        newPassword = newPassword.slice(0, 20); // 20자 제한
        setPassword(newPassword);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!username || !password) {
            setError('아이디와 비밀번호를 모두 입력해주세요.');
            return;
        }

        try {
            const result = await login(username, password);
            if (result.success) {
                // ✅ username과 role을 함께 전달
                onLoginSuccess(result.username, result.role);
            } else {
                setError('로그인에 실패했습니다. 아이디와 비밀번호를 확인해주세요.');
            }
        } catch (err) {
            if (!err.response) {
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
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="auth-card">
                    <button className="modal-close-button" onClick={onClose}>&times;</button>
                    <h1 className="brand-mark brand-mark--auth">invencore</h1>
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
                                onChange={handleUsernameChange}
                                autoComplete="off"
                                placeholder="아이디를 입력하세요"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="password">비밀번호</label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={handlePasswordChange}
                                autoComplete="new-password"
                                placeholder="비밀번호를 입력하세요"
                            />
                        </div>
                        {error && <div className="error-message">{error}</div>}
                        <button type="submit" style={{ marginTop: '0.5rem' }}>로그인</button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;
