import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import apiClient from '../../api/axios';
import '../../styles/RequestBoardList.css';

function RequestBoardList() {
    const [requestBoards, setRequestBoards] = useState([]);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { isLoggedIn, openLoginModal } = useOutletContext();

    useEffect(() => {
        fetchRequestBoards();
    }, []);

    const fetchRequestBoards = async () => {
        try {
            const response = await apiClient.get('/requestboards');
            setRequestBoards(response.data);
        } catch (err) {
            setError('게시글 목록을 불러오는 데 실패했습니다.');
            console.error(err);
        }
    };

    const handleCreateClick = () => {
        if (isLoggedIn) {
            navigate('/requestboard/regist');
        } else {
            alert('로그인이 필요합니다.');
            openLoginModal();
        }
    };

    return (
        <div className="request-board-container">
            <div className="request-board-header">
                <h1>요청 게시판</h1>
                <button onClick={handleCreateClick} className="create-button">등록</button>
            </div>
            
            {error && <p className="error-message">{error}</p>}

            <div className="request-board-list">
                {requestBoards.length === 0 ? (
                    <p className="empty-message">게시글이 없습니다.</p>
                ) : (
                    requestBoards.map(requestBoard => (
                        <div key={requestBoard.id} className="request-board-item" onClick={() => navigate(`/requestboard/${requestBoard.id}`)}>
                            <div className="item-content">
                                <h2>{requestBoard.title}</h2>
                                <p>{requestBoard.content}</p>
                            </div>
                            <div className="item-footer">
                                <span>작성자: {requestBoard.author}</span>
                                <span>{new Date(requestBoard.createdAt).toLocaleString()}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default RequestBoardList;
