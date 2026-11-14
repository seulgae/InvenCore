import { useEffect, useRef, useState } from "react";
import apiClient from "../api/axios";
import "../styles/Guestbook.css";

const dateFormat = new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false });
const emptyPage = { content: [], totalElements: 0, totalPages: 0, number: 0 };

export default function GuestbookPage() {
  const [nickname, setNickname] = useState("");
  const [message, setMessage] = useState("");
  const [page, setPage] = useState(0);
  const [reload, setReload] = useState(0);
  const [entries, setEntries] = useState(emptyPage);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const submitting = useRef(false);
  useEffect(() => {
    const controller = new AbortController();
    apiClient.get("/guestbook", { params: { page }, signal: controller.signal })
      .then(({ data }) => { setEntries(data); setLoadError(false); setLoading(false); })
      .catch(error => { if (error.code !== "ERR_CANCELED") { setLoadError(true); setLoading(false); } });
    return () => controller.abort();
  }, [page, reload]);
  const changePage = next => { setLoading(true); setLoadError(false); setPage(next); };
  const submit = async event => {
    event.preventDefault();
    if (submitting.current || !nickname.trim() || !message.trim()) return;
    submitting.current = true;
    setPending(true);
    setFeedback(null);
    try {
      await apiClient.post("/guestbook", { nickname: nickname.trim(), message: message.trim(), avatar: "robot" });
      setMessage("");
      setFeedback({ ok: true, text: "댓글을 남겼습니다." });
      setLoading(true);
      setPage(0);
      setReload(value => value + 1);
    } catch (error) {
      setFeedback({ ok: false, text: error.response?.status === 400 ? "닉네임과 댓글의 길이를 확인해 주세요." : "저장하지 못했어요. 잠시 후 다시 시도해 주세요." });
    } finally { submitting.current = false; setPending(false); }
  };
  return (
    <div className="guestbook-page">
      <header className="guestbook-heading">
        <span className="lab-eyebrow">GUESTBOOK</span>
        <h1>방명록</h1>
        <p>편하게 한마디 남겨주세요.</p>
      </header>
      <form className="guestbook-compose" onSubmit={submit}>
        <label htmlFor="guest-nickname">닉네임
          <input id="guest-nickname" autoComplete="nickname" maxLength={20} placeholder="닉네임 (최대 20자)" value={nickname} onChange={event => setNickname(event.target.value)} required disabled={pending} />
        </label>
        <label htmlFor="guest-message">댓글
          <textarea id="guest-message" placeholder="남기고 싶은 이야기를 적어주세요." rows={3} maxLength={500} value={message} onChange={event => setMessage(event.target.value)} required disabled={pending} />
        </label>
        <div className="guestbook-compose-bottom">
          <span>작성한 내용은 모든 방문자에게 공개됩니다.</span>
          <div><span>{message.length} / 500</span><button type="submit" disabled={pending || !nickname.trim() || !message.trim()}>{pending ? "등록 중…" : "등록"}</button></div>
        </div>
        {feedback && <p className={`guestbook-feedback ${feedback.ok ? "is-success" : "is-error"}`} role={feedback.ok ? "status" : "alert"}>{feedback.text}</p>}
      </form>
      <section className="guestbook-entries" aria-labelledby="guestbook-list-title" aria-busy={loading}>
        <header><h2 id="guestbook-list-title">댓글 <span>{!loadError && !loading ? entries.totalElements : "—"}</span></h2><span>최신순</span></header>
        {loading ? <p className="guestbook-state" role="status">불러오는 중…</p> : loadError ? <div className="guestbook-state" role="alert"><p>방명록을 불러오지 못했어요.</p><button onClick={() => { setLoading(true); setReload(value => value + 1); }}>다시 불러오기</button></div> : entries.content.length === 0 ? <p className="guestbook-state">아직 댓글이 없습니다.</p> : entries.content.map(entry => (
          <article className="guestbook-entry" key={entry.id}>
            <span className="guestbook-robot" aria-hidden="true">🤖</span>
            <div className="guestbook-entry-content"><header><h3>{entry.nickname}</h3><time dateTime={entry.createdAt}>{dateFormat.format(new Date(entry.createdAt))}</time></header><p>{entry.message}</p></div>
          </article>
        ))}
        {!loading && !loadError && entries.totalPages > 1 && <nav className="guestbook-pagination" aria-label="방명록 페이지"><button disabled={page === 0} onClick={() => changePage(page - 1)}>← 이전</button><span>{page + 1} / {entries.totalPages}</span><button disabled={page + 1 >= entries.totalPages} onClick={() => changePage(page + 1)}>다음 →</button></nav>}
      </section>
    </div>
  );
}