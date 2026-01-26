import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/axios';
import '../../styles/RequestBoardRegist.css';

// ✅ 백엔드 @Pattern과 동일
const TITLE_REGEX = /^[가-힣a-zA-Z0-9\s.,!?:;\-\[\]]*$/;

// ✅ 프론트 제목 최대 길이
const TITLE_MAX_LENGTH = 50;

function RequestBoardRegist() {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // ✅ 50자 초과 입력 자체 차단
    const handleTitleChange = (e) => {
        const value = e.target.value;
        if (value.length <= TITLE_MAX_LENGTH) {
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

        // ✅ 공백만 있는지 확인
        if (!title.trim() || !content.trim()) {
            setError('제목과 내용을 모두 입력해주세요.');
            return;
        }

        // ✅ 길이 검증 (프론트 기준 50)
        if (title.length > TITLE_MAX_LENGTH) {
            setError(`제목은 ${TITLE_MAX_LENGTH}자 이내로 입력해주세요.`);
            return;
        }

        if (content.length > 5000) {
            setError('내용은 5000자 이내로 입력해주세요.');
            return;
        }

        // ✅ 제목 허용 문자 검증 (백엔드 @Pattern과 통일)
        if (!TITLE_REGEX.test(title)) {
            setError('제목에는 한글, 영문, 숫자, 공백, 구두점(.,!?:;-) 및 대괄호([])만 입력 가능합니다.');
            return;
        }

        try {
            await apiClient.post('/requestboards', { title, content });
            alert('게시글이 등록되었습니다.');
            navigate('/requestboard');
        } catch (err) {
            // ✅ 서버 응답 메시지 우선 노출 (validation/권한/기타)
            const serverMsg =
                err?.response?.data?.message ||
                (typeof err?.response?.data === 'string' ? err.response.data : null);

            setError(serverMsg || '게시글 등록에 실패했습니다.');
            console.error(err);
        }
    };

    return (
        <div className="request-board-container">
            <h1>요청 게시판 작성</h1>

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
                    <span className="char-count">{title.length}/{TITLE_MAX_LENGTH}</span>
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
                    <button type="submit" className="submit-button">등록</button>
                    <button
                        type="button"
                        onClick={() => navigate('/requestboard')}
                        className="cancel-button"
                    >
                        취소
                    </button>
                </div>
            </form>
        </div>
    );
}

export default RequestBoardRegist;
