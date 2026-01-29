import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../api/axios';
import '../../styles/RequestBoardDetail.css';

function RequestBoardDetail() {
    const [requestBoard, setRequestBoard] = useState(null);
    const [comments, setComments] = useState([]);
    const [error, setError] = useState('');
    const [commentContent, setCommentContent] = useState('');
    const [replyContent, setReplyContent] = useState({});
    const [showReplyForm, setShowReplyForm] = useState({});
    const { id } = useParams();
    const navigate = useNavigate();
    const currentUsername = localStorage.getItem('username');

    useEffect(() => {
        const fetchRequestBoard = async () => {
            try {
                const response = await apiClient.get(`/requestboards/${id}`);
                setRequestBoard(response.data);
            } catch (err) {
                setError('게시글을 불러오는 데 실패했습니다.');
                console.error(err);
            }
        };

        const fetchComments = async () => {
            try {
                const response = await apiClient.get(`/comments/requestboard/${id}`);
                setComments(response.data);
            } catch (err) {
                console.error('댓글을 불러오는 데 실패했습니다.', err);
            }
        };

        if (id) {
            fetchRequestBoard();
            fetchComments();
        }
    }, [id]);

    const handleDelete = async () => {
        if (window.confirm('정말로 이 게시글을 삭제하시겠습니까?')) {
            try {
                await apiClient.delete(`/requestboards/${id}`);
                alert('게시글이 삭제되었습니다.');
                navigate('/requestboard');
            } catch (err) {
                setError('게시글 삭제에 실패했습니다. 권한을 확인해주세요.');
                console.error(err);
            }
        }
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!commentContent.trim()) {
            alert('댓글 내용을 입력해주세요.');
            return;
        }

        try {
            await apiClient.post('/comments', {
                requestBoardId: parseInt(id),
                parentId: null,
                content: commentContent
            });
            setCommentContent('');
            const response = await apiClient.get(`/comments/requestboard/${id}`);
            setComments(response.data);
        } catch (err) {
            alert('댓글 작성에 실패했습니다.');
            console.error(err);
        }
    };

    const handleReplySubmit = async (parentId) => {
        if (!replyContent[parentId] || !replyContent[parentId].trim()) {
            alert('답글 내용을 입력해주세요.');
            return;
        }

        try {
            await apiClient.post('/comments', {
                requestBoardId: parseInt(id),
                parentId: parentId,
                content: replyContent[parentId]
            });
            setReplyContent({ ...replyContent, [parentId]: '' });
            setShowReplyForm({ ...showReplyForm, [parentId]: false });
            const response = await apiClient.get(`/comments/requestboard/${id}`);
            setComments(response.data);
        } catch (err) {
            alert('답글 작성에 실패했습니다.');
            console.error(err);
        }
    };

    const handleCommentDelete = async (commentId) => {
        if (window.confirm('정말로 이 댓글을 삭제하시겠습니까?')) {
            try {
                await apiClient.delete(`/comments/${commentId}`);
                const response = await apiClient.get(`/comments/requestboard/${id}`);
                setComments(response.data);
            } catch (err) {
                alert('댓글 삭제에 실패했습니다.');
                console.error(err);
            }
        }
    };

    const toggleReplyForm = (commentId) => {
        setShowReplyForm({ ...showReplyForm, [commentId]: !showReplyForm[commentId] });
        if (!showReplyForm[commentId]) {
            setReplyContent({ ...replyContent, [commentId]: '' });
        }
    };

    if (error) {
        return <div className="request-board-container error-message">{error}</div>;
    }

    if (!requestBoard) {
        return <div className="request-board-container">로딩 중...</div>;
    }

    return (
        <div className="request-board-container">
            <div className="request-board-detail">
                <h1>{requestBoard.title}</h1>
                <div className="detail-meta">
                    <span>작성자: {requestBoard.author}</span>
                    <span>{new Date(requestBoard.createdAt).toLocaleString()}</span>
                </div>
                <div className="detail-content">
                    <p>{requestBoard.content}</p>
                </div>

                {requestBoard.fileName && (
                    <div className="detail-attachment">
                        <strong>첨부파일: </strong>
                        <a href={`/api/requestboards/download/${id}`} download={requestBoard.fileName}>
                            {requestBoard.fileName}
                        </a>
                    </div>
                )}
                
                <div className="detail-actions">
                    <button onClick={() => navigate('/requestboard')} className="back-button">목록으로</button>
                    
                    {currentUsername === requestBoard.author && (
                        <div className="item-actions">
                            <button onClick={() => navigate(`/requestboard/edit/${id}`)} className="edit-button">수정</button>
                            <button onClick={handleDelete} className="delete-button">삭제</button>
                        </div>
                    )}
                </div>

                {/* 댓글 섹션 */}
                <div className="comments-section">
                    <h2>댓글 ({comments.length})</h2>
                    
                    {/* 댓글 작성 폼 */}
                    {currentUsername && (
                        <form onSubmit={handleCommentSubmit} className="comment-form">
                            <textarea
                                value={commentContent}
                                onChange={(e) => setCommentContent(e.target.value)}
                                placeholder="댓글을 입력하세요..."
                                rows="3"
                                maxLength={1000}
                            />
                            <div className="comment-form-footer">
                                <span className="char-count">{commentContent.length}/1000</span>
                                <button type="submit">댓글 작성</button>
                            </div>
                        </form>
                    )}

                    {/* 댓글 목록 */}
                    <div className="comments-list">
                        {comments.length === 0 ? (
                            <p className="no-comments">댓글이 없습니다.</p>
                        ) : (
                            comments.map(comment => (
                                <div key={comment.id} className="comment-item">
                                    <div className="comment-header">
                                        <span className="comment-author">{comment.author}</span>
                                        <span className="comment-date">
                                            {new Date(comment.createdAt).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="comment-content">{comment.content}</div>
                                    <div className="comment-actions">
                                        {currentUsername && (
                                            <button 
                                                onClick={() => toggleReplyForm(comment.id)}
                                                className="reply-button"
                                            >
                                                {showReplyForm[comment.id] ? '취소' : '답글'}
                                            </button>
                                        )}
                                        {currentUsername === comment.author && (
                                            <button 
                                                onClick={() => handleCommentDelete(comment.id)}
                                                className="delete-comment-button"
                                            >
                                                삭제
                                            </button>
                                        )}
                                    </div>

                                    {/* 답글 입력 폼 */}
                                    {showReplyForm[comment.id] && currentUsername && (
                                        <div className="reply-form">
                                            <textarea
                                                value={replyContent[comment.id] || ''}
                                                onChange={(e) => setReplyContent({ 
                                                    ...replyContent, 
                                                    [comment.id]: e.target.value 
                                                })}
                                                placeholder="답글을 입력하세요..."
                                                rows="2"
                                                maxLength={1000}
                                            />
                                            <div className="reply-form-footer">
                                                <span className="char-count">
                                                    {(replyContent[comment.id] || '').length}/1000
                                                </span>
                                                <button onClick={() => handleReplySubmit(comment.id)}>
                                                    답글 작성
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* 답글 목록 */}
                                    {comment.replies && comment.replies.length > 0 && (
                                        <div className="replies-list">
                                            {comment.replies.map(reply => (
                                                <div key={reply.id} className="reply-item">
                                                    <div className="reply-header">
                                                        <span className="reply-author">{reply.author}</span>
                                                        <span className="reply-date">
                                                            {new Date(reply.createdAt).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <div className="reply-content">{reply.content}</div>
                                                    {currentUsername === reply.author && (
                                                        <button 
                                                            onClick={() => handleCommentDelete(reply.id)}
                                                            className="delete-reply-button"
                                                        >
                                                            삭제
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default RequestBoardDetail;
