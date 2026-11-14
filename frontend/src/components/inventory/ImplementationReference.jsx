import { useEffect, useState } from "react";
import { displayPath } from "../../data/inventory";
import { extractMethods } from "../../data/methodReference";
import frontendPackage from "../../../package.json";
import { DeploymentReference } from "./DeploymentGuide";

const families = {
  "spring-boot-starter-webmvc": "REST 컨트롤러·HTTP 요청 처리",
  "spring-boot-starter-data-jpa": "Repository·엔티티 저장·트랜잭션",
  "mybatis-spring-boot-starter": "Mapper 자동 등록·XML SQL 실행·SqlSession 관리",
  "spring-boot-starter-kafka": "Kafka 이벤트 발행·수신·재시도·DLT",
  "spring-boot-starter-data-redis": "Redis JSON 스냅샷·TTL·버전 비교 Lua",
  "spring-boot-starter-security": "요청 인증과 접근 제어·BCrypt",
  "spring-boot-starter-validation": "DTO 입력값 검증",
  lombok: "Getter·생성자·Builder 등 코드 생성",
  postgresql: "PostgreSQL JDBC 드라이버",
  "spring-boot-devtools": "개발 중 재시작 지원",
  "jjwt-api": "JWT 생성·검증 API",
  "jjwt-impl": "JWT 런타임 구현",
  "jjwt-jackson": "JWT JSON 직렬화",
  "sshd-core": "SSH 클라이언트·세션·채널",
  "sshd-common": "SSH 공통 타입·키 로딩",
  "spring-boot-starter-validation-test": "검증 관련 테스트 지원",
  "spring-boot-starter-webmvc-test": "웹 계층 테스트 지원",
  "spring-security-test": "보안 테스트 지원",
  "junit-platform-launcher": "JUnit 테스트 실행",
};
const related = {
  "kafka-lab": [
    "spring-boot-starter-webmvc",
    "spring-boot-starter-validation",
    "spring-boot-starter-data-jpa",
    "spring-boot-starter-kafka",
    "postgresql",
    "lombok",
  ],
  "gw-sync": [
    "spring-boot-starter-webmvc",
    "spring-boot-starter-validation",
    "spring-boot-starter-data-jpa",
    "spring-boot-starter-kafka",
    "spring-boot-starter-data-redis",
    "postgresql",
    "lombok",
  ],
  "parallel-stream": ["spring-boot-starter-webmvc", "mybatis-spring-boot-starter", "lombok", "postgresql"],
  "index-tuning": ["spring-boot-starter-webmvc", "mybatis-spring-boot-starter", "lombok", "postgresql"],
  capacity: [
    "sshd-core",
    "sshd-common",
    "spring-boot-starter-data-jpa",
    "spring-boot-starter-webmvc",
    "lombok",
  ],
  auth: [
    "spring-boot-starter-security",
    "jjwt-api",
    "jjwt-impl",
    "jjwt-jackson",
    "spring-boot-starter-data-jpa",
    "spring-boot-starter-validation",
    "lombok",
  ],
  board: [
    "spring-boot-starter-webmvc",
    "spring-boot-starter-data-jpa",
    "spring-boot-starter-validation",
    "lombok",
  ],
  files: [
    "spring-boot-starter-webmvc",
    "spring-boot-starter-data-jpa",
    "spring-boot-starter-validation",
    "lombok",
  ],
  comments: [
    "spring-boot-starter-webmvc",
    "spring-boot-starter-data-jpa",
    "spring-boot-starter-validation",
    "lombok",
  ],
};

/** 카드 종류에 따라 애플리케이션 구현 자료 또는 배포 참고 자료를 표시합니다. */
export default function ImplementationReference({ item }) {
  return item.kind === "guide" ? (
    <DeploymentReference item={item} />
  ) : (
    <ApplicationImplementationReference item={item} />
  );
}

