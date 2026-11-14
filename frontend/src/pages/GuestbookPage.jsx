import { useEffect, useRef, useState } from "react";
import apiClient from "../api/axios";
import "../styles/Guestbook.css";

const characters = [
  { id: "sprout", icon: "🌱", label: "새싹" },
  { id: "cat", icon: "🐱", label: "고양이" },
  { id: "robot", icon: "🤖", label: "로봇" },
  { id: "cloud", icon: "☁️", label: "구름" },
  { id: "coffee", icon: "☕", label: "커피" },
  { id: "star", icon: "⭐", label: "별" },
];
const dateFormat = new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false });
const emptyPage = { content: [], totalElements: 0, totalPages: 0, number: 0 };

export default function GuestbookPage() {
  const [avatar, setAvatar] = useState("sprout");
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
      await apiClient.post("/guestbook", { nickname: nickname.trim(), message: message.trim(), avatar });
      setMessage("");
      setFeedback({ ok: true, text: "소중한 발자국을 남겨주셔서 고마워요!" });
      setLoading(true);
      setPage(0);
      setReload(value => value + 1);
    } catch (error) {
      setFeedback({ ok: false, text: error.response?.status === 400 ? "닉네임과 인사말의 길이를 확인해 주세요." : "저장하지 못했어요. 입력한 내용은 그대로 있으니 잠시 후 다시 시도해 주세요." });
    } finally { submitting.current = false; setPending(false); }
  };
  return (
    <div className="guestbook-page">
      <header className="guestbook-heading"><div><span className="lab-eyebrow">A LITTLE HELLO GOES A LONG WAY</span><h1>다녀간 자리, <em>작은 인사.</em></h1><p>잘 보고 간다는 한마디도, 오늘의 아무 이야기라도 좋아요.</p></div><div className="guestbook-stamp" aria-hidden="true"><span>✳</span>GUEST<br />BOOK</div></header>
      <div className="guestbook-window">
        <div className="guestbook-window-bar"><span><i /><i /><i /></span><span>InvenCore's mini home · guestbook</span><span>✧</span></div>
        <div className="guestbook-banner"><div className="guestbook-house" aria-hidden="true">🏡<span>✦</span></div><div><span>WELCOME TO MY LITTLE SPACE</span><h2>오늘도 반가워요!</h2><p>잠깐 머물다 가는 당신의 발자국을 남겨주세요.</p></div><span className="guestbook-banner-flower" aria-hidden="true">✿</span></div>
        <form className="guestbook-compose" onSubmit={submit}>
          <div className={`guestbook-avatar avatar-${avatar}`} aria-hidden="true">{characters.find(character => character.id === avatar)?.icon}<small>나의 캐릭터</small></div>
          <div className="guestbook-compose-fields"><div className="guestbook-compose-top"><label htmlFor="guest-nickname">이름<input id="guest-nickname" autoComplete="nickname" maxLength={20} placeholder="닉네임 (최대 20자)" value={nickname} onChange={event => setNickname(event.target.value)} required disabled={pending} /></label><fieldset disabled={pending}><legend>캐릭터 선택</legend><div className="guestbook-character-options">{characters.map(character => <button type="button" key={character.id} aria-label={character.label} aria-pressed={avatar === character.id} onClick={() => setAvatar(character.id)}>{character.icon}</button>)}</div></fieldset></div>
            <label className="guestbook-message-label" htmlFor="guest-message">남기고 싶은 이야기<textarea id="guest-message" placeholder="여기에 짧은 인사를 남겨주세요. : )" rows={4} maxLength={500} value={message} onChange={event => setMessage(event.target.value)} required disabled={pending} /></label>
            <div className="guestbook-compose-bottom"><span>로그인 없이 편하게 남겨주세요.<br /><small>이름과 내용은 모든 방문자에게 공개됩니다.</small></span><div><span>{message.length} / 500</span><button type="submit" disabled={pending || !nickname.trim() || !message.trim()}>{pending ? "남기는 중…" : "발자국 남기기"} <span aria-hidden="true">↗</span></button></div></div>
            {feedback && <p className={`guestbook-feedback ${feedback.ok ? "is-success" : "is-error"}`} role={feedback.ok ? "status" : "alert"}>{feedback.text}</p>}
          </div>
        </form>
        <section className="guestbook-entries" aria-labelledby="guestbook-list-title" aria-busy={loading}>
          <header><h2 id="guestbook-list-title">남겨진 발자국 <span>{!loadError && !loading ? entries.totalElements : "—"}</span></h2><span>가장 최근의 인사부터</span></header>
          {loading ? <p className="guestbook-state" role="status">발자국을 불러오는 중이에요…</p> : loadError ? <div className="guestbook-state" role="alert"><p>방명록을 불러오지 못했어요.</p><button onClick={() => { setLoading(true); setReload(value => value + 1); }}>다시 불러오기</button></div> : entries.content.length === 0 ? <div className="guestbook-state"><span aria-hidden="true">✉</span><h3>아직은 조용한 방명록.</h3><p>{page === 0 ? "첫 번째 인사를 남겨줄래요?" : "이 페이지에는 남겨진 인사가 없어요."}</p></div> : entries.content.map((entry, index) => <article className="guestbook-entry" key={entry.id}><header><span>No. {String(entries.totalElements - page * 8 - index).padStart(3, "0")}</span><h3>{entry.nickname}</h3><time dateTime={entry.createdAt}>{dateFormat.format(new Date(entry.createdAt))}</time></header><div className="guestbook-entry-body"><div className={`guestbook-avatar avatar-${entry.avatar}`} aria-hidden="true">{characters.find(character => character.id === entry.avatar)?.icon || "🌱"}</div><p>{entry.message}</p></div></article>)}
          {!loading && !loadError && entries.totalPages > 1 && <nav className="guestbook-pagination" aria-label="방명록 페이지"><button disabled={page === 0} onClick={() => changePage(page - 1)}>← 이전</button><span>{page + 1} / {entries.totalPages}</span><button disabled={page + 1 >= entries.totalPages} onClick={() => changePage(page + 1)}>다음 →</button></nav>}
        </section>
        <footer className="guestbook-window-footer">작은 인사가 모여, 이 공간의 추억이 됩니다. <span aria-hidden="true">♡</span></footer>
      </div>
    </div>
  );
}
