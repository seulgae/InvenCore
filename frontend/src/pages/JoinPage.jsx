import React, { useState, useEffect, useRef } from 'react';
import { join, checkUsernameAvailability } from '../services/authService';
import { checkServerHealth } from '../services/healthService';
import '../styles/Modal.css';
import '../styles/Auth.css';

function JoinPage({ onClose, onJoinSuccess }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [usernameError, setUsernameError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [serverStatus, setServerStatus] = useState(null);

    const usernameRegex = /^[a-zA-Z0-9]*$/;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,20}$/;

    const usernameCheckTimeout = useRef(null);

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
        // 1. 입력 값에서 공백을 제거하고 20자로 자릅니다.
        const processedUsername = e.target.value.replace(/\s/g, '').slice(0, 20);
        setUsername(processedUsername);
        setUsernameError('');

        // 2. 정규식 검사 (영문/숫자)
        if (processedUsername && !usernameRegex.test(processedUsername)) {
            setUsernameError('아이디는 영문과 숫자만 포함할 수 있습니다.');
            return;
        }

        // 3. 길이 검사 (실시간 피드백)
        if (processedUsername && (processedUsername.length < 4 || processedUsername.length > 20)) {
            setUsernameError('아이디는 4자 이상 20자 이하로 입력해주세요.');
        }

        // 4. 디바운싱으로 중복 확인
        if (usernameCheckTimeout.current) {
            clearTimeout(usernameCheckTimeout.current);
        }

        if (processedUsername && processedUsername.length >= 4) {
            usernameCheckTimeout.current = setTimeout(async () => {
                try {
                    const response = await checkUsernameAvailability(processedUsername);
                    if (!response.isAvailable) {
                        setUsernameError('이미 사용하고 있는 아이디 입니다.');
                    }
                } catch (err) {
                    console.error('아이디 중복 확인 중 오류 발생:', err);
                }
            }, 500);
        }
    };

    const handlePasswordChange = (e) => {
        const newPassword = e.target.value.replace(/\s/g, '').slice(0, 20);
        setPassword(newPassword);
        
        if (newPassword && !passwordRegex.test(newPassword)) {
            setPasswordError('비밀번호는 8~20자, 영문 대/소문자, 숫자, 특수기호를 포함해야 합니다.');
        } else {
            setPasswordError('');
        }

        if (confirmPassword && newPassword !== confirmPassword) {
            setPasswordError('비밀번호가 일치하지 않습니다.');
        }
    };

    const handleConfirmPasswordChange = (e) => {
        const newConfirmPassword = e.target.value.replace(/\s/g, '').slice(0, 20);
        setConfirmPassword(newConfirmPassword);

        if (password !== newConfirmPassword) {
            setPasswordError('비밀번호가 일치하지 않습니다.');
        } else {
            setPasswordError('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (usernameError || passwordError) {
            return;
        }
        if (!username || !password || !confirmPassword) {
            setError('모든 항목을 입력해주세요.');
            return;
        }
        if (username.length < 4 || username.length > 20 || !usernameRegex.test(username)) {
            setUsernameError('아이디는 4~20자의 영문과 숫자만 사용 가능합니다.');
            return;
        }
        if (!passwordRegex.test(password)) {
            setPasswordError('비밀번호는 8~20자, 영문 대/소문자, 숫자, 특수기호를 포함해야 합니다.');
            return;
        }
        if (password !== confirmPassword) {
            setPasswordError('비밀번호가 일치하지 않습니다.');
            return;
        }

        try {
            const response = await checkUsernameAvailability(username);
            if (!response.isAvailable) {
                setUsernameError('이미 사용하고 있는 아이디 입니다.');
                return;
            }

            await join(username, password);
            alert('회원가입 성공! 로그인 창을 엽니다.');
            onJoinSuccess();
        } catch (err) {
            if (!err.response) {
                setError('서버에 연결할 수 없습니다. 서버 상태를 확인해주세요.');
                setServerStatus(false);
            } else if (err.response && err.response.data) {
                setError(err.response.data.message || '회원가입 중 오류가 발생했습니다.');
            } else {
                setError('회원가입 중 오류가 발생했습니다. 서버 상태를 확인해주세요.');
            }
            console.error(err);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="auth-card">
                    <button className="modal-close-button" onClick={onClose}>&times;</button>
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
                                onChange={handleUsernameChange}
                                placeholder="4~20자, 영문/숫자"
                                autoComplete="off"
                            />
                            {usernameError && <div className="error-message">{usernameError}</div>}
                        </div>
                        <div className="form-group">
                            <label htmlFor="password">비밀번호</label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={handlePasswordChange}
                                placeholder="8~20자, 대/소문자, 숫자, 특수기호 포함"
                                autoComplete="new-password"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="confirmPassword">비밀번호 확인</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                value={confirmPassword}
                                onChange={handleConfirmPasswordChange}
                                placeholder="비밀번호를 다시 입력하세요"
                                autoComplete="new-password"
                            />
                            {passwordError && <div className="error-message">{passwordError}</div>}
                        </div>
                        {error && <div className="error-message">{error}</div>}
                        <button type="submit" style={{ marginTop: '0.5rem' }}>회원가입</button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default JoinPage;