import { useState } from "react";
import { Link } from "react-router-dom";
import {
  deploymentSteps,
  deploymentTools,
  deploymentFunctions,
  deploymentLinks,
} from "../../data/serverDeploymentGuide";
import "../../styles/DeploymentGuide.css";

/** 해당 설정 파일을 찾고 인벤토리의 소스 보기 링크를 만듭니다. */
function SourceLink({ item, name }) {
  const index = item.sources.findIndex((source) => source.path.endsWith(`/${name}`));
  if (index < 0) return <code>{name}</code>;
  return (
    <Link className="deploy-source-link" to={`/inventory/${item.id}?tab=source&file=${index}`}>
      <span>⌘</span>
      {name}
      <span>↗</span>
    </Link>
  );
}

/** Ubuntu 서버 배포 준비 단계와 명령어, 검토 표시를 보여줍니다. 실제 명령은 실행하지 않습니다. */
export default function DeploymentGuide({ item }) {
  const [step, setStep] = useState(0);
  const [checked, setChecked] = useState([]);
  const [copyState, setCopyState] = useState("");
  const entry = deploymentSteps[step];

  /** 선택 상태를 바꾸고 현재 단계에 연결된 화면을 갱신합니다. */
  const choose = (index) => {
    setStep(index);
    setCopyState("");
  };

  /** 화면에 표시한 원문을 클립보드에 복사하고 결과를 안내합니다. */
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(entry.commands);
      setCopyState("복사했습니다. 자리표시자와 실행 위치를 먼저 확인하세요.");
    } catch {
      setCopyState("명령어를 직접 선택해 복사해 주세요.");
    }
  };
  return (
    <section className="deploy-guide" aria-label="Ubuntu 서버 CI/CD 배포 참고 가이드">
      <header className="deploy-guide-heading">
        <div>
          <span>DEPLOYMENT PLAYBOOK / UBUNTU</span>
          <h2>서버 설정부터 배포와 운영까지.</h2>
          <p>SSH·인프라·환경 설정·CI·수동 배포·HTTPS·복구를 순서대로 확인하세요.</p>
        </div>
        <strong>CI 자동 · 서버 배포 수동</strong>
      </header>
      <div className="deploy-status-note"><span>i</span><p>현재 저장소와 서버 구축 기록을 기준으로 정리했습니다. GitHub Actions는 검증된 이미지를 GHCR에 게시하며, Ubuntu 서버 반영은 수동입니다. 최신 이미지의 실제 서버 동작은 배포 후 확인하세요.</p></div>
      <div className="deploy-pipeline" aria-label="배포 과정">
        {["Commit", "Test & Build", "GHCR", "Compose", "Ubuntu", "Health / Rollback"].map((label, index) => (
          <span key={label}>
            <b>{String(index + 1).padStart(2, "0")}</b>
            {label}
            {index < 5 && <i aria-hidden="true">→</i>}
          </span>
        ))}
      </div>
      <div className="deploy-guide-layout">
        <nav className="deploy-steps" aria-label="배포 준비 단계">
          {deploymentSteps.map((entry, index) => (
            <button
              key={entry.tag}
              className={index === step ? "selected" : ""}
              aria-current={index === step ? "step" : undefined}
              onClick={() => choose(index)}
            >
              <span>{checked.includes(index) ? "✓" : String(index + 1).padStart(2, "0")}</span>
              <strong>{entry.title}</strong>
              <small>{entry.tag}</small>
            </button>
          ))}
          <p>
            검토 표시 {checked.length} / {deploymentSteps.length}
            <br />
            현재 화면에서만 표시됩니다.
          </p>
        </nav>
        <article className="deploy-step-detail">
          <span className="deploy-step-tag">{entry.tag}</span>
          <h3>{entry.title}</h3>
          <p className="deploy-step-summary">{entry.summary}</p>
          <ul>
            {entry.points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
          <div className="deploy-command">
            <header>
              <span>{entry.where}</span>
              <button onClick={copy}>명령어 복사</button>
            </header>
            <pre tabIndex={0}>
              <code>{entry.commands}</code>
            </pre>
          </div>
          <p className="deploy-copy-state" role="status">
            {copyState}
          </p>
          <div className="deploy-step-files">
            <h4>함께 볼 설정·소스</h4>
            {entry.files.map((name) => (
              <SourceLink key={name} item={item} name={name} />
            ))}
          </div>
          <footer>
            <label>
              <input
                type="checkbox"
                checked={checked.includes(step)}
                onChange={(event) =>
                  setChecked((previous) =>
                    event.target.checked
                      ? [...new Set([...previous, step])]
                      : previous.filter((value) => value !== step),
                  )
                }
              />{" "}
              이 단계의 내용을 검토했어요
            </label>
            <div>
              <button disabled={step === 0} onClick={() => choose(step - 1)}>
                ← 이전
              </button>
              <button
                disabled={step === deploymentSteps.length - 1}
                onClick={() => choose(step + 1)}
              >
                다음 단계 →
              </button>
            </div>
          </footer>
        </article>
      </div>
      <div className="deploy-complete-guide">
        <div>
          <h3>전체 절차와 장애 대응</h3>
          <p>
            SSH·Docker·DB·Kafka·Redis 설정부터 CI, 수동 배포, HTTPS와 장애 대응을 정리했습니다.
          </p>
        </div>
        <SourceLink item={item} name="SERVER_CICD.md" />
      </div>
      {deploymentLinks.length > 0 && <section className="deploy-official">
        <h3>공식 문서</h3>
        {deploymentLinks.map(([title, url]) => (
          <a key={url} href={url} target="_blank" rel="noreferrer">
            {title} ↗
          </a>
        ))}
      </section>}
    </section>
  );
}

/** 배포 도구·설정·스크립트의 역할과 소스 링크를 표시합니다. */
export function DeploymentReference({ item }) {
  return (
    <section className="deploy-guide deploy-reference">
      <header className="deploy-guide-heading">
        <div>
          <span>TOOLS & CONFIGURATION</span>
          <h2>현재 서버의 도구와 설정 파일</h2><p>CI workflow와 Compose 파일의 역할을 확인하고 실제 소스를 함께 읽어보세요.</p>
        </div>
        <strong>현재 서버 구성</strong>
      </header>
      <div className="deploy-table-scroll">
        <table>
          <caption>Ubuntu 서버 CI/CD에 사용하는 도구</caption>
          <thead>
            <tr>
              <th>도구</th>
              <th>설정 기준</th>
              <th>역할</th>
            </tr>
          </thead>
          <tbody>
            {deploymentTools.map(([tool, setting, role]) => (
              <tr key={tool}>
                <th>{tool}</th>
                <td>{setting}</td>
                <td>{role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="deploy-table-scroll">
        <table>
          <caption>배포 함수·작업별 로직</caption>
          <thead>
            <tr>
              <th>함수·작업</th>
              <th>소스</th>
              <th>처리</th>
            </tr>
          </thead>
          <tbody>
            {deploymentFunctions.map(([name, file, logic]) => (
              <tr key={name}>
                <th>{name}</th>
                <td>
                  <SourceLink item={item} name={file} />
                </td>
                <td>{logic}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <section className="deploy-all-files">
        <h3>설정 템플릿 전체</h3>
        {item.sources.map((file) => (
          <SourceLink key={file.path} item={item} name={file.path.split("/").pop()} />
        ))}
      </section>
    </section>
  );
}
