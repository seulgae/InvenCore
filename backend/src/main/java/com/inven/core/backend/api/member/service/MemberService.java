package com.inven.core.backend.api.member.service;

import com.inven.core.backend.api.member.dto.LoginRequest;
import com.inven.core.backend.api.member.dto.MemberResponse;
import com.inven.core.backend.api.member.dto.RegisterRequest;
import com.inven.core.backend.api.member.entity.Member;
import com.inven.core.backend.api.member.repository.MemberRepository;
import com.inven.core.backend.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor // final 필드에 대한 생성자를 자동으로 생성합니다.
public class MemberService {

    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    /**
     * 회원 로그인 처리
     * 데이터베이스에서 사용자를 조회하고, 비밀번호를 비교합니다.
     *
     * @param request 로그인 요청 DTO
     * @return 로그인 응답 DTO
     */
    @Transactional(readOnly = true)
    public MemberResponse login(LoginRequest request) {
        return memberRepository.findByUsername(request.getUsername())
                .map(member -> {
                    // 데이터베이스에 저장된 암호화된 비밀번호와 사용자가 입력한 비밀번호를 비교합니다.
                    if (passwordEncoder.matches(request.getPassword(), member.getPassword())) {
                        // JWT 토큰 생성
                        String token = jwtUtil.generateToken(request.getUsername());
                        return new MemberResponse(request.getUsername(), "로그인 성공!", token, true);
                    }
                    // 비밀번호가 일치하지 않는 경우
                    return new MemberResponse(null, "아이디 또는 비밀번호가 올바르지 않습니다.", null, false);
                })
                // 사용자를 찾을 수 없는 경우
                .orElse(new MemberResponse(null, "아이디 또는 비밀번호가 올바르지 않습니다.", null, false));
    }

    /**
     * 회원가입 처리
     * 사용자 정보를 데이터베이스에 저장하고, 비밀번호를 암호화합니다.
     *
     * @param request 회원가입 요청 DTO
     * @return 회원가입 응답 DTO
     */
    @Transactional
    public MemberResponse register(RegisterRequest request) {
        // 이미 존재하는 아이디인지 확인합니다.
        if (memberRepository.findByUsername(request.getUsername()).isPresent()) {
            return new MemberResponse(null, "이미 존재하는 아이디입니다.", null, false);
        }

        // 비밀번호를 암호화합니다.
        String encodedPassword = passwordEncoder.encode(request.getPassword());

        // Member 엔티티를 생성하고 저장합니다.
        Member newMember = Member.builder()
                .username(request.getUsername())
                .password(encodedPassword)
                .build();
        memberRepository.save(newMember);

        return new MemberResponse(request.getUsername(), "회원가입 성공!", null, true);
    }

    /**
     * 아이디 사용 가능 여부 확인
     * @param username 확인할 아이디
     * @return 사용 가능하면 true, 아니면 false
     */
    @Transactional(readOnly = true)
    public boolean checkUsernameAvailability(String username) {
        // 해당 아이디를 가진 회원이 존재하지 않으면 true (사용 가능)
        return !memberRepository.findByUsername(username).isPresent();
    }
}