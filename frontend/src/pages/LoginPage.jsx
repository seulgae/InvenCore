import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../services/authService';

function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

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
            if (err.response && err.response.status === 401) {
                setError('아이디 또는 비밀번호가 올바르지 않습니다.');
            } else {
                setError('로그인 중 오류가 발생했습니다. 서버 상태를 확인해주세요.');
            }
            console.error(err);
        }
    };

    return (
        <div>
            <h1>INVENCORE 로그인</h1>
            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="username">아이디: </label>
                    <input
                        type="text"
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        autoComplete="username"
                    />
                </div>
                <div>
                    <label htmlFor="password">비밀번호: </label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                    />
                </div>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <button type="submit">로그인</button>
            </form>
            <p>계정이 없으신가요? <Link to="/join">회원가입</Link></p>
        </div>
    );
}

export default LoginPage;