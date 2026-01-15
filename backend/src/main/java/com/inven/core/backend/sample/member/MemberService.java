package com.inven.core.backend.sample.member;

import com.inven.core.backend.sample.member.dto.LoginRequest;
import com.inven.core.backend.sample.member.dto.MemberResponse;
import com.inven.core.backend.sample.member.dto.RegisterRequest;
import org.springframework.stereotype.Service;

@Service
public class MemberService {

    /**
     * 회원 로그인 처리
     * 실제 구현에서는 데이터베이스 조회, 비밀번호 암호화 비교, JWT 토큰 생성 등의 로직이 들어갑니다.
     *
     * @param request 로그인 요청 DTO
     * @return 로그인 응답 DTO
     */
    public MemberResponse login(LoginRequest request) {
        // 여기서는 간단한 더미 로직을 사용합니다.
        if ("testuser".equals(request.getUsername()) && "password".equals(request.getPassword())) {
            // 실제로는 사용자 ID, 역할 등에 기반한 JWT 토큰을 생성하여 반환합니다.
            String dummyToken = "dummy-jwt-token-for-" + request.getUsername();
            return new MemberResponse(request.getUsername(), "로그인 성공!", dummyToken, true);
        } else {
            return new MemberResponse(null, "아이디 또는 비밀번호가 올바르지 않습니다.", null, false);
        }
    }

    /**
     * 회원가입 처리
     * 실제 구현에서는 데이터베이스에 사용자 정보 저장, 비밀번호 암호화 등의 로직이 들어갑니다.
     *
     * @param request 회원가입 요청 DTO
     * @return 회원가입 응답 DTO
     */
    public MemberResponse register(RegisterRequest request) {
        // 여기서는 간단한 더미 로직을 사용합니다.
        // 실제로는 중복 아이디 체크, 비밀번호 암호화 후 저장 등의 로직이 필요합니다.
        if ("newuser".equals(request.getUsername())) {
            return new MemberResponse(null, "이미 존재하는 아이디입니다.", null, false);
        }
        return new MemberResponse(request.getUsername(), "회원가입 성공!", null, true);
    }
}