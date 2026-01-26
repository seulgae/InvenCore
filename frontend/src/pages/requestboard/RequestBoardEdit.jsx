import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../api/axios';
import '../../styles/RequestBoardEdit.css';

// ✅ 백엔드 @Pattern과 동일
const TITLE_REGEX = /^[가-힣a-zA-Z0-9\s.,!?:;\-\[\]]*$/;

// ✅ 프론트 제목 최대 길이
const TITLE_MAX_LENGTH = 50;

function RequestBoardEdit() {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [error, setError] = useState('');
    const { id } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchRequestBoard = async () => {
            try {
                const response = await apiClient.get(`/requestboards/${id}`);
                setTitle(response.data.title ?? '');
                setContent(response.data.content ?? '');
            } catch (err) {
                const serverMsg =
                    err?.response?.data?.message ||
                    (typeof err?.response?.data === 'string' ? err.response.data : null);
                setError(serverMsg || '게시글 정보를 불러오는 데 실패했습니다.');
                console.error(err);
            }
        };

        if (id) fetchRequestBoard();
    }, [id]);

    // ✅ 50자 초과 입력 자체 차단
    const handleTitleChange = (e) => {
        const value = e.target.value;
        if (value.length <= TITLE_MAX_LENGTH) {
            setTitle(value);
        }
    };

    const handleContentChange = (e) => {
        const value = e.target.value;
        if (value.length <= 5000) setContent(value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!title.trim() || !content.trim()) {
            setError('제목과 내용을 모두 입력해주세요.');
            return;
        }

        // ✅ 제목 길이 50자 제한
        if (title.length > TITLE_MAX_LENGTH) {
            setError(`제목은 ${TITLE_MAX_LENGTH}자 이내로 입력해주세요.`);
            return;
        }

        if (content.length > 5000) {
            setError('내용은 5000자 이내로 입력해주세요.');
            return;
        }

        if (!TITLE_REGEX.test(title)) {
            setError('제목에는 한글, 영문, 숫자, 공백, 구두점(.,!?:;-) 및 대괄호([])만 입력 가능합니다.');
            return;
        }

        try {
            await apiClient.put(`/requestboards/${id}`, { title, content });
            alert('게시글이 수정되었습니다.');
            navigate(`/requestboard/${id}`);
        } catch (err) {
            const data = err?.response?.data;

            let msg = null;
            if (data?.message) msg = data.message;

            if (!msg && data?.errors && typeof data.errors === 'object') {
                msg = Object.values(data.errors)
                    .map((e) => e?.defaultMessage)
                    .filter(Boolean)
                    .join(', ');
            }

            if (!msg && typeof data === 'string') msg = data;

            setError(msg || '게시글 수정에 실패했습니다.');
            console.error(err);
        }
    };

    return (
        <div className="request-board-container">
            <h1>요청 게시판 수정</h1>

            <form onSubmit={handleSubmit} className="request-board-form">
                <div className="form-group">
                    <label htmlFor="title">제목</label>
                    <input
                        type="text"
                        id="title"
                        value={title}
                        onChange={handleTitleChange}
                        maxLength={TITLE_MAX_LENGTH}
                    />
                    <span className="char-count">
            {title.length}/{TITLE_MAX_LENGTH}
          </span>
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
                    <button type="submit" className="submit-button">수정 완료</button>
                    <button
                        type="button"
                        onClick={() => navigate(`/requestboard/${id}`)}
                        className="cancel-button"
                    >
                        취소
                    </button>
                </div>
            </form>
        </div>
    );
}

export default RequestBoardEdit;
