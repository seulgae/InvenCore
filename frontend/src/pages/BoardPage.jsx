import React, { useState, useEffect } from 'react';
import apiClient from '../api/axios';
import '../styles/Board.css';

function BoardPage() {
    const [boards, setBoards] = useState([]);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [error, setError] = useState('');
    const [editingBoard, setEditingBoard] = useState(null);
    const [selectedBoard, setSelectedBoard] = useState(null);

    const currentUsername = localStorage.getItem('username');

    useEffect(() => {
        if (!selectedBoard) {
            fetchBoards();
        }
    }, [selectedBoard]);

    const fetchBoards = async () => {
        try {
            const response = await apiClient.get('/boards');
            setBoards(response.data);
        } catch (err) {
            setError('게시글 목록을 불러오는 데 실패했습니다.');
            console.error(err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!title || !content) {
            setError('제목과 내용을 모두 입력해주세요.');
            return;
        }

        try {
            if (editingBoard) {
                await apiClient.put(`/boards/${editingBoard.id}`, { title, content });
                setEditingBoard(null);
            } else {
                await apiClient.post('/boards', { title, content });
            }
            setTitle('');
            setContent('');
            fetchBoards();
            setError('');
        } catch (err) {
            setError('게시글 작성/수정에 실패했습니다.');
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('정말로 이 게시글을 삭제하시겠습니까?')) {
            try {
                await apiClient.delete(`/boards/${id}`);
                fetchBoards();
            } catch (err) {
                setError('게시글 삭제에 실패했습니다.');
                console.error(err);
            }
        }
    };

    const handleEdit = (board) => {
        setEditingBoard(board);
        setTitle(board.title);
        setContent(board.content);
        window.scrollTo(0, 0);
    };

    const handleCancelEdit = () => {
        setEditingBoard(null);
        setTitle('');
        setContent('');
        setError('');
    };

    const handleViewDetail = (board) => {
        setSelectedBoard(board);
    };

    const handleBackToList = () => {
        setSelectedBoard(null);
    };

    if (selectedBoard) {
        return (
            <div className="board-container">
                <div className="board-detail">
                    <h1>{selectedBoard.title}</h1>
                    <div className="detail-meta">
                        <span>작성자: {selectedBoard.author}</span>
                        <span>{new Date(selectedBoard.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="detail-content">
                        <p>{selectedBoard.content}</p>
                    </div>
                    
                    {/* ✅ 버튼 그룹 */}
                    <div className="detail-actions">
                        <button onClick={handleBackToList} className="back-button">목록으로</button>
                        
                        {/* ✅ 본인 글에만 수정/삭제 버튼 표시 */}
                        {currentUsername === selectedBoard.author && (
                            <div className="item-actions">
                                <button onClick={() => {
                                    handleEdit(selectedBoard);
                                    setSelectedBoard(null); // 상세 보기 모드 종료
                                }} className="edit-button">수정</button>
                                <button onClick={() => {
                                    handleDelete(selectedBoard.id);
                                    setSelectedBoard(null); // 상세 보기 모드 종료
                                }} className="delete-button">삭제</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="board-container">
            <h1>요청 게시판</h1>
            
            <form onSubmit={handleSubmit} className="board-form">
                <h2>{editingBoard ? '게시글 수정' : '새 게시글 작성'}</h2>
                <div className="form-group">
                    <input 
                        type="text" 
                        value={title} 
                        onChange={(e) => setTitle(e.target.value)} 
                        placeholder="제목" 
                    />
                </div>
                <div className="form-group">
                    <textarea 
                        value={content} 
                        onChange={(e) => setContent(e.target.value)} 
                        placeholder="내용"
                    ></textarea>
                </div>
                {error && <p className="error-message">{error}</p>}
                <div className="form-actions">
                    <button type="submit">{editingBoard ? '수정 완료' : '글 작성'}</button>
                    {editingBoard && (
                        <button type="button" onClick={handleCancelEdit} className="cancel-button">
                            취소
                        </button>
                    )}
                </div>
            </form>

            <div className="board-list">
                {boards.length === 0 ? (
                    <p className="empty-message">게시글이 없습니다.</p>
                ) : (
                    boards.map(board => (
                        <div key={board.id} className="board-item">
                            <div className="item-content" onClick={() => handleViewDetail(board)}>
                                <h2>{board.title}</h2>
                                <p>{board.content}</p>
                            </div>
                            <div className="item-footer">
                                <span>작성자: {board.author}</span>
                                <span>{new Date(board.createdAt).toLocaleString()}</span>
                                {currentUsername === board.author && (
                                    <div className="item-actions">
                                        <button onClick={() => handleEdit(board)} className="edit-button">수정</button>
                                        <button onClick={() => handleDelete(board.id)} className="delete-button">삭제</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default BoardPage;