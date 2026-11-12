# InvenCore AWS CI/CD 배포 가이드

> 현재 상태: **설계·참고 템플릿, AWS 미연결**. 이 문서를 추가하면서 AWS 자원을 만들거나 기존 서버·자동 배포를 변경하지 않았습니다. `deployment/templates/ci-cd.yml`은 `.github/workflows/` 밖에 있어 자동 실행되지 않습니다. 실서버 검증 전 운영 완료로 보지 마세요.

## 1. 찾은 기존 배포 이력

Git에서 확인한 사실입니다. AWS 계정의 현재 인스턴스 상태를 조회한 것은 아닙니다.

| 근거 | 내용 |
| --- | --- |
| `.github/workflows/deploy-backend.yml` | GitHub Actions → SSH/SCP → JAR 교체 → nohup 실행 → `/api/health` 확인 → 실패 시 백업 JAR 복구 |
| `.github/workflows/deploy-frontend.yml` | React dist 전송 → Nginx 정적 디렉터리 → SELinux 컨텍스트 복구 → Nginx reload |
| `21a6be6`, 2026-04-06 | 두 배포 job에 `if: ${{ false }}`를 추가한 비활성화 이력 |
| `feb7873`, 2026-04-06 | AWS 연동을 중지하고 기본 DB를 H2 메모리로 전환한 이력 |

이전 워크플로의 키 이름만으로 EC2인지 Lightsail인지 확정할 수 없습니다. 기존 인스턴스가 있다면 AWS 콘솔에서 서비스 종류·AMI·리전·보안 그룹·역할·디스크·도메인을 먼저 확인하세요. 예전 접속 주소·키·DB 비밀번호는 이 가이드에 복사하지 않았습니다.

이력은 다음 명령으로 다시 확인합니다. 기존 workflow를 그대로 재활성화하지 마세요. 예전 Node 18, 테스트 생략, 호스트 검증 생략, 환경 파일 출력 등의 설정을 그대로 가져오는 방식은 현재 템플릿과 다릅니다.

```bash
git log --oneline -- .github/workflows
git show --stat 21a6be6
git show --stat feb7873
```

## 2. 이번 참고 설계

```text
main 수동 실행 → GitHub Actions 테스트·빌드 → 승인한 production 배포 job
  → GitHub OIDC 임시 AWS 역할 → 비공개 S3 릴리스 업로드
  → SSM InvenCoreDeploy 문서 → EC2의 root 소유 deploy.sh
  → 체크섬·압축 검사 → 새 릴리스 폴더 → current 링크 교체
  → systemd JAR 재시작 → API·Nginx·React 경로 검사
  → 성공 유지 / 실패 시 이전 링크와 JAR 복구

사용자 → HTTPS(ALB+ACM 등 별도 구성) → Nginx
                                     ├─ /           React 정적 화면·SPA fallback
                                     ├─ /assets/    이전 버전도 유지하는 해시 자산
                                     └─ /api/       127.0.0.1:8080 Spring Boot
```

참고 서버는 **새 전용 Amazon Linux 2023 EC2**입니다. 기존 서버·Lightsail·Ubuntu에는 bootstrap을 그대로 실행하지 마세요. 기존 Nginx에 다른 사이트가 있다면 반드시 설정 차이를 검토해 수동으로 통합합니다.

