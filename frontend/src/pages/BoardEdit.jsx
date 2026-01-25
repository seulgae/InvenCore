import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // ✅ 복원
import apiClient from '../api/axios';
import '../styles/BoardEdit.css';

function BoardEdit() { // ✅ props 제거
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [error, setError] = useState('');
    const { id } = useParams(); // ✅ 복원
    const navigate = useNavigate(); // ✅ 복원

    useEffect(() => {
        const fetchBoard = async () => {
            try {
                const response = await apiClient.get(`/boards/${id}`);
                setTitle(response.data.title);
                setContent(response.data.content);
            } catch (err) {
                setError('게시글 정보를 불러오는 데 실패했습니다.');
                console.error(err);
            }
        };

        if (id) {
            fetchBoard();
        }
    }, [id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!title || !content) {
            setError('제목과 내용을 모두 입력해주세요.');
            return;
        }

        try {
            await apiClient.put(`/boards/${id}`, { title, content });
            alert('게시글이 수정되었습니다.');
            navigate(`/board/${id}`); // ✅ navigate 사용
        } catch (err) {
            setError('게시글 수정에 실패했습니다. 권한을 확인해주세요.');
            console.error(err);
        }
    };

    return (
        <div className="board-container">
            <h1>게시글 수정</h1>
            
            <form onSubmit={handleSubmit} className="board-form">
                <div className="form-group">
                    <label htmlFor="title">제목</label>
                    <input 
                        type="text" 
                        id="title"
                        value={title} 
                        onChange={(e) => setTitle(e.target.value)} 
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="content">내용</label>
                    <textarea 
                        id="content"
                        value={content} 
                        onChange={(e) => setContent(e.target.value)} 
                    ></textarea>
                </div>
                {error && <p className="error-message">{error}</p>}
                <div className="form-actions">
                    <button type="submit">수정 완료</button>
                    <button type="button" onClick={() => navigate(`/board/${id}`)} className="cancel-button">취소</button>
                </div>
            </form>
        </div>
    );
}

export default BoardEdit;