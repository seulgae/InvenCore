import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../api/axios';
import '../../styles/NoticeDetail.css';

function NoticeDetail() {
    const [notice, setNotice] = useState(null);
    const [error, setError] = useState('');
    const { id } = useParams();
    const navigate = useNavigate();
    const currentUsername = localStorage.getItem('username');

    useEffect(() => {
        const fetchNotice = async () => {
            try {
                const response = await apiClient.get(`/notices/${id}`);
                setNotice(response.data);
            } catch (err) {
                setError('공지사항을 불러오는 데 실패했습니다.');
                console.error(err);
            }
        };

        if (id) {
            fetchNotice();
        }
    }, [id]);

    const handleDelete = async () => {
        if (window.confirm('정말로 이 공지사항을 삭제하시겠습니까?')) {
            try {
                await apiClient.delete(`/notices/${id}`);
                alert('공지사항이 삭제되었습니다.');
                navigate('/notice');
            } catch (err) {
                setError('공지사항 삭제에 실패했습니다. 권한을 확인해주세요.');
                console.error(err);
            }
        }
    };

    if (error) {
        return <div className="notice-container error-message">{error}</div>;
    }

    if (!notice) {
        return <div className="notice-container">로딩 중...</div>;
    }

    return (
        <div className="notice-container">
            <div className="notice-detail">
                <h1>{notice.title}</h1>
                <div className="detail-meta">
                    <span>작성자: {notice.author}</span>
                    <span>{new Date(notice.createdAt).toLocaleString()}</span>
                </div>
                <div className="detail-content">
                    <p>{notice.content}</p>
                </div>
                
                <div className="detail-actions">
                    <button onClick={() => navigate('/notice')} className="back-button">목록으로</button>
                    
                    {currentUsername === notice.author && (
                        <div className="item-actions">
                            <button onClick={() => navigate(`/notice/edit/${id}`)} className="edit-button">수정</button>
                            <button onClick={handleDelete} className="delete-button">삭제</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default NoticeDetail;
