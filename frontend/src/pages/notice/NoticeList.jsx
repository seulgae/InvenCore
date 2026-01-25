import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import apiClient from '../../api/axios';
import '../../styles/NoticeList.css';

function NoticeList() {
    const [notices, setNotices] = useState([]);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { isLoggedIn, userRole, openLoginModal } = useOutletContext(); // ✅ userRole 가져오기

    useEffect(() => {
        fetchNotices();
    }, []);

    const fetchNotices = async () => {
        try {
            const response = await apiClient.get('/notices');
            setNotices(response.data);
        } catch (err) {
            setError('공지사항 목록을 불러오는 데 실패했습니다.');
            console.error(err);
        }
    };

    const handleCreateClick = () => {
        // 이 함수는 이제 버튼이 보일 때만 호출되므로, isLoggedIn 체크는 사실상 중복이지만 안전을 위해 유지합니다.
        if (isLoggedIn && (userRole === 2 || userRole === 3)) {
            navigate('/notice/regist');
        } else {
            alert('등록 권한이 없습니다.');
        }
    };

    return (
        <div className="notice-container">
            <div className="notice-header">
                <h1>공지사항</h1>
                {/* ✅ userRole이 2 또는 3일 때만 등록 버튼 표시 */}
                {isLoggedIn && (userRole === 2 || userRole === 3) && (
                    <button onClick={handleCreateClick} className="create-button">등록</button>
                )}
            </div>
            
            {error && <p className="error-message">{error}</p>}

            <div className="notice-list">
                {notices.length === 0 ? (
                    <p className="empty-message">공지사항이 없습니다.</p>
                ) : (
                    notices.map(notice => (
                        <div key={notice.id} className="notice-item" onClick={() => navigate(`/notice/${notice.id}`)}>
                            <div className="item-content">
                                <h2>{notice.title}</h2>
                                <p>{notice.content}</p>
                            </div>
                            <div className="item-footer">
                                <span>작성자: {notice.author}</span>
                                <span>{new Date(notice.createdAt).toLocaleString()}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default NoticeList;