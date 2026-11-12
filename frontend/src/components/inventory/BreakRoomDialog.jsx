import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../../styles/BreakRoom.css";
import { playEndingMusic } from "../../services/endingMusic";

/** 휴식 이벤트를 선택하는 팝업을 렌더링합니다. */
export default function BreakRoomDialog({ onClose }) {
  const dialogRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  /** 클릭 동작에서 BGM 재생을 시작하고 엔딩 화면으로 이동합니다. */
  const playEnding = () => {
    void playEndingMusic({ restart: true });
    navigate("/break-room", { state: { returnTo: location.pathname + location.search } });
  };
  useEffect(() => {
    const dialog = dialogRef.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return (
    <dialog
      ref={dialogRef}
      className="break-room-dialog"
      aria-labelledby="break-room-title"
      onCancel={onClose}
    >
      <button className="break-room-close" onClick={onClose} aria-label="팝업 닫기">
        ×
      </button>
      <span className="break-room-label">TAKE A BREAK</span>
      <h2 id="break-room-title">1분 취업준비 탈출 버튼</h2>
      <p></p>
      <div className="break-buttons">
        <button className="break-red" onClick={playEnding}>
          빨간 버튼
        </button>
        <button className="break-blue" onClick={onClose}>
          파란 버튼
        </button>
      </div>
    </dialog>
  );
}
