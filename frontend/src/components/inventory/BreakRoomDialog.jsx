import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../../styles/BreakRoom.css";
import { playEndingMusic } from "../../services/endingMusic";

export default function BreakRoomDialog({ onClose }) {
  const dialogRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const playEnding = () => {
    void playEndingMusic({ restart: true });
    navigate("/break-room", { state: { returnTo: location.pathname + location.search } });
  };
  useEffect(() => {
    const dialog = dialogRef.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return <dialog ref={dialogRef} className="break-room-dialog" aria-labelledby="break-room-title" onCancel={onClose}>
    <button className="break-room-close" onClick={onClose} aria-label="팝업 닫기">×</button>
    <span className="break-room-label">TAKE A BREAK</span>
    <h2 id="break-room-title">홈페이지 파괴버튼</h2>
    <p></p>
    <div className="break-buttons">
      <button className="break-red" onClick={playEnding}>빨간 버튼</button>
      <button className="break-blue" onClick={onClose}>파란 버튼</button>
    </div>
  </dialog>;
}
