package com.inven.core.backend.api.practice;

import org.springframework.stereotype.Component;

@Component
public class UserGwCode {
    /** TODO: incomingRevision > storedRevision일 때만 true. 두 버전은 0 이상.
     * 삭제된 대상에도 같은 규칙을 적용해 오래된 이벤트로 부활하지 않게 합니다.
     * storedRevision=0은 대상이 아직 없는 상태입니다. */
    public boolean shouldApply(long storedRevision, long incomingRevision) {
        throw new UnsupportedOperationException("TODO · shouldApply");
    }
}
