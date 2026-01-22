import React, { useState, useEffect, useRef } from 'react'; // useRef 추가
import { join, checkUsernameAvailability } from '../services/authService'; // checkUsernameAvailability 임포트
import { checkServerHealth } from '../services/healthService';
import '../styles/Modal.css';
import '../styles/Auth.css';

function JoinPage({ onClose, onJoinSuccess }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [usernameError, setUsernameError] = useState(''); // 아이디 관련 에러 상태 추가
    const [serverStatus, setServerStatus] = useState(null);

    // 아이디 유효성 검사 정규표현식 (영문, 숫자만 허용)
    const usernameRegex = /^[a-zA-Z0-9]*$/;

    // 디바운싱을 위한 ref
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

    // 아이디 입력 변경 핸들러
    const handleUsernameChange = (e) => {
        const newUsername = e.target.value;
        setUsername(newUsername);
        setUsernameError(''); // 새로운 입력 시 에러 초기화

        if (newUsername && !usernameRegex.test(newUsername)) {
            setUsernameError('아이디는 영문과 숫자만 포함할 수 있습니다.');
            return;
        }

        // 디바운싱: 이전 타이머가 있으면 클리어
        if (usernameCheckTimeout.current) {
            clearTimeout(usernameCheckTimeout.current);
        }

        // 500ms 후에 중복 확인 실행 (아이디가 비어있지 않을 때만)
        if (newUsername) {
            usernameCheckTimeout.current = setTimeout(async () => {
                try {
                    const response = await checkUsernameAvailability(newUsername);
                    if (!response.isAvailable) {
                        setUsernameError('이미 사용하고 있는 아이디 입니다.');
                    }
                } catch (err) {
                    console.error('아이디 중복 확인 중 오류 발생:', err);
                }
            }, 500);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // 폼 제출 전에 최종적으로 아이디 유효성 및 중복 확인
        if (usernameError) {
            return; // 아이디 관련 에러가 있으면 제출 방지
        }
        if (!username || !password || !confirmPassword) {
            setError('모든 항목을 입력해주세요.');
            return;
        }
        if (!usernameRegex.test(username)) {
            setUsernameError('아이디는 영문과 숫자만 포함할 수 있습니다.');
            return;
        }
        if (password !== confirmPassword) {
            setError('비밀번호가 일치하지 않습니다.');
            return;
        }

        try {
            // 최종 중복 확인
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
                                onChange={handleUsernameChange} // 변경된 핸들러 사용
                                placeholder="아이디를 입력하세요 (영문, 숫자만)"
                            />
                            {usernameError && <div className="error-message">{usernameError}</div>} {/* 아이디 에러 메시지 */}
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
                        {error && <div className="error-message">{error}</div>} {/* 일반 에러 메시지 */}
                        <button type="submit" style={{ marginTop: '0.5rem' }}>회원가입</button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default JoinPage;