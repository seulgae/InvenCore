/** 소스 파일의 표시 경로와 지연 로딩 함수를 구성합니다. */
const source = (path, load) => ({ path, load });
export const deploymentSources = [
  source("docs/AWS_CICD.md", () => import("virtual:inventory-source/docs/AWS_CICD.md")),
  source(
    "deployment/templates/ci-cd.yml",
    () => import("virtual:inventory-source/deployment/templates/ci-cd.yml"),
  ),
  source(
    "deployment/templates/package-release.sh",
    () => import("virtual:inventory-source/deployment/templates/package-release.sh"),
  ),
  source(
    "deployment/templates/bootstrap.sh",
    () => import("virtual:inventory-source/deployment/templates/bootstrap.sh"),
  ),
  source(
    "deployment/templates/deploy.sh",
    () => import("virtual:inventory-source/deployment/templates/deploy.sh"),
  ),
  source(
    "deployment/templates/rollback.sh",
    () => import("virtual:inventory-source/deployment/templates/rollback.sh"),
  ),
  source(
    "deployment/templates/ssm-document.yml",
    () => import("virtual:inventory-source/deployment/templates/ssm-document.yml"),
  ),
  source(
    "deployment/templates/nginx.conf",
    () => import("virtual:inventory-source/deployment/templates/nginx.conf"),
  ),
  source(
    "deployment/templates/invencore.conf",
    () => import("virtual:inventory-source/deployment/templates/invencore.conf"),
  ),
  source(
    "deployment/templates/invencore.service",
    () => import("virtual:inventory-source/deployment/templates/invencore.service"),
  ),
  source(
    "deployment/templates/application.env.example",
    () => import("virtual:inventory-source/deployment/templates/application.env.example"),
  ),
  source(
    "deployment/templates/github-trust.json",
    () => import("virtual:inventory-source/deployment/templates/github-trust.json"),
  ),
  source(
    "deployment/templates/github-policy.json",
    () => import("virtual:inventory-source/deployment/templates/github-policy.json"),
  ),
  source(
    "deployment/templates/ec2-trust.json",
    () => import("virtual:inventory-source/deployment/templates/ec2-trust.json"),
  ),
  source(
    "deployment/templates/ec2-artifact-policy.json",
    () => import("virtual:inventory-source/deployment/templates/ec2-artifact-policy.json"),
  ),
];

