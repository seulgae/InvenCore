package com.inven.core.backend.api.member.repository;

import com.inven.core.backend.api.member.entity.Member;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MemberRepository extends JpaRepository<Member, Long> {
    /**
     * 로그인 아이디에 해당하는 회원을 조회합니다.
     */
    Optional<Member> findByUsername(String username);
}
