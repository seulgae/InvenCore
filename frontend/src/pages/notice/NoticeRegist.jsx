import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/axios';
import '../../styles/NoticeRegist.css';

function NoticeRegist() {
    const navigate = useNavigate();

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [error, setError] = useState('');

    const handleTitleChange = (e) => {
        const value = e.target.value ?? '';
        setTitle(value.slice(0, 50));
    };

    const handleContentChange = (e) => {
        const value = e.target.value ?? '';
        setContent(value.slice(0, 5000));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const t = title.trim();
        const c = content.trim();

        if (!t || !c) {
            setError('제목과 내용을 모두 입력해주세요.');
            return;
        }
        if (t.length > 50) {
            setError('제목은 50자 이내로 입력해주세요.');
            return;
        }
        if (c.length > 5000) {
            setError('내용은 5000자 이내로 입력해주세요.');
            return;
        }

        try {
            await apiClient.post('/notices', { title: t, content: c });
            alert('공지사항이 등록되었습니다.');
            navigate('/notice');
        } catch (err) {
            console.error(err);
            setError('공지사항 등록에 실패했습니다.');
        }
    };

    return (
        <div className="notice-container">
            <h1>공지사항 작성</h1>

            <form onSubmit={handleSubmit} className="notice-form">
                <div className="form-group">
                    <label htmlFor="title">제목</label>
                    <input
                        type="text"
                        id="title"
                        value={title}
                        onChange={handleTitleChange}
                        maxLength={50}
                        autoComplete="off"
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
                    />
                    <span className="char-count">{content.length}/5000</span>
                </div>

                {error && <p className="error-message">{error}</p>}

                <div className="form-actions">
                    <button type="submit" className="submit-button">
                        등록
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/notice')}
                        className="cancel-button"
                    >
                        취소
                    </button>
                </div>
            </form>
        </div>
    );
}

export default NoticeRegist;