export const deploymentSteps = [
  {
    title: "기존 배포 이력 확인",
    tag: "HISTORY",
    where: "로컬 · Bash / PowerShell",
    summary: "SSH로 프론트·백엔드를 배포했던 이력과 비활성화 지점을 먼저 확인합니다.",
    points: [
      "기존 프론트는 dist를 Nginx에 전송했고 백엔드는 JAR 교체·상태 확인·롤백을 수행했습니다.",
      "21a6be6에서 두 job이 비활성화됐습니다. 기존 서버의 현재 상태나 서비스 종류까지 확인한 것은 아닙니다.",
      "과거 키·접속 주소를 복원하지 않고, 새 템플릿은 AWS OIDC·S3·SSM 경로로 구성합니다.",
    ],
    commands:
      "git log --oneline -- .github/workflows\ngit show --stat 21a6be6\ngit show --stat feb7873",
    files: ["AWS_CICD.md"],
  },
  {
    title: "AWS 기본 자원 준비",
    tag: "AWS SETUP",
    where: "로컬 관리자 터미널 · Bash · AWS CLI 로그인 필요",
    summary: "EC2·비공개 S3·역할·네트워크를 준비하고 SSM Online 상태를 확인합니다.",
    points: [
      "참고 OS는 새 전용 Amazon Linux 2023입니다. 기존 서버에는 bootstrap을 그대로 실행하지 마세요.",
      "EC2 역할에 AmazonSSMManagedInstanceCore와 지정 버킷 releases 읽기 권한을 부여합니다.",
      "SSM·S3로 나가는 HTTPS 연결이 필요합니다. 이 방식에는 인바운드 SSH 키가 필요하지 않습니다.",
      "실제 IAM 생성·버킷 설정·도메인·보안 그룹 명령은 전체 가이드에서 순서대로 확인하세요.",
    ],
    commands:
      'export AWS_REGION=ap-northeast-2\nexport AWS_DEFAULT_REGION="$AWS_REGION"\nexport INSTANCE_ID=YOUR_EC2_INSTANCE_ID\naws sts get-caller-identity\naws ssm describe-instance-information \\\n  --filters "Key=InstanceIds,Values=$INSTANCE_ID" \\\n  --query \'InstanceInformationList[].{Id:InstanceId,Status:PingStatus,Agent:AgentVersion}\'',
    files: ["AWS_CICD.md", "ec2-trust.json", "ec2-artifact-policy.json"],
  },
  {
    title: "서버 초기 설정",
    tag: "EC2 · ONE TIME",
    where: "EC2 터미널 · 검토한 템플릿을 전달한 뒤 실행",
    summary: "Java 17·Nginx·systemd·서버 환경 파일과 배포 디렉터리를 한 번 준비합니다.",
    points: [
      "bootstrap.sh는 새 전용 AL2023 서버용입니다. 실제 버킷·리전·도메인으로 바꿉니다.",
      "JWT secret은 서버 안에서 생성하며 application.env를 저장소나 로그에 넣지 않습니다.",
      "애플리케이션은 invencore 사용자로 실행하고, 업로드는 릴리스 밖 /var/lib/invencore/uploads에 둡니다.",
      "공개 전에 HTTPS를 구성하세요. ALB+ACM을 쓰면 EC2 80은 ALB 보안 그룹에서만 접근하도록 구성합니다.",
    ],
    commands:
      "sudo bash bootstrap.sh YOUR_ARTIFACT_BUCKET ap-northeast-2 YOUR_DOMAIN\nsudo nginx -t\nsudo systemctl status nginx --no-pager\nsudoedit /etc/invencore/application.env",
    files: [
      "bootstrap.sh",
      "application.env.example",
      "invencore.service",
      "nginx.conf",
      "invencore.conf",
    ],
  },
  {
    title: "GitHub OIDC·SSM 연결",
    tag: "IDENTITY",
    where: "로컬 관리자 터미널 · Bash / GitHub Settings",
    summary: "배포 역할의 범위를 제한하고 production 환경 변수와 승인 정책을 준비합니다.",
    points: [
      "production Environment의 branch를 main으로 제한하고 가능한 경우 배포 승인자를 설정합니다.",
      "trust policy의 sub는 repo:OWNER/REPOSITORY:environment:production 형태로 workflow 환경과 맞춥니다.",
      "AWS_REGION, ARTIFACT_BUCKET, EC2_INSTANCE_ID, AWS_DEPLOY_ROLE_ARN을 GitHub Variables에 설정합니다.",
      "JSON 자리표시자를 치환한 사본은 저장소 밖에 보관합니다. SSM Agent 3.3.2746.0 이상이 필요합니다.",
    ],
    commands:
      "# 먼저 문서의 IAM 역할·정책 설정을 완료합니다.\naws ssm create-document --name InvenCoreDeploy \\\n  --document-type Command --document-format YAML \\\n  --content file://deployment/templates/ssm-document.yml",
    files: ["github-trust.json", "github-policy.json", "ssm-document.yml", "ci-cd.yml"],
  },
  {
    title: "테스트·빌드·릴리스 묶기",
    tag: "CONTINUOUS INTEGRATION",
    where: "저장소 루트 · Bash · JDK 17 / Node 22",
    summary: "프론트와 백엔드를 같은 commit의 산출물 하나로 묶습니다.",
    points: [
      "npm ci → lint → build, Gradle test → bootJar 순으로 검증합니다. 테스트를 건너뛰지 않습니다.",
      "패키지는 app.jar·frontend/·REVISION만 포함하고 SHA256을 함께 생성합니다.",
      "CI가 빌드하므로 EC2에 Node나 npm start를 실행할 필요가 없습니다.",
      "준비 완료 후에만 ci-cd.yml을 .github/workflows/로 복사하고 main에서 수동 실행합니다. 지금은 자동 배포되지 않습니다.",
    ],
    commands:
      'npm --prefix frontend ci\nnpm --prefix frontend run lint\nnpm --prefix frontend run build\nbash backend/gradlew -p backend clean test bootJar\nexport GITHUB_SHA="$(git rev-parse HEAD)"\nbash deployment/templates/package-release.sh\nsha256sum -c release.tar.gz.sha256',
    files: ["ci-cd.yml", "package-release.sh"],
  },
  {
    title: "배포·상태 확인·자동 복구",
    tag: "CONTINUOUS DELIVERY",
    where: "GitHub Actions / EC2 · 첫 배포는 수동 검증",
    summary: "S3에서 받은 릴리스를 검사한 뒤 current를 교체하고 실패하면 이전 버전으로 복구합니다.",
    points: [
      "고정한 SSM 문서만 서버의 root 소유 deploy.sh를 호출합니다. 릴리스 ID와 체크섬을 검증합니다.",
      "동시 배포 lock → 압축 검사 → 코드·자산 보관 → 링크 교체 → systemd 재시작 → API·Nginx·SPA 확인 순입니다.",
      "상태 확인이 실패하면 이전 JAR·화면으로 복구합니다. 첫 배포는 이전 버전이 없어 자동 롤백할 수 없습니다.",
      "systemd 재시작이므로 무중단 배포가 아닙니다. DB 데이터와 스키마 롤백은 별개입니다.",
    ],
    commands:
      "# EC2 터미널\nsudo readlink -f /srv/invencore/current\nsudo systemctl status invencore --no-pager\ncurl -fsS http://127.0.0.1:8080/api/health\ncurl -fsS http://127.0.0.1/api/health\ncurl -fsS http://127.0.0.1/inventory/aws-cicd",
    files: ["deploy.sh", "rollback.sh", "ssm-document.yml"],
  },
  {
    title: "운영·장애 진단·수동 롤백",
    tag: "OPERATIONS",
    where: "EC2 터미널 / 로컬 AWS CLI",
    summary: "로그·용량·백업을 확인하고 검증한 이전 릴리스로 돌아가는 절차를 익힙니다.",
    points: [
      "SSM command ID와 journalctl, Nginx 로그를 함께 봅니다. timeout이면 중복 배포 전에 원래 명령 상태를 확인합니다.",
      "기본 H2는 재시작 시 게시글·계정·파일 메타데이터가 초기화됩니다. 운영 DB와 백업은 별도 결정해야 합니다.",
      "공유 해시 자산은 기존 탭을 위해 유지합니다. 릴리스·S3 버전·업로드 용량과 보존 기간을 정하세요.",
      "실제 AWS 비용 알림과 HTTPS, 공개 CRUD 정책, Kafka·Redis 사용 여부를 사이트 공개 전에 점검합니다.",
    ],
    commands:
      "sudo journalctl -u invencore -n 100 --no-pager\nsudo tail -n 80 /var/log/nginx/error.log\nsudo ls -1 /srv/invencore/releases\n# 확인한 이전 버전 ID로 바꾼 뒤에만 실행\nsudo invencore-rollback PREVIOUS_RELEASE_ID",
    files: ["rollback.sh", "AWS_CICD.md"],
  },
];

