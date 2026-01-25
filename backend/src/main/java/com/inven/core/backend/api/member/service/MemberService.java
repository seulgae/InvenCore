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
@RequiredArgsConstructor
public class MemberService {

    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Transactional(readOnly = true)
    public MemberResponse login(LoginRequest request) {
        return memberRepository.findByUsername(request.getUsername())
                .map(member -> {
                    if (passwordEncoder.matches(request.getPassword(), member.getPassword())) {
                        String token = jwtUtil.generateToken(request.getUsername());
                        // ✅ 응답에 role 정보 추가
                        return new MemberResponse(member.getUsername(), "로그인 성공!", token, member.getRole(), true);
                    }
                    // ✅ 실패 응답 형식 통일
                    return new MemberResponse(null, "아이디 또는 비밀번호가 올바르지 않습니다.", null, null, false);
                })
                .orElse(new MemberResponse(null, "아이디 또는 비밀번호가 올바르지 않습니다.", null, null, false));
    }

    @Transactional
    public MemberResponse register(RegisterRequest request) {
        if (memberRepository.findByUsername(request.getUsername()).isPresent()) {
            // ✅ 실패 응답 형식 통일
            return new MemberResponse(null, "이미 존재하는 아이디입니다.", null, null, false);
        }

        String encodedPassword = passwordEncoder.encode(request.getPassword());

        Member newMember = Member.builder()
                .username(request.getUsername())
                .password(encodedPassword)
                .role(1) // ✅ 명시적으로 일반사용자(1)로 설정
                .build();
        memberRepository.save(newMember);

        // ✅ 성공 응답 형식 통일
        return new MemberResponse(request.getUsername(), "회원가입 성공!", null, 1, true);
    }
    
    @Transactional(readOnly = true)
    public boolean checkUsernameAvailability(String username) {
        return !memberRepository.findByUsername(username).isPresent();
    }
}