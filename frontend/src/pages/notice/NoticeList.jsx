import React, { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import apiClient from '../../api/axios';
import '../../styles/NoticeList.css';

function NoticeList() {
    const navigate = useNavigate();
    const { isLoggedIn, userRole } = useOutletContext();

    const [notices, setNotices] = useState([]);
    const [error, setError] = useState('');

    // ✅ 한 페이지당 5개
    const [page, setPage] = useState(0);
    const size = 5;

    useEffect(() => {
        fetchNotices();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchNotices = async () => {
        try {
            const { data } = await apiClient.get('/notices'); // List<NoticeDTO>
            setNotices(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
            setError('공지사항 목록을 불러오는 데 실패했습니다.');
        }
    };

    const canCreate = isLoggedIn && (userRole === 2 || userRole === 3);

    // ✅ 페이지 계산
    const totalPages = Math.ceil(notices.length / size);
    const startIndex = page * size;
    const currentNotices = notices.slice(startIndex, startIndex + size);

    // ✅ 페이징 이동
    const goPage = (p) => {
        if (p < 0 || p > totalPages - 1) return;
        setPage(p);
    };

    return (
        <div className="notice-container">
            <div className="notice-header">
                <h1>공지사항</h1>
                {canCreate && (
                    <button className="create-button" onClick={() => navigate('/notice/regist')}>
                        등록
                    </button>
                )}
            </div>

            {error && <p className="error-message">{error}</p>}

            <div className="notice-list one-row">
                {currentNotices.length === 0 ? (
                    <p className="empty-message">공지사항이 없습니다.</p>
                ) : (
                    currentNotices.map((notice) => (
                        <div
                            key={notice.id}
                            className="notice-item"
                            onClick={() => navigate(`/notice/${notice.id}`)}
                        >
                            <h2>{notice.title}</h2>
                            <p>{notice.content}</p>
                            <div className="item-footer">
                                <span>{notice.author}</span>
                                <span>{new Date(notice.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {totalPages > 0 && (
                <div className="pagination">
                    <button className="page-button" type="button" onClick={() => goPage(0)} disabled={page === 0}>
                        «
                    </button>

                    <button className="page-button" type="button" onClick={() => goPage(page - 1)} disabled={page === 0}>
                        ‹
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i).map((p) => (
                        <button
                            key={p}
                            className={`page-button ${p === page ? 'active' : ''}`}
                            type="button"
                            onClick={() => goPage(p)}
                        >
                            {p + 1}
                        </button>
                    ))}

                    <button
                        className="page-button"
                        type="button"
                        onClick={() => goPage(page + 1)}
                        disabled={page >= totalPages - 1}
                    >
                        ›
                    </button>

                    <button
                        className="page-button"
                        type="button"
                        onClick={() => goPage(totalPages - 1)}
                        disabled={page >= totalPages - 1}
                    >
                        »
                    </button>
                </div>
            )}
        </div>
    );
}

export default NoticeList;
