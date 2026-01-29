import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/axios';
import '../../styles/RequestBoardRegist.css';

const TITLE_REGEX = /^[가-힣a-zA-Z0-9\s.,!?:;\-\[\]]*$/;
const TITLE_MAX_LENGTH = 50;
const FILE_MAX_SIZE = 5 * 1024 * 1024; // 5MB

function RequestBoardRegist() {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [file, setFile] = useState(null);
    const [error, setError] = useState('');
    const navigate = useNavigate();

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

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            if (selectedFile.size > FILE_MAX_SIZE) {
                setError('파일 크기는 5MB를 초과할 수 없습니다.');
                e.target.value = null; // 파일 선택 취소
                setFile(null);
            } else {
                setError(''); // 에러 메시지 초기화
                setFile(selectedFile);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!title.trim() || !content.trim()) {
            setError('제목과 내용을 모두 입력해주세요.');
            return;
        }
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

        const formData = new FormData();
        const requestBoardDTO = { title, content };
        formData.append('requestBoardDTO', new Blob([JSON.stringify(requestBoardDTO)], { type: 'application/json' }));
        if (file) {
            formData.append('file', file);
        }

        try {
            await apiClient.post('/requestboards', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            alert('게시글이 등록되었습니다.');
            navigate('/requestboard');
        } catch (err) {
            const serverMsg = err?.response?.data?.message || '게시글 등록에 실패했습니다.';
            setError(serverMsg);
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
                <div className="form-group">
                    <label htmlFor="file">첨부파일 (최대 5MB)</label>
                    <input
                        type="file"
                        id="file"
                        onChange={handleFileChange}
                    />
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
