package com.inven.core.backend.api.practice;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class UserAuthCode {
    /** TODO: encoder.encode(raw)로 암호화. 비밀번호를 직접 해싱하지 마세요. */
    public String encode(String raw, PasswordEncoder encoder) {
        throw new UnsupportedOperationException("TODO · encode");
    }
    /** TODO: encoder.matches로 검증. null/빈 저장 해시 또는 null raw면 false.
     * 새 encode 결과를 문자열로 비교하면 salt 때문에 실패합니다. */
    public boolean matches(String raw, String encoded, PasswordEncoder encoder) {
        throw new UnsupportedOperationException("TODO · matches");
    }
}