export const deploymentTools = [
  [
    "GitHub Actions",
    "Node 22 · JDK 17 · Gradle Wrapper",
    "테스트·빌드·산출물 전달·production 배포 job",
  ],
  ["GitHub OIDC / IAM", "지정 repository · production 환경", "장기 Access Key 대신 임시 역할 사용"],
  ["Amazon S3", "비공개 releases/ · SSE-S3", "릴리스 tar와 버전 보관"],
  ["AWS Systems Manager", "Online Agent · ENV_VAR 지원 버전", "SSH 없이 검토한 배포 문서 실행"],
  ["Amazon Linux 2023", "Corretto 17 · systemd", "Spring Boot JAR 프로세스 관리"],
  ["Nginx", "정적 화면 · reverse proxy", "React deep link와 /api 경로 연결"],
  ["Bash / Python / jq", "flock · SHA256 · tar 검사", "배포 잠금·무결성·경로 검증·상태 확인"],
];
export const deploymentFunctions = [
  ["패키징", "package-release.sh", "JAR·dist·commit → tar + SHA256"],
  ["서버 준비", "bootstrap.sh", "패키지·사용자·환경·Nginx·systemd 설치"],
  ["switch_to", "deploy.sh", "검사한 릴리스로 current 링크 교체"],
  ["healthy", "deploy.sh", "현재 /api/health UP 응답을 재시도 확인"],
  ["on_error", "deploy.sh", "전환 이후 실패 시 이전 버전 복구 시도"],
  ["수동 롤백", "rollback.sh", "선택한 이전 릴리스로 전환 후 상태 확인"],
];
export const deploymentLinks = [
  [
    "GitHub OIDC → AWS",
    "https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-aws",
  ],
  [
    "SSM Run Command 준비",
    "https://docs.aws.amazon.com/systems-manager/latest/userguide/run-command-setting-up.html",
  ],
  [
    "SSM ENV_VAR·Agent 버전",
    "https://docs.aws.amazon.com/systems-manager/latest/userguide/parameter-troubleshooting.html",
  ],
  [
    "Corretto 17 설치",
    "https://docs.aws.amazon.com/corretto/latest/corretto-17-ug/amazon-linux-install.html",
  ],
  ["AL2023 AWS CLI v2", "https://docs.aws.amazon.com/linux/al2023/ug/awscli2.html"],
  ["Nginx SPA fallback", "https://nginx.org/en/docs/http/ngx_http_core_module.html#try_files"],
];
