import { useState } from "react";
import "../styles/PasswordInput.css";

/** 입력값을 유지하면서 비밀번호 표시 여부만 전환합니다. */
export default function PasswordInput(props) {
  const [visible, setVisible] = useState(false);
  const action = visible ? "비밀번호 숨기기" : "비밀번호 보기";

  return (
    <span className="password-field">
      <input {...props} type={visible ? "text" : "password"} />
      <button
        className="password-field__toggle"
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-label={action}
        aria-pressed={visible}
        title={action}
        disabled={props.disabled}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
          {!visible && <path d="M3 3 21 21" />}
        </svg>
      </button>
    </span>
  );
}
