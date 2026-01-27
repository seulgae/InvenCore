import React, { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import apiClient from '../../api/axios';
import '../../styles/RequestBoardList.css';

function RequestBoardList() {
    const navigate = useNavigate();
    const { isLoggedIn, openLoginModal } = useOutletContext();

    const [items, setItems] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const [page, setPage] = useState(0);
    const size = 10;
    const [totalPages, setTotalPages] = useState(1);

    // 입력 중인 검색어 / 실제 적용된 검색어
    const [keyword, setKeyword] = useState('');
    const [appliedKeyword, setAppliedKeyword] = useState('');

    // ✅ 한 곳에서만 서버 호출(파라미터 명확)
    const fetchPage = async ({ nextPage, keyword: kw }) => {
        const trimmed = (kw ?? '').trim();

        try {
            setLoading(true);
            setError('');

            // 디버깅용(원하면 삭제)
            // console.log('[RequestBoards] page=', nextPage, 'size=', size, 'keyword=', trimmed);

            const res = await apiClient.get('/requestboards', {
                params: {
                    page: nextPage,
                    size,
                    keyword: trimmed ? trimmed : undefined,
                },
            });

            setItems(res.data?.content ?? []);
            setTotalPages(res.data?.totalPages ?? 1);
            setPage(res.data?.number ?? nextPage);
        } catch (e) {
            setError('게시글 목록을 불러오는 데 실패했습니다.');
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // ✅ 첫 진입 시 “검색어 없이 0페이지”
    useEffect(() => {
        fetchPage({ nextPage: 0, keyword: '' });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleCreateClick = () => {
        if (isLoggedIn) navigate('/requestboard/regist');
        else {
            alert('로그인이 필요합니다.');
            openLoginModal();
        }
    };

    const handleSearch = () => {
        const k = keyword.trim();
        setAppliedKeyword(k);
        fetchPage({ nextPage: 0, keyword: k });
    };

    const handleClearSearch = () => {
        setKeyword('');
        setAppliedKeyword('');
        fetchPage({ nextPage: 0, keyword: '' });
    };

    // ✅ 페이지 이동은 항상 appliedKeyword 기준으로
    const goPage = (p) => {
        if (p < 0 || p > totalPages - 1) return;
        fetchPage({ nextPage: p, keyword: appliedKeyword });
    };

    return (
        <div className="rb-container">
            <div className="rb-header">
                <div className="rb-header-left">
                    <h1 className="rb-title">요청 게시판</h1>
                    <p className="rb-subtitle">요청사항을 등록하고 진행 상황을 확인하세요.</p>
                </div>

                <div className="rb-header-actions">
                    <input
                        className="rb-search-input"
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        placeholder="제목/내용 검색"
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />

                    <button className="rb-btn rb-btn-ghost" type="button" onClick={handleSearch} disabled={loading}>
                        검색
                    </button>

                    <button className="rb-btn rb-btn-ghost" type="button" onClick={handleClearSearch} disabled={loading}>
                        초기화
                    </button>

                    <button className="rb-btn rb-btn-primary" type="button" onClick={handleCreateClick}>
                        등록
                    </button>
                </div>
            </div>

            {error && <p className="rb-error">{error}</p>}

            <div className="rb-list">
                <div className="rb-list-head">
                    <div className="rb-col">제목</div>
                    <div className="rb-col rb-col-center">작성자</div>
                    <div className="rb-col rb-col-center">작성일</div>
                </div>

                {loading ? (
                    <div className="rb-empty">불러오는 중...</div>
                ) : items.length === 0 ? (
                    <div className="rb-empty">게시글이 없습니다.</div>
                ) : (
                    items.map((it) => (
                        <button
                            key={it.id}
                            className="rb-row"
                            type="button"
                            onClick={() => navigate(`/requestboard/${it.id}`)}
                        >
                            <div className="rb-cell rb-cell-title">
                                <div className="rb-row-title">{it.title}</div>
                                <div className="rb-row-preview">{(it.content || '').replace(/\n/g, ' ')}</div>
                            </div>

                            <div className="rb-cell rb-col-center">{it.author}</div>

                            <div className="rb-cell rb-col-center">
                                {it.createdAt ? new Date(it.createdAt).toLocaleString() : ''}
                            </div>
                        </button>
                    ))
                )}
            </div>

            {totalPages > 0 && (
                <div className="rb-pagination">
                    <button className="rb-page-btn" type="button" onClick={() => goPage(0)} disabled={page === 0 || loading}>
                        «
                    </button>

                    <button className="rb-page-btn" type="button" onClick={() => goPage(page - 1)} disabled={page === 0 || loading}>
                        ‹
                    </button>

                    <div className="rb-page-numbers">
                        {Array.from({ length: totalPages }, (_, i) => i).map((p) => (
                            <button
                                key={p}
                                className={`rb-page-num ${p === page ? 'active' : ''}`}
                                type="button"
                                onClick={() => goPage(p)}
                                disabled={loading}
                            >
                                {p + 1}
                            </button>
                        ))}
                    </div>

                    <button
                        className="rb-page-btn"
                        type="button"
                        onClick={() => goPage(page + 1)}
                        disabled={page >= totalPages - 1 || loading}
                    >
                        ›
                    </button>

                    <button
                        className="rb-page-btn"
                        type="button"
                        onClick={() => goPage(totalPages - 1)}
                        disabled={page >= totalPages - 1 || loading}
                    >
                        »
                    </button>

                    <div className="rb-page-info">
                        {page + 1} / {totalPages}
                    </div>
                </div>
            )}
        </div>
    );
}

export default RequestBoardList;