- EC2 런타임: Java 17, Nginx, systemd, AWS CLI v2, SSM Agent, Python 3, jq.
- CI 빌드: Node 22, JDK 17, 저장소의 Gradle Wrapper. EC2에서는 npm start나 프론트 빌드를 실행하지 않습니다.
- GitHub 장기 AWS Access Key나 SSH 개인키를 새 배포 방식에 저장하지 않습니다. OIDC는 제한한 역할을 일시적으로 사용합니다. [GitHub OIDC 안내](https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-aws)
- SSM은 관리 노드 설정과 역할, AWS 엔드포인트로의 네트워크 연결이 필요합니다. 인바운드 SSH 22는 이 배포 경로에 필요하지 않습니다. [Run Command 준비](https://docs.aws.amazon.com/systems-manager/latest/userguide/run-command-setting-up.html)

## 3. 사전 결정과 AWS 기본 설정

명령은 별도 표시가 없으면 **로컬 관리자 터미널 Bash** 기준입니다. Windows에서는 Git Bash를 쓰고 AWS CLI v2를 설치·로그인한 뒤 실행하세요. `aws ssm start-session`을 쓰는 로컬 PC에는 Session Manager plugin도 설치해야 합니다. CI의 send-command는 이 plugin이 필요하지 않습니다. 웹 카드의 복사 버튼은 명령을 실행하지 않습니다.

1. 리전: 예시는 서울 `ap-northeast-2`이며 기존 서버 리전을 확인해 바꿉니다.
2. EC2: Amazon Linux 2023, 필요한 CPU·메모리·EBS 용량 선택. 기본 벤치마크는 30만 행씩 두 테이블을 준비하므로 실제 메모리 사용량을 확인하세요. `application.env.example`은 JVM 최대 768MiB를 예시로 사용합니다.
3. S3: 전 세계에서 유일한 버킷 이름, 전체 퍼블릭 액세스 차단, 암호화, 릴리스 보존 정책.
4. 네트워크: SSM·S3로 나가는 HTTPS 443. private subnet은 NAT 또는 필요한 VPC endpoint와 라우팅·DNS·endpoint 정책을 확인합니다.
5. 외부 공개: HTTPS 도메인과 인증서 구성. ALB+ACM 사용 시 ALB 443을 공개하고 EC2 80은 ALB 보안 그룹에서만 허용합니다. EC2 8080은 외부에 열지 않습니다. ALB·NAT 등은 별도 과금 대상이므로 개인 사이트 비용도 검토하세요.
6. DB: 현재 H2 메모리 유지 여부와 영속화 계획. RDS가 필요하면 드라이버·스키마 마이그레이션·백업까지 별도 설계합니다. 지금 프로젝트에 PostgreSQL 드라이버를 다시 넣은 것은 아닙니다.

```bash
export AWS_REGION=ap-northeast-2
export AWS_DEFAULT_REGION="$AWS_REGION"
export ARTIFACT_BUCKET=YOUR_GLOBALLY_UNIQUE_BUCKET
export ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"

# 서울 리전 예시. us-east-1은 LocationConstraint 옵션 없이 생성합니다.
aws s3api create-bucket --bucket "$ARTIFACT_BUCKET" --region "$AWS_REGION" \
  --create-bucket-configuration "LocationConstraint=$AWS_REGION"
aws s3api put-public-access-block --bucket "$ARTIFACT_BUCKET" \
  --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
aws s3api put-bucket-versioning --bucket "$ARTIFACT_BUCKET" --versioning-configuration Status=Enabled
```

AWS IAM 콘솔에서 GitHub OIDC provider를 확인하거나 생성합니다.

- Provider URL: `https://token.actions.githubusercontent.com`
- Audience: `sts.amazonaws.com`
- 기존 provider가 있으면 새로 중복 생성하지 않습니다.

EC2에는 `ec2-trust.json`으로 만든 역할을 instance profile로 연결하고, `AmazonSSMManagedInstanceCore`와 `ec2-artifact-policy.json`의 S3 읽기 권한을 붙입니다. 기존 역할이 있으면 교체보다 필요한 권한을 검토해 추가하는 방식을 먼저 검토하세요.

JSON의 `ACCOUNT_ID`, `AWS_REGION`, `ARTIFACT_BUCKET`, `INSTANCE_ID`, `OWNER/REPOSITORY`는 반드시 실제 값으로 바꾼 **저장소 밖 사본**을 사용합니다. 치환 전 파일은 유효한 배포 정책이 아닙니다.

```bash
# 아래 JSON 경로는 실제 값으로 채운 저장소 밖 사본을 가리켜야 합니다.
aws iam create-role --role-name InvenCoreEc2 --assume-role-policy-document file://ec2-trust.json
aws iam attach-role-policy --role-name InvenCoreEc2 \
  --policy-arn arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
aws iam put-role-policy --role-name InvenCoreEc2 --policy-name ReadInvenCoreReleases \
  --policy-document file://ec2-artifact-policy.json
aws iam create-instance-profile --instance-profile-name InvenCoreEc2Profile
aws iam add-role-to-instance-profile --instance-profile-name InvenCoreEc2Profile --role-name InvenCoreEc2
# 새 EC2를 생성할 때 이 profile을 선택합니다. 기존 association은 먼저 조사합니다.

export INSTANCE_ID=YOUR_EC2_INSTANCE_ID
aws ec2 create-tags --resources "$INSTANCE_ID" --tags Key=Project,Value=InvenCore
aws ssm describe-instance-information \
  --filters "Key=InstanceIds,Values=$INSTANCE_ID" --query 'InstanceInformationList[].{Id:InstanceId,Status:PingStatus,Agent:AgentVersion}'
```

SSM 목록에 Online으로 표시되어야 합니다. 문서의 ENV_VAR 매개변수는 Agent **3.3.2746.0 이상**을 요구하므로 오래된 Agent는 먼저 업데이트합니다. [SSM 매개변수 안내](https://docs.aws.amazon.com/systems-manager/latest/userguide/parameter-troubleshooting.html)

## 4. 새 EC2 서버 초기 준비

템플릿 파일을 서버에 전달하는 한 가지 방법입니다. 기존 서버에는 파일을 비교한 뒤 필요한 설정만 적용하세요.

로컬 관리자 터미널:

```bash
tar -C deployment/templates -czf bootstrap.tar.gz .
sha256sum bootstrap.tar.gz
aws s3 cp bootstrap.tar.gz "s3://$ARTIFACT_BUCKET/releases/bootstrap/bootstrap.tar.gz" --sse AES256
aws ssm start-session --target "$INSTANCE_ID"
```

Session Manager로 들어간 **EC2 터미널**에서:

```bash
export AWS_DEFAULT_REGION=ap-northeast-2
export ARTIFACT_BUCKET=YOUR_GLOBALLY_UNIQUE_BUCKET
work=$(mktemp -d /tmp/invencore-bootstrap.XXXXXX)
aws s3 cp "s3://$ARTIFACT_BUCKET/releases/bootstrap/bootstrap.tar.gz" "$work/bootstrap.tar.gz"
# 아래 값을 로컬 sha256sum에서 확인한 해시로 바꾸고, 확인이 실패하면 중단합니다.
printf '%s  %s\n' EXPECTED_SHA256 "$work/bootstrap.tar.gz" | sha256sum -c -
tar -xzf "$work/bootstrap.tar.gz" -C "$work"
sudo bash "$work/bootstrap.sh" "$ARTIFACT_BUCKET" "$AWS_DEFAULT_REGION" YOUR_DOMAIN
```

bootstrap은 다음을 준비합니다.

- `dnf`: Corretto 17 headless, Nginx, `awscli-2`, jq, Python, SELinux 도구 등 설치. [Corretto 설치](https://docs.aws.amazon.com/corretto/latest/corretto-17-ug/amazon-linux-install.html), [AL2023 AWS CLI](https://docs.aws.amazon.com/linux/al2023/ug/awscli2.html)
- 애플리케이션 사용자 `invencore`, 코드용 `/srv/invencore/releases`, 업로드용 `/var/lib/invencore/uploads`.
- 서버 안에서 생성한 임의 JWT secret과 root만 읽는 `/etc/invencore/application.env`. 기존 파일이 있으면 덮어쓰지 않습니다.
- `/etc/invencore/deploy.env`: 비공개 S3 버킷과 리전. 애플리케이션 환경과 별도로 관리합니다.
- root 소유 deploy/rollback 스크립트, systemd unit, Nginx 설정.
- SELinux 사용 환경은 영구 fcontext 설정과 reverse proxy 연결 권한 설정.

환경 파일을 저장소나 로그에 복사하지 마세요. 필요한 값은 EC2에서 `sudoedit /etc/invencore/application.env`로 수정합니다. `CORS_ORIGINS`에는 실제 HTTPS origin을 넣습니다.

## 5. Nginx·systemd와 저장 위치

```text
/srv/invencore/
  releases/<commit-sha>-<run-id>-<attempt>/
    app.jar
    frontend/index.html
    frontend/assets/...
    REVISION
  current -> releases/<현재 버전>
  shared/assets/              이전 탭의 해시 JS·CSS·BGM도 유지
/var/lib/invencore/uploads/    릴리스 교체와 분리된 업로드
/etc/invencore/application.env  서버 전용 비밀값
/etc/invencore/deploy.env       버킷·리전
```

Nginx는 `/api/`를 그대로 Spring에 전달합니다. `proxy_pass` 뒤에 `/`를 붙여 `/api` 경로를 잘라내는 설정으로 바꾸지 마세요. React deep link는 `try_files`로 index.html에 연결합니다. 해시 자산은 공유 위치에 보관하여 배포 직전 열린 탭의 지연 로딩 오류를 줄입니다. [Nginx try_files](https://nginx.org/en/docs/http/ngx_http_core_module.html#try_files)

```bash
# EC2에서 확인
sudo nginx -t
sudo systemctl status nginx invencore --no-pager
sudo journalctl -u invencore -n 100 --no-pager
sudo readlink -f /srv/invencore/current
curl -fsS http://127.0.0.1:8080/api/health
curl -fsS http://127.0.0.1/api/health
curl -fsS http://127.0.0.1/inventory/aws-cicd
```

업로드 바이트는 릴리스 밖에 남지만 **현재 H2 계정·게시글·파일 메타데이터는 재시작 시 사라집니다**. 파일만 남는다고 첨부 기능의 영속화가 완료되는 것은 아닙니다. H2 파일 모드도 로컬 Kafka 모형의 읽기 위치 영속화를 해결하지 않으므로 여기서 운영 DB 대체로 자동 적용하지 않습니다.

## 6. GitHub OIDC 역할과 환경 변수

실제 값으로 채운 사본을 사용합니다.

```bash
aws iam create-role --role-name InvenCoreGithubDeploy --assume-role-policy-document file://github-trust.json
aws iam put-role-policy --role-name InvenCoreGithubDeploy --policy-name DeployInvenCore \
  --policy-document file://github-policy.json
aws ssm create-document --name InvenCoreDeploy --document-type Command --document-format YAML \
  --content file://deployment/templates/ssm-document.yml
```

SSM 문서를 수정하면 새 버전을 만든 뒤 **검토한 버전을 default로 지정**합니다. 기본 문서가 바뀌면 다음 배포에 영향을 줍니다.

GitHub repository의 `production` Environment를 만들고 **main branch만 허용**, 가능한 경우 required reviewer를 설정합니다. 기본 OIDC trust의 sub는 workflow의 `environment: production`과 같은 `repo:OWNER/REPOSITORY:environment:production` 형태로 맞춥니다. 조직에서 subject customization 등을 사용한다면 실제 sub 형식에 맞춰 조정하세요. Environment를 쓰면서 branch용 sub를 섞지 마세요.

| Repository/Environment Variable | 의미 |
| --- | --- |
| `AWS_REGION` | 실제 EC2·S3·SSM 리전 |
| `ARTIFACT_BUCKET` | 비공개 릴리스 버킷 이름 |
| `EC2_INSTANCE_ID` | 배포 대상 ID |
| `AWS_DEPLOY_ROLE_ARN` | InvenCoreGithubDeploy 역할 ARN |

배포 role은 지정 버킷의 releases 경로 업로드, 지정 SSM 문서, 지정 EC2와 Project 태그에 한정합니다. EC2 role은 SSM 통신과 같은 릴리스 경로 읽기에 한정합니다. 조직의 SCP·permission boundary·S3/VPC endpoint 정책·KMS 암호화 설정이 있으면 추가 검토가 필요합니다. 예시는 SSE-S3 기준이며 고객 관리 KMS 키 권한을 포함하지 않습니다.

## 7. CI 테스트·빌드·배포 활성화

로컬에서 배포 준비만 검증할 수 있습니다. 이 명령들은 AWS 배포를 시작하지 않습니다.

```bash
# 저장소 루트
npm --prefix frontend ci
npm --prefix frontend run lint
npm --prefix frontend run build
bash backend/gradlew -p backend clean test bootJar
export GITHUB_SHA="$(git rev-parse HEAD)"
bash deployment/templates/package-release.sh
tar -tzf release.tar.gz
sha256sum -c release.tar.gz.sha256
```

Windows PowerShell에서 백엔드 빌드는 `.\backend\gradlew.bat -p backend clean test bootJar`로 실행합니다. 패키징 스크립트는 Bash용입니다. Java TODO 과제는 일반 테스트에서 제외되고 기존 완성 기능 회귀 검사가 실행됩니다.

나중에 준비가 끝났을 때만 `ci-cd.yml`을 `.github/workflows/invencore-aws.yml`로 복사합니다. 초기에는 `workflow_dispatch`로 main에서 수동 실행합니다. 성공 검증 후 필요하면 main push trigger를 추가합니다. 기존 비활성 SSH workflow를 동시에 켜지 마세요.

CI build job은 테스트·프론트 빌드·bootJar·패키징을 완료합니다. 그 다음 production deploy job이 OIDC 역할을 얻어 S3에 업로드하고 SSM 명령을 보냅니다. 권한 승인 설정이 있다면 빌드가 완료된 뒤 배포를 승인합니다. [AWS credential action](https://github.com/aws-actions/configure-aws-credentials)

템플릿의 action 버전은 참고용입니다. 활성화 시 릴리스/호환성을 다시 확인하고 조직 정책에 따라 검증한 commit SHA로 고정하세요. 이 가이드에서는 실제 GitHub production 배포를 실행하지 않았습니다.

## 8. 서버 배포 스크립트의 순서

1. release ID·SHA256 형식 검사, `flock`으로 동시 배포 차단.
2. EC2 역할로 S3 산출물 다운로드, SHA256 확인.
3. tar의 상위 경로 이탈·링크·특수 파일·예상 외 항목을 거부.
4. 새 releases 폴더에 풀고 JAR·index.html·REVISION을 확인.
5. 해시 자산을 공유 위치에 보관하고 Nginx 설정 검사.
6. current symlink를 교체하고 systemd로 JAR 재시작.
7. 내부 API, Nginx API proxy, React deep link 확인.
8. 실패 시 이전 current/JAR로 복구. 첫 배포 실패는 이전 버전이 없어 서비스를 멈추고 실패를 반환.

systemd 재시작 방식이므로 **무중단 배포가 아닙니다**. 코드·정적 화면 롤백이며 DB 스키마·데이터·업로드 파일의 시점 복구는 하지 않습니다. `/api/health`는 현재 단순 UP 응답이므로 Kafka·Redis·DB 업무 기능 전체의 readiness를 보장하지 않습니다. [현재 HealthController](../backend/src/main/java/com/inven/core/backend/controller/HealthController.java)

SSM의 기본 command-executed waiter는 약 100초 후 실패할 수 있어 템플릿은 별도 10분 poll을 사용합니다. 시간 초과가 나면 새 배포를 보내기 전에 원래 명령 상태와 서버 lock을 확인하세요. [AWS CLI waiter](https://docs.aws.amazon.com/cli/latest/reference/ssm/wait/command-executed.html)

## 9. 장애 진단과 수동 롤백

```bash
# 로컬 관리자 터미널
aws ssm get-command-invocation --command-id YOUR_COMMAND_ID --instance-id "$INSTANCE_ID" \
  --query '{Status:Status,Output:StandardOutputContent,Error:StandardErrorContent}'
aws ssm start-session --target "$INSTANCE_ID"
```

```bash
# EC2 터미널
sudo journalctl -u invencore -n 100 --no-pager
sudo nginx -t
sudo tail -n 80 /var/log/nginx/error.log
sudo ls -1 /srv/invencore/releases
sudo readlink -f /srv/invencore/current
# 실제 목록에서 상태를 확인한 이전 릴리스 ID를 넣습니다.
sudo invencore-rollback PREVIOUS_RELEASE_ID
```

| 증상 | 먼저 확인할 곳 |
| --- | --- |
| SSM Offline | instance profile, Agent, outbound 443, DNS·라우팅·VPC endpoints |
| OIDC AccessDenied | provider·aud·sub·production 환경·main 허용·IAM/SCP |
| S3 AccessDenied | CI 업로드 role과 EC2 다운로드 role을 구분, bucket prefix·KMS |
| Nginx 502 | systemd 상태, JAR 로그, 127.0.0.1:8080 헬스 |
| React 직접 URL 새로고침 404 | SPA try_files 설정 |
| 파일 업로드 413 | Nginx client_max_body_size와 Spring multipart 제한 |
| 배포 후 이전 탭 JS 404 | shared/assets 보존·캐시·경로 |
| 재시작 후 게시글 없음 | 현재 기본 H2 메모리 특성; 배포 스크립트의 파일 삭제 때문이 아님 |

과거 릴리스와 공유 자산은 자동 삭제하지 않습니다. 실제 사용량을 관찰하고 유지할 버전·복구 기간·캐시 만료 기간을 정한 뒤 별도 정리합니다. S3 versioning은 이전 버전도 저장하므로 lifecycle 비용·보존 정책을 검토합니다. DB와 uploads는 별도로 백업하고 복구를 연습하세요.

## 10. 나중에 공개하기 전 확인

- 실제 AWS 서비스 종류·OS·리전·현재 배포와 충돌 여부 확인.
- production 환경과 OIDC 권한 범위, SSM Agent·문서 버전 확인.
- HTTPS·도메인·인증서·보안 그룹 구성, 브라우저에서 CORS와 직접 URL 확인.
- 기본 H2 데모 초기화 수용 여부 또는 운영 DB 마이그레이션·백업 결정.
- 업로드·개인정보·공개 CRUD 정책을 공개 범위에 맞게 검토.
- 실제 배포 성공·실패·롤백·재부팅 후 서비스 복구 검증.
- 외부 Kafka·Redis를 사용할 경우에만 네트워크·인증·영속화·readiness 별도 구성.
- AWS 비용 알림, 로그 보관, EBS·S3·업로드 용량 모니터링 설정.

이 템플릿은 SSH 구축 경험을 보존하면서 다음 배포를 준비하기 위한 참고 자료입니다. AWS에서 검증되지 않은 설정을 이미 운영 중인 구성처럼 표시하지 않습니다.
