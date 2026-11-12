import { useState } from "react";
import { Link } from "react-router-dom";
import {
  deploymentSteps,
  deploymentTools,
  deploymentFunctions,
  deploymentLinks,
} from "../../data/deploymentGuide";
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

/** AWS 배포 준비 단계와 명령어, 검토 표시를 보여줍니다. 실제 명령은 실행하지 않습니다. */
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
    <section className="deploy-guide" aria-label="AWS CI/CD 배포 참고 가이드">
      <header className="deploy-guide-heading">
        <div>
          <span>DEPLOYMENT PLAYBOOK / AWS</span>
          <h2>완성한 사이트를 서버로.</h2>
          <p>과거 배포 이력부터 다음 배포의 명령어·설정·복구까지 한곳에서 확인하세요.</p>
        </div>
        <strong>참고 템플릿 · 미배포</strong>
      </header>
      <div className="deploy-status-note">
        <span>i</span>
        <p>
          여기는 준비용 가이드입니다. AWS에 연결하거나 명령을 실행하지 않습니다. 템플릿은 자동 실행
          경로 밖에 있고, 기존 SSH 배포 job도 비활성 상태입니다.
        </p>
      </div>
      <div className="deploy-pipeline" aria-label="배포 과정">
        {["Commit", "Test & Build", "S3", "SSM", "EC2", "Health / Rollback"].map((label, index) => (
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
            IAM·버킷·SSM·HTTPS 설정, 활성화 순서, 502·404·413 진단과 수동 롤백을 자세히
            정리했습니다.
          </p>
        </div>
        <SourceLink item={item} name="AWS_CICD.md" />
      </div>
      <section className="deploy-official">
        <h3>공식 문서</h3>
        {deploymentLinks.map(([title, url]) => (
          <a key={url} href={url} target="_blank" rel="noreferrer">
            {title} ↗
          </a>
        ))}
      </section>
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
          <h2>배포 도구와 스크립트 역할</h2>
          <p>
            이 카드는 애플리케이션 Java 기능이 아닌 배포 참고 자료입니다. 추가 Maven·Gradle 의존성을
            요구하지 않습니다.
          </p>
        </div>
        <strong>검토 후 활성화</strong>
      </header>
      <div className="deploy-table-scroll">
        <table>
          <caption>AWS CI/CD에 사용하는 도구</caption>
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