/** 실제 소스와 Gradle 설정을 읽어 클래스·메서드·관련 의존성을 정리합니다. */
function ApplicationImplementationReference({ item }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    Promise.all([
      import("virtual:inventory-source/backend/build.gradle"),
      ...item.sources.map((file) => file.load()),
    ])
      .then(([gradle, ...files]) => {
        if (active)
          setData({
            gradle: gradle.default,
            files: files.map((module, index) => ({
              path: displayPath(item.sources[index].path),
              text: module.default,
            })),
          });
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [item]);
  if (error)
    return (
      <p role="alert" className="inspector-state">
        구현 자료를 불러오지 못했습니다. 탭을 다시 열어 주세요.
      </p>
    );
  if (!data) return <p className="inspector-state">빌드 파일과 클래스 분석 중...</p>;
  const dependencies = [
    ...data.gradle.matchAll(
      /^\s*(implementation|runtimeOnly|compileOnly|annotationProcessor|developmentOnly|testImplementation|testRuntimeOnly)\s+'([^']+)'/gm,
    ),
  ]
    .filter((match) => related[item.id].includes(match[2].split(":")[1]))
    .map((match) => {
      const [group, name, version] = match[2].split(":");
      return {
        scope: match[1],
        group,
        name,
        version: version || "의존성 관리 적용",
      };
    });
  const frontendDependencies = Object.fromEntries(
    Object.entries(frontendPackage.dependencies).filter(([name]) =>
      data.files.some((file) => file.path.startsWith("frontend/") && file.text.includes(name)),
    ),
  );
  const dependencySnippet = data.gradle
    .split("\n")
    .filter((line) =>
      dependencies.some(
        (dep) =>
          line.trim() ===
          dep.scope +
            " '" +
            dep.group +
            ":" +
            dep.name +
            (dep.version === "의존성 관리 적용" ? "" : ":" + dep.version) +
            "'",
      ),
    )
    .join("\n");
  return (
    <div className="implementation-reference">
      <nav className="reference-index" aria-label="구현 자료 목차">
        <a href="#reference-libraries">라이브러리·빌드</a>
        <a href="#reference-classes">사용 클래스</a>
        <a href="#reference-methods">메서드별 로직</a>
      </nav>
      <section id="reference-libraries">
        <h2>라이브러리 · 빌드 설정</h2>
        <p>
          이 프로젝트는 Maven의 pom.xml 대신 <strong>backend/build.gradle</strong>을 사용합니다.
          아래에는 이 기능에 관련된 의존성만 표시합니다.
        </p>
        <p className="reference-caption">
          Spring Boot {data.gradle.match(/id 'org.springframework.boot' version '([^']+)'/)?.[1]} ·
          Java {data.gradle.match(/JavaLanguageVersion.of\((\d+)\)/)?.[1]} · 버전을 생략한 항목은
          의존성 관리에서 결정됩니다. 아래 표는 최종 해석된 의존성 트리가 아닌 직접 선언 목록입니다.
        </p>
        <div className="reference-table-scroll">
          <table className="reference-table">
            <caption>{item.title}에 사용하는 백엔드 의존성</caption>
            <thead>
              <tr>
                <th>라이브러리</th>
                <th>선언 버전</th>
                <th>범위</th>
                <th>역할</th>
              </tr>
            </thead>
            <tbody>
              {dependencies.map((dep, index) => (
                <tr key={index}>
                  <td>
                    <strong>{dep.name}</strong>
                    <small>{dep.group}</small>
                  </td>
                  <td>{dep.version}</td>
                  <td>
                    <code>{dep.scope}</code>
                  </td>
                  <td>{families[dep.name] || "빌드 선언 참고"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <details className="reference-detail">
          <summary>build.gradle · 해당 기능의 의존성 선언</summary>
          <pre tabIndex={0}>
            <code>{dependencySnippet}</code>
          </pre>
        </details>
        <details className="reference-detail">
          <summary>프론트엔드 라이브러리 · 연결된 소스 기준</summary>
          <ul>
            {Object.entries(frontendDependencies).map(([name, version]) => (
              <li key={name}>
                <code>
                  {name} {version}
                </code>{" "}
                —{" "}
                {
                  {
                    react: "컴포넌트·상태·훅",
                    "react-dom": "브라우저 렌더링",
                    "react-router-dom": "화면 라우팅",
                    axios: item.id === "auth" ? "HTTP 요청·인증 인터셉터" : "HTTP API 요청",
                  }[name]
                }
              </li>
            ))}
          </ul>
          <pre tabIndex={0}>
            <code>{JSON.stringify({ dependencies: frontendDependencies }, null, 2)}</code>
          </pre>
        </details>
      </section>
      <section id="reference-classes">
        <h2>사용 클래스 · 모듈</h2>
        <p>카드에 연결된 실제 소스의 클래스 선언과 import를 기준으로 표시합니다.</p>
        <div className="reference-class-grid">
          {data.files.map((file) => {
            const java = file.path.endsWith(".java");
            const name =
              file.text.match(/\b(?:class|interface)\s+(\w+)/)?.[1] || file.path.split("/").pop();
            const imports = java
              ? [...file.text.matchAll(/^import\s+([^;]+);/gm)].map((m) => m[1])
              : [...file.text.matchAll(/^import\s+(.+?)\s+from\s+['"]([^'"]+)['"]/gm)].map(
                  (m) => `${m[1]} ← ${m[2]}`,
                );
            const layer = file.path.includes("/mappers/")
              ? "MyBatis XML · SQL 정의"
              : file.path.includes("/mapper/")
                ? "MyBatis Mapper · DB 조회"
                : file.path.includes("/controller/")
                  ? "요청 수신·DTO 검증"
                  : file.path.includes("/service/")
                    ? "비즈니스 로직"
                    : file.path.includes("/repository/")
                      ? "DB 조회"
                      : file.path.includes("/entity/")
                        ? "영속 데이터 모델"
                        : file.path.includes("/security/")
                          ? "요청 인증 필터"
                          : file.path.includes("/util/")
                            ? "토큰 처리"
                            : java
                              ? "백엔드 클래스"
                              : "프론트엔드 모듈";
            return (
              <article key={file.path}>
                <span className="reference-caption">{layer}</span>
                <h3>{name}</h3>
                <code className="reference-filepath">{file.path}</code>
                <details>
                  <summary>사용 타입 · import {imports.length}개</summary>
                  <ul className="reference-imports">
                    {imports.map((value) => (
                      <li key={value}>
                        <code>{value}</code>
                      </li>
                    ))}
                  </ul>
                </details>
              </article>
            );
          })}
        </div>
      </section>
      <section id="reference-methods">
        <h2>메서드별 기능 · 처리 로직</h2>
        <p>
          클래스·파일별로 분류했습니다. 메서드를 펼치면 입력 파라미터, 처리 순서와 해당 메서드의
          실제 코드를 확인할 수 있습니다.
        </p>
        {data.files.map((file) => {
          const methods = extractMethods(file.text, file.path.endsWith(".java")).filter(
            (method) => !/^[A-Z]/.test(method.name),
          );
          return (
            <div className="reference-method-group" key={file.path}>
              <h3>
                {file.path.split("/").pop()} <small>{methods.length} methods</small>
              </h3>
              {methods.length ? (
                methods.map((method, index) => (
                  <details className="reference-detail" key={`${method.name}-${index}`}>
                    <summary>
                      <code>{method.name}()</code>
                      <span>{method.note[0]}</span>
                      <small>L{method.line}</small>
                    </summary>
                    <div className="method-explanation">
                      <dl>
                        <dt>입력 파라미터</dt>
                        <dd>
                          <code>{method.params}</code>
                        </dd>
                        <dt>담당 기능 · 처리 흐름</dt>
                        <dd>{method.note[1]}</dd>
                        <dt>소스 위치</dt>
                        <dd>
                          {file.path}:{method.line}
                        </dd>
                      </dl>
                      <pre tabIndex={0} aria-label={`${method.name} 메서드 코드`}>
                        <code>{method.code}</code>
                      </pre>
                    </div>
                  </details>
                ))
              ) : (
                <p className="reference-caption">
                  명시적인 메서드 본문이 없는 선언 파일입니다. Repository 선언·Lombok 생성 메서드는
                  소스 탭에서 확인할 수 있습니다.
                </p>
              )}
            </div>
          );
        })}
      </section>
    </div>
  );
}
