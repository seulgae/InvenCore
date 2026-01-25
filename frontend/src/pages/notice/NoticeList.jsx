import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import apiClient from '../../api/axios';
import '../../styles/NoticeList.css';

function NoticeList() {
    const [notices, setNotices] = useState([]);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { isLoggedIn, openLoginModal } = useOutletContext();

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
        if (isLoggedIn) {
            navigate('/notice/regist');
        } else {
            alert('로그인이 필요합니다.');
            openLoginModal();
        }
    };

    return (
        <div className="notice-container">
            <div className="notice-header">
                <h1>공지사항</h1>
                <button onClick={handleCreateClick} className="create-button">등록</button>
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
