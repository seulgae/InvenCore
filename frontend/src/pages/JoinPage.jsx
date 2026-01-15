import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { join } from '../services/authService';

function JoinPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

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
            if (err.response && err.response.data) {
                // 백엔드에서 보내는 예외 메시지를 표시 (e.g., "이미 존재하는 사용자 이름입니다.")
                setError(err.response.data.message || '회원가입 중 오류가 발생했습니다.');
            } else {
                setError('회원가입 중 오류가 발생했습니다. 서버 상태를 확인해주세요.');
            }
            console.error(err);
        }
    };

    return (
        <div>
            <h1>INVENCORE 회원가입</h1>
            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="username">아이디: </label>
                    <input
                        type="text"
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                </div>
                <div>
                    <label htmlFor="password">비밀번호: </label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
                <div>
                    <label htmlFor="confirmPassword">비밀번호 확인: </label>
                    <input
                        type="password"
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                </div>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <button type="submit">회원가입</button>
            </form>
            <p>이미 계정이 있으신가요? <Link to="/login">로그인</Link></p>
        </div>
    );
}

export default JoinPage;