import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { displayPath } from "../../data/inventory";

const tokenPattern =
  /(\/\/.*$|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b(?:import|from|export|default|const|let|return|if|else|try|catch|finally|async|await|new|throw|public|private|protected|class|void|package|implements|boolean|null|true|false|static|final|this|for|int|long)\b|@[A-Za-z]+|\b\d+\b)/g;

/** 소스 한 줄을 구문 강조 토큰으로 나누어 표시합니다. */
function CodeLine({ line }) {
  // 메서드 설명은 한 가지 색으로 표시해 주석 안의 Java 키워드가 강조되지 않게 합니다.
  if (/^\s*(?:\/\*|\*(?:\s|\/|$)|<!--|#)/.test(line)) {
    return <span className="syntax-comment">{line}</span>;
  }
  return line.split(tokenPattern).map((token, index) => {
    const type = token.startsWith("//")
      ? "comment"
      : /^["']/.test(token)
        ? "string"
        : token.startsWith("@")
          ? "annotation"
          : /^\d+$/.test(token)
            ? "number"
            : /^(import|from|export|default|const|let|return|if|else|try|catch|finally|async|await|new|throw|public|private|protected|class|void|package|implements|boolean|null|true|false|static|final|this|for|int|long)$/.test(
                  token,
                )
              ? "keyword"
              : "";
    return (
      <span key={index} className={type ? `syntax-${type}` : undefined}>
        {token}
      </span>
    );
  });
}

/** 선택한 소스를 불러와 줄 번호·줄바꿈·복사 기능과 함께 표시합니다. */
function SourceFile({ file }) {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("loading");
  const [copyStatus, setCopyStatus] = useState("");
  const [wrap, setWrap] = useState(false);
  useEffect(() => {
    let active = true;
    file
      .load()
      .then((module) => {
        if (active) {
          setCode(module.default);
          setStatus("ready");
        }
      })
      .catch(() => {
        if (active) setStatus("error");
      });
    return () => {
      active = false;
    };
  }, [file]);

  /** 화면에 표시한 원문을 클립보드에 복사하고 결과를 안내합니다. */
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopyStatus("복사됨");
    } catch {
      setCopyStatus("복사 실패 · 코드를 선택해 복사하세요");
    }
  };
  const path = displayPath(file.path);
  const lines = code.replace(/\r\n/g, "\n").split("\n");
  return (
    <section className="source-editor" aria-label="소스 코드">
      <header className="source-editor-toolbar">
        <span title={path}>{path.split("/").pop()}</span>
        <small>{status === "ready" ? `${lines.length} lines` : "…"}</small>
        <button aria-pressed={wrap} onClick={() => setWrap(!wrap)}>
          줄바꿈
        </button>
        <button disabled={status !== "ready"} onClick={copy}>
          복사
        </button>
      </header>
      <p className="source-path">{path}</p>
      <span className="source-copy-status" role="status">
        {copyStatus}
      </span>
      {status === "loading" ? (
        <p className="inspector-state">소스 로딩 중...</p>
      ) : status === "error" ? (
        <p className="inspector-state" role="alert">
          소스를 불러오지 못했습니다.
        </p>
      ) : (
        <pre
          className={`source-code ${wrap ? "source-wrap" : ""}`}
          tabIndex={0}
          aria-label={`${path} 전체 소스`}
        >
          <code>
            {lines.map((line, index) => (
              <span className="code-line" key={index}>
                <span className="line-number" aria-hidden="true">
                  {index + 1}
                </span>
                <span className="line-content">
                  <CodeLine line={line} />
                  {!line && "\u00a0"}
                </span>
              </span>
            ))}
          </code>
        </pre>
      )}
    </section>
  );
}

/** 카드의 소스 탐색기와 선택한 파일 내용을 렌더링합니다. */
export default function SourceViewer({ item }) {
  const [params, setParams] = useSearchParams();
  const requested = Number(params.get("file") || 0);
  const selected =
    Number.isInteger(requested) && requested >= 0 && requested < item.sources.length
      ? requested
      : 0;

  /** 선택한 파일 번호를 URL에 반영해 소스 화면을 전환합니다. */
  const selectFile = (index) => {
    const next = new URLSearchParams(params);
    next.set("file", String(index));
    setParams(next, { replace: true });
  };
  return (
    <div className="source-workbench">
      <nav className="source-file-tree" aria-label="소스 파일">
        <p>
          EXPLORER <span>{item.sources.length}</span>
        </p>
        {item.sources.map((file, index) => {
          const path = displayPath(file.path);
          return (
            <button
              key={file.path}
              className={selected === index ? "selected" : ""}
              aria-current={selected === index ? "true" : undefined}
              title={path}
              onClick={() => selectFile(index)}
            >
              <span className={`file-extension ${path.endsWith(".java") ? "java" : ""}`}>
                {{
                  java: "J",
                  sh: "SH",
                  yml: "YML",
                  json: "{}",
                  conf: "CFG",
                  service: "SVC",
                  md: "MD",
                  example: "ENV",
                }[path.split(".").pop()] || "JS"}
              </span>
              <span>
                {path.split("/").pop()}
                <small>
                  {path.includes("/backend/") || path.startsWith("backend/")
                    ? "backend"
                    : path.startsWith("deployment/") || path.startsWith("docs/")
                      ? "reference"
                      : "frontend"}
                </small>
              </span>
            </button>
          );
        })}
        <div className="source-snapshot-label">
          PROJECT SOURCE<small>빌드 시점의 실제 구현 파일</small>
        </div>
      </nav>
      <SourceFile file={item.sources[selected]} key={item.sources[selected].path} />
    </div>
  );
}
