import { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import apiClient from "../../api/axios";
import BenchmarkPage from "../../pages/benchmark/BenchmarkPage";
import { join, login } from "../../services/authService";
import RequestBoardList from "../../pages/requestboard/RequestBoardList";
import RequestBoardRegist from "../../pages/requestboard/RequestBoardRegist";
import ServerCapacityPage from "../../pages/servercapacity/ServerCapacityPage";

function AuthDemo() {
  const { refreshSession, isLoggedIn } = useOutletContext();
  const [mode, setMode] = useState("login");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const submit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setPending(true);
    setMessage("");
    try {
      if (mode === "login") {
        const result = await login(data.get("username"), data.get("password"));
        if (!result.success) throw new Error("로그인에 실패했습니다.");
        refreshSession();
        setMessage(
          `${result.username} 로그인 완료 · sessionStorage에 토큰 저장`,
        );
      } else {
        await join(data.get("username"), data.get("password"));
        setMessage("회원가입 완료 · 로그인할 수 있습니다.");
      }
      form.reset();
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          (error.response
            ? error.message
            : "백엔드 연결 실패 · 서버 실행 상태를 확인하세요."),
      );
    } finally {
      setPending(false);
    }
  };
  return (
    <div className="auth-playground">
      <div className="demo-form-description">
        <span className="demo-object">◈</span>
        <h3>인증 요청</h3>
        <code>POST /api/members/{mode}</code>
        <p>
          실제 계정으로 요청합니다.
          <br />
          회원가입은 DB에 계정을 생성합니다.
        </p>
        <span className="demo-state-badge">
          {isLoggedIn ? "AUTHENTICATED" : "ANONYMOUS"}
        </span>
      </div>
      <div className="demo-form-panel">
        <div className="demo-mode-toggle">
          <button
            aria-pressed={mode === "login"}
            onClick={() => {
              setMode("login");
              setMessage("");
            }}
          >
            로그인
          </button>
          <button
            aria-pressed={mode === "register"}
            onClick={() => {
              setMode("register");
              setMessage("");
            }}
          >
            회원가입
          </button>
        </div>
        <form onSubmit={submit}>
          <label>
            아이디
            <input
              name="username"
              autoComplete="username"
              required
              minLength={mode === "register" ? 4 : 1}
              maxLength={20}
              pattern="[A-Za-z0-9]+"
              placeholder="username"
            />
          </label>
          <label>
            비밀번호
            <input
              name="password"
              type="password"
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              required
              minLength={mode === "register" ? 8 : 1}
              maxLength={mode === "register" ? 20 : undefined}
              placeholder="password"
            />
          </label>
          {mode === "register" && (
            <small>8~20자 · 영문 대/소문자, 숫자, 특수기호 포함</small>
          )}
          <button disabled={pending} type="submit">
            {pending
              ? "요청 중..."
              : mode === "login"
                ? "로그인 요청 →"
                : "계정 생성 요청 →"}
          </button>
        </form>
        <p className="demo-response" role="status">
          {message || "요청 결과가 이곳에 표시됩니다."}
        </p>
      </div>
    </div>
  );
}

