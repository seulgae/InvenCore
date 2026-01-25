import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import apiClient from '../api/axios';
import '../styles/BoardList.css';

function BoardList() {
    const [boards, setBoards] = useState([]);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { isLoggedIn, openLoginModal } = useOutletContext(); // openJoinModal -> openLoginModal

    useEffect(() => {
        fetchBoards();
    }, []);

    const fetchBoards = async () => {
        try {
            const response = await apiClient.get('/boards');
            setBoards(response.data);
        } catch (err) {
            setError('게시글 목록을 불러오는 데 실패했습니다.');
            console.error(err);
        }
    };

    const handleCreateClick = () => {
        if (isLoggedIn) {
            navigate('/board/regist'); // ✅ 경로 수정
        } else {
            alert('로그인이 필요합니다.');
            openLoginModal(); // 로그인 모달 열기
        }
    };

    return (
        <div className="board-container">
            <div className="board-header">
                <h1>요청 게시판</h1>
                <button onClick={handleCreateClick} className="create-button">등록</button>
            </div>
            
            {error && <p className="error-message">{error}</p>}

            <div className="board-list">
                {boards.length === 0 ? (
                    <p className="empty-message">게시글이 없습니다.</p>
                ) : (
                    boards.map(board => (
                        <div key={board.id} className="board-item" onClick={() => navigate(`/board/${board.id}`)}>
                            <div className="item-content">
                                <h2>{board.title}</h2>
                                <p>{board.content}</p>
                            </div>
                            <div className="item-footer">
                                <span>작성자: {board.author}</span>
                                <span>{new Date(board.createdAt).toLocaleString()}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default BoardList;