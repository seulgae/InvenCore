# Kafka Java TODO · 게임에 학습 코드 적용

`UserKafkaCode`와 `OrderLabPractice`로 파티션 선택·커밋 위치·멱등성을 직접 구현합니다. 이 과제는 검사 후 LEARNER 모드로 실제 게임의 처리 경로에 적용됩니다.

[전체 예제·실행 준비·캡처 안내](../../../../../../../../../../../docs/EXAMPLES.md) · [Java 실습 안내](../../../../../../../../../../../docs/INVENTORY_PRACTICE.md)

> 기준: 2026-11-13. 이미지는 별도 로컬 서버에서 샘플 데이터로 캡처했습니다. 기본 H2 메모리 데이터는 서버 종료 시 사라집니다.

| 메서드 | 계약 | 적용 위치 |
| --- | --- | --- |
| `selectPartition` | KEYED는 동일 주문의 파티션 고정, SPREAD는 sequence 기준 순환 분배 | 새 주문의 목적 파티션 |
| `nextOffset` | 처리한 offset + 1 | local 체크포인트 / external commitSync |
| `shouldApply` | incoming sequence > stored sequence | 그룹별 주문 projection 반영 |

**직접 Java로 구현하기**를 펼쳐 코드를 확인하고 IDE에서 수정합니다. 백엔드 재실행 → 기본 계약 검사 통과 → **내 Java 코드로 플레이** → 세 미션 순으로 진행합니다. 기본 검사는 모든 입력에 대한 정답 증명이 아니며 게임에서도 결과를 관찰해야 합니다.

```powershell

# 저장소 루트에서 실행
.\backend\gradlew.bat -p backend test --tests "*OrderLabPracticeContractTests" -PorderLabPractice
```

[완성 예제 구조·게임 실행 이미지](../README.md) · [용어 사전](../../../../../../../../../../../docs/KAFKA_GLOSSARY.md)