function CommentDemo() {
  const [boards, setBoards] = useState([]);
  const [boardId, setBoardId] = useState("");
  const [comments, setComments] = useState([]);
  const [state, setState] = useState("loading");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    apiClient
      .get("/requestboards", {
        params: { size: 50 },
        signal: controller.signal,
      })
      .then(({ data }) => {
        setBoards(data.content || []);
        setState("ready");
      })
      .catch((error) => {
        if (error.code !== "ERR_CANCELED") setState("error");
      });
    return () => controller.abort();
  }, []);
  useEffect(() => {
    if (!boardId) return;
    const controller = new AbortController();
    apiClient
      .get(`/comments/requestboard/${boardId}`, { signal: controller.signal })
      .then(({ data }) => {
        setComments(data);
        setMessage("");
      })
      .catch((error) => {
        if (error.code !== "ERR_CANCELED")
          setMessage("댓글 조회 실패 · 백엔드 상태를 확인하세요.");
      });
    return () => controller.abort();
  }, [boardId]);
  const submit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setPending(true);
    setMessage("");
    try {
      await apiClient.post("/comments", {
        requestBoardId: Number(boardId),
        content: data.get("content"),
        parentId: data.get("parentId") ? Number(data.get("parentId")) : null,
      });
      const response = await apiClient.get(`/comments/requestboard/${boardId}`);
      setComments(response.data);
      form.reset();
      setMessage("댓글 저장 완료");
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "댓글 저장 실패 · 백엔드 상태를 확인하세요.",
      );
    } finally {
      setPending(false);
    }
  };
  if (state === "loading")
    return <p className="inspector-state">게시글 로딩 중...</p>;
  if (state === "error")
    return (
      <p className="inspector-state" role="alert">
        게시글 조회 실패 · 백엔드를 실행한 후 실행 탭을 다시 열어 주세요.
      </p>
    );
  return (
    <div className="comment-playground">
      <label>
        게시글 선택 <small>최근 최대 50개</small>
        <select
          value={boardId}
          onChange={(event) => {
            setBoardId(event.target.value);
            setComments([]);
            setMessage("");
          }}
        >
          <option value="">게시글 선택</option>
          {boards.map((board) => (
            <option key={board.id} value={board.id}>
              #{board.id} {board.title}
            </option>
          ))}
        </select>
      </label>
      {!boards.length && (
        <p className="inspector-state">
          등록된 게시글이 없습니다.{" "}
          <Link to="/requestboard/regist">게시글 작성 →</Link>
        </p>
      )}
      {boardId && (
        <>
          <div className="demo-comment-list">
            {comments.length === 0 ? (
              <p>댓글이 없습니다.</p>
            ) : (
              comments.map((comment) => (
                <article key={comment.id}>
                  <header>
                    <strong>{comment.author}</strong>
                    <code>#{comment.id}</code>
                  </header>
                  <p>{comment.content}</p>
                  {comment.replies?.map((reply) => (
                    <div className="demo-reply" key={reply.id}>
                      <strong>↳ {reply.author}</strong>
                      <p>{reply.content}</p>
                    </div>
                  ))}
                </article>
              ))
            )}
          </div>
          {
            <form onSubmit={submit}>
              <label>
                답글 대상
                <select name="parentId">
                  <option value="">새 댓글</option>
                  {comments.map((comment) => (
                    <option key={comment.id} value={comment.id}>
                      #{comment.id} {comment.author}에게 답글
                    </option>
                  ))}
                </select>
              </label>
              <label>
                내용
                <textarea name="content" required maxLength={1000} rows={3} />
              </label>
              <button disabled={pending}>
                {pending ? "저장 중..." : "실제 댓글 등록 →"}
              </button>
            </form>
          }
        </>
      )}
      <p className="demo-response" role="status">
        {message}
      </p>
    </div>
  );
}
export default function FeatureDemo({ item }) {
  const { isLoggedIn, openLoginModal } = useOutletContext();
  const [connection, setConnection] = useState("checking");
  useEffect(() => {
    const controller = new AbortController();
    apiClient
      .get("/health", { signal: controller.signal })
      .then(() => setConnection("connected"))
      .catch((error) => {
        if (error.code !== "ERR_CANCELED") setConnection("offline");
      });
    return () => controller.abort();
  }, []);
  const protectedDemo = item.id === "capacity";
  return (
    <section className="feature-demo">
      <header className="demo-toolbar">
        <span>
          <i className={`connection-dot ${connection}`} />
          {connection === "checking"
            ? "API CHECKING"
            : connection === "connected"
              ? "API CONNECTED"
              : "API UNAVAILABLE"}
        </span>
        <code>REST / api</code>
        {item.route && <Link to={item.route}>독립 화면 ↗</Link>}
      </header>
      <div className="demo-runtime-note">
        LIVE INSTANCE{" "}
        <span>실제 백엔드에 연결됩니다. 작성·수정·삭제는 DB에 반영됩니다.</span>
      </div>
      {item.id === "capacity" && (
        <p className="demo-configuration-note">
          SSH 모니터 · 기능 활성화, 서버 목록 및 SSH 키 설정 필요 · 기본
          비활성화
        </p>
      )}
      {protectedDemo && !isLoggedIn ? (
        <div className="demo-auth-gate">
          <span>◈</span>
          <h3>인증이 필요한 실행 화면</h3>
          <code>{item.endpoint}</code>
          <button onClick={openLoginModal}>로그인</button>
        </div>
      ) : (
        <>
          <div className="demo-canvas">
            {item.id === "auth" && <AuthDemo />}
            {item.id === "board" && <RequestBoardList />}
            {item.id === "files" && <RequestBoardRegist />}
            {item.id === "capacity" && <ServerCapacityPage />}
            {item.id === "comments" && <CommentDemo />}
            {item.id === "parallel-stream" && <BenchmarkPage kind="streams" />}
            {item.id === "index-tuning" && <BenchmarkPage kind="indexes" />}
          </div>
        </>
      )}
    </section>
  );
}
