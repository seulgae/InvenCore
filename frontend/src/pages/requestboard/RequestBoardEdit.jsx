import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../api/axios';
import '../../styles/RequestBoardEdit.css';

const TITLE_REGEX = /^[가-힣a-zA-Z0-9\s.,!?:;\-\[\]]*$/;
const TITLE_MAX_LENGTH = 50;
const FILE_MAX_SIZE = 5 * 1024 * 1024; // 5MB

function RequestBoardEdit() {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [existingFileName, setExistingFileName] = useState('');
    const [newFile, setNewFile] = useState(null);
    const [deleteExistingFile, setDeleteExistingFile] = useState(false);
    const [error, setError] = useState('');
    const { id } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchRequestBoard = async () => {
            try {
                const response = await apiClient.get(`/requestboards/${id}`);
                setTitle(response.data.title ?? '');
                setContent(response.data.content ?? '');
                setExistingFileName(response.data.fileName ?? '');
            } catch (err) {
                const serverMsg = err?.response?.data?.message || '게시글 정보를 불러오는 데 실패했습니다.';
                setError(serverMsg);
                console.error(err);
            }
        };
        if (id) fetchRequestBoard();
    }, [id]);

    const handleTitleChange = (e) => {
        const value = e.target.value;
        if (value.length <= TITLE_MAX_LENGTH) setTitle(value);
    };

    const handleContentChange = (e) => {
        const value = e.target.value;
        if (value.length <= 5000) setContent(value);
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            if (selectedFile.size > FILE_MAX_SIZE) {
                setError('파일 크기는 5MB를 초과할 수 없습니다.');
                e.target.value = null;
                setNewFile(null);
            } else {
                setError('');
                setNewFile(selectedFile);
                setDeleteExistingFile(false);
            }
        }
    };

    const handleRemoveExistingFile = () => {
        setDeleteExistingFile(true);
        setExistingFileName(''); // 화면에서 즉시 파일 이름 제거
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
        const requestBoardDTO = { title, content, deleteExistingFile };
        formData.append('requestBoardDTO', new Blob([JSON.stringify(requestBoardDTO)], { type: 'application/json' }));
        
        if (newFile) {
            formData.append('file', newFile);
        }

        try {
            await apiClient.put(`/requestboards/${id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            alert('게시글이 수정되었습니다.');
            navigate(`/requestboard/${id}`);
        } catch (err) {
            const data = err?.response?.data;
            let msg = data?.message || (typeof data === 'string' ? data : null);
            if (!msg && data?.errors) {
                msg = Object.values(data.errors).join(', ');
            }
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
                    <label>첨부파일 (최대 5MB)</label>
                    {existingFileName && !deleteExistingFile && !newFile && (
                        <div className="existing-file">
                            <span>{existingFileName}</span>
                            <button type="button" onClick={handleRemoveExistingFile} className="remove-file-button">삭제</button>
                        </div>
                    )}
                    {(deleteExistingFile || !existingFileName || newFile) && (
                         <input type="file" id="file" onChange={handleFileChange} />
                    )}
                    {newFile && (
                        <span className="new-file-name">{newFile.name}</span>
                    )}
                </div>

                {error && <p className="error-message">{error}</p>}
                <div className="form-actions">
                    <button type="submit" className="submit-button">수정 완료</button>
                    <button type="button" onClick={() => navigate(`/requestboard/${id}`)} className="cancel-button">취소</button>
                </div>
            </form>
        </div>
    );
}

export default RequestBoardEdit;
