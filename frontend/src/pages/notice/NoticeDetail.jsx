import React, { useEffect, useState } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import apiClient from '../../api/axios';
import '../../styles/NoticeDetail.css';

function NoticeDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isLoggedIn, userRole } = useOutletContext();

    const [notice, setNotice] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!id) return;

        const fetchNotice = async () => {
            try {
                setError('');
                const { data } = await apiClient.get(`/notices/${id}`);
                setNotice(data);
            } catch (err) {
                console.error(err);
                setError('공지사항을 불러오는 데 실패했습니다.');
            }
        };

        fetchNotice();
    }, [id]);

    const handleDelete = async () => {
        const ok = window.confirm('정말로 이 공지사항을 삭제하시겠습니까?');
        if (!ok) return;

        try {
            setError('');
            await apiClient.delete(`/notices/${id}`);
            alert('공지사항이 삭제되었습니다.');
            navigate('/notice');
        } catch (err) {
            console.error(err);
            setError('공지사항 삭제에 실패했습니다. 권한을 확인해주세요.');
        }
    };

    if (error) {
        return <div className="notice-container error-message">{error}</div>;
    }

    if (!notice) {
        return <div className="notice-container">로딩 중...</div>;
    }

    const canManage = isLoggedIn && (userRole === 2 || userRole === 3);

    return (
        <div className="notice-container">
            <div className="notice-detail">
                <h1>{notice.title}</h1>

                <div className="detail-meta">
                    <span>작성자: {notice.author}</span>
                    <span>{notice.createdAt ? new Date(notice.createdAt).toLocaleString() : ''}</span>
                </div>

                <div className="detail-content">
                    <p>{notice.content}</p>
                </div>

                <div className="detail-actions">
                    <button type="button" onClick={() => navigate('/notice')} className="back-button">
                        목록으로
                    </button>

                    {canManage && (
                        <div className="item-actions">
                            <button
                                type="button"
                                onClick={() => navigate(`/notice/edit/${id}`)}
                                className="edit-button"
                            >
                                수정
                            </button>
                            <button type="button" onClick={handleDelete} className="delete-button">
                                삭제
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default NoticeDetail;
