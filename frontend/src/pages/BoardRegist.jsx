import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/axios';
import '../styles/BoardRegist.css';

function BoardRegist() {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!title || !content) {
            setError('제목과 내용을 모두 입력해주세요.');
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
                    <button type="submit" className="submit-button">등록</button> {/* ✅ 클래스 추가 */}
                    <button type="button" onClick={() => navigate('/board')} className="cancel-button">취소</button>
                </div>
            </form>
        </div>
    );
}

export default BoardRegist;