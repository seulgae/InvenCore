package com.inven.core.backend.api.practice;

import org.springframework.stereotype.Component;

@Component
public class UserCapacityCode {

    /**
     * TODO: df -h 데이터 한 줄을 공백/탭으로 나누어 파싱. 헤더는 입력하지 않습니다. /dev/sda 100G
     * 25G 75G 25% / → Disk("100G", "25G", 25). null/공백/6컬럼 미만/잘못된 퍼센트는
     * IllegalArgumentException. percent는 정수 0..100. 실제 SSH 연결 없이 파싱만
     * 연습합니다.
     */
    public Disk parseDisk(String line) {
        throw new UnsupportedOperationException("TODO · parseDisk");
    }

    public record Disk(String total, String used, int percent) {}
}
