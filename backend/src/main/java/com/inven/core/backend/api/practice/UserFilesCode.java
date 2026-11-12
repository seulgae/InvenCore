package com.inven.core.backend.api.practice;

import org.springframework.stereotype.Component;

@Component
public class UserFilesCode {
    /** TODO: null/공백, . 또는 .., 슬래시(/) 또는 역슬래시 포함 이름은 false.
     * png,jpg,jpeg,pdf,txt 확장자만 허용(대소문자 무시). 크기 1..5*1024*1024 바이트.
     * 확장자 검사 연습이며 실제 서비스에서는 MIME/내용 검사와 별도 저장 키도 필요합니다.
     * 기존 첨부 API 정책은 변경하지 않습니다. */
    public boolean allowed(String filename, long bytes) { throw new UnsupportedOperationException("TODO · allowed"); }
}
