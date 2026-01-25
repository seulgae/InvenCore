import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/axios';
import '../../styles/BoardNew.css';

function BoardNew() {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleTitleChange = (e) => {
        const value = e.target.value;
        if (value.length <= 50) {
            setTitle(value);
        }
    };

    const handleContentChange = (e) => {
        const value = e.target.value;
        if (value.length <= 5000) {
            setContent(value);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!title || !content) {
            setError('제목과 내용을 모두 입력해주세요.');
            return;
        }

        if (title.length > 50) {
            setError('제목은 50자 이내로 입력해주세요.');
            return;
        }

        if (content.length > 5000) {
            setError('내용은 5000자 이내로 입력해주세요.');
            return;
        }

        try {
            await apiClient.post('/boards', { title, content });
            alert('게시글이 등록되었습니다.');
            navigate('/board');
        } catch (err) {
            setError('게시글 등록에 실패했습니다.');
            console.error(err);
        }
    };

    return (
        <div className="board-container">
            <h1>요청 게시판 작성</h1>
            
            <form onSubmit={handleSubmit} className="board-form">
                <div className="form-group">
                    <label htmlFor="title">제목</label>
                    <input 
                        type="text" 
                        id="title"
                        value={title} 
                        onChange={handleTitleChange}
                        maxLength={50}
                    />
                    <span className="char-count">{title.length}/50</span>
                </div>
                <div className="form-group">
                    <label htmlFor="content">내용</label>
                    <textarea 
                        id="content"
                        value={content} 
                        onChange={handleContentChange}
                        maxLength={5000}
                    ></textarea>
                    <span className="char-count">{content.length}/5000</span>
                </div>
                {error && <p className="error-message">{error}</p>}
                <div className="form-actions">
                    <button type="submit">등록</button>
                    <button type="button" onClick={() => navigate('/board')} className="cancel-button">취소</button>
                </div>
            </form>
        </div>
    );
}

export default BoardNew;
