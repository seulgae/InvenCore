import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // ✅ useParams, useNavigate 다시 사용
import apiClient from '../api/axios';
import '../styles/BoardDetail.css';

function BoardDetail() { // ✅ props 제거
    const [board, setBoard] = useState(null);
    const [error, setError] = useState('');
    const { id } = useParams(); // ✅ useParams로 id 직접 가져오기
    const navigate = useNavigate(); // ✅ navigate 다시 사용
    const currentUsername = localStorage.getItem('username');

    useEffect(() => {
        const fetchBoard = async () => {
            try {
                const response = await apiClient.get(`/boards/${id}`);
                setBoard(response.data);
            } catch (err) {
                setError('게시글을 불러오는 데 실패했습니다.');
                console.error(err);
            }
        };

        if (id) {
            fetchBoard();
        }
    }, [id]);

    const handleDelete = async () => {
        if (window.confirm('정말로 이 게시글을 삭제하시겠습니까?')) {
            try {
                await apiClient.delete(`/boards/${id}`);
                alert('게시글이 삭제되었습니다.');
                navigate('/board'); // ✅ navigate 사용
            } catch (err) {
                setError('게시글 삭제에 실패했습니다. 권한을 확인해주세요.');
                console.error(err);
            }
        }
    };

    if (error) {
        return <div className="board-container error-message">{error}</div>;
    }

    if (!board) {
        return <div className="board-container">로딩 중...</div>;
    }

    return (
        <div className="board-container">
            <div className="board-detail">
                <h1>{board.title}</h1>
                <div className="detail-meta">
                    <span>작성자: {board.author}</span>
                    <span>{new Date(board.createdAt).toLocaleString()}</span>
                </div>
                <div className="detail-content">
                    <p>{board.content}</p>
                </div>
                
                <div className="detail-actions">
                    <button onClick={() => navigate('/board')} className="back-button">목록으로</button>
                    
                    {currentUsername === board.author && (
                        <div className="item-actions">
                            <button onClick={() => navigate(`/board/edit/${id}`)} className="edit-button">수정</button>
                            <button onClick={handleDelete} className="delete-button">삭제</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default BoardDetail;