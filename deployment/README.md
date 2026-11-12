# AWS 배포 참고 템플릿

이 디렉터리의 파일은 자동 실행되지 않습니다. 현재 AWS 연결·권한·배포를 완료했다는 의미가 아닙니다.

전체 절차: [AWS CI/CD 가이드](../docs/AWS_CICD.md). 사이트에서는 **AWS CI/CD 배포 가이드** 카드에서 단계별 명령어·구조도·소스를 볼 수 있습니다.

- `ci-cd.yml`: 나중에 검토 후 `.github/workflows/`로 복사할 GitHub Actions 템플릿
- `package-release.sh`: React dist + Spring Boot JAR를 같은 릴리스로 묶음
- `ssm-document.yml`: 검토한 서버 배포 스크립트만 호출하는 SSM Command 문서
- `bootstrap.sh`: 새 전용 Amazon Linux 2023 인스턴스 초기 설정. 기존 서버에는 그대로 실행하지 않음
- `deploy.sh`, `rollback.sh`: 릴리스 전환·상태 확인·이전 릴리스 복구
- `nginx.conf`, `invencore.conf`: 정적 화면·SPA fallback·API reverse proxy
- `invencore.service`, `application.env.example`: systemd 서비스와 비밀값 없는 환경 예시
- `github-trust.json`, `github-policy.json`: GitHub OIDC 배포 역할
- `ec2-trust.json`, `ec2-artifact-policy.json`: EC2 역할과 산출물 읽기 정책

실제 환경 파일·개인키·접속 주소·AWS 자격증명은 이 디렉터리에 저장하지 않습니다. 예시 JSON의 자리표시자를 실제 값으로 치환한 사본은 저장소 밖에서 관리하세요.
