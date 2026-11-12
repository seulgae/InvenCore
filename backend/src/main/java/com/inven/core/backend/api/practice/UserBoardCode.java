package com.inven.core.backend.api.practice;

import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

@Component
public class UserBoardCode {
    /** TODO: 0부터 시작하는 page, size는 1..100. 범위 밖은 IllegalArgumentException.
     * id 내림차순 PageRequest 반환. page=2,size=20의 offset은 40.
     * 이 과제의 제한은 기존 게시판 API 정책과 별개입니다. */
    public Pageable page(int page, int size) { throw new UnsupportedOperationException("TODO · page"); }
}
