package com.inven.core.backend.sample.member;

import com.inven.core.backend.sample.member.dto.LoginRequest;
import com.inven.core.backend.sample.member.dto.MemberResponse;
import com.inven.core.backend.sample.member.dto.RegisterRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/members") // 프론트엔드에서 호출할 API 경로
public class MemberController {

    private final MemberService memberService;

    @Autowired
    public MemberController(MemberService memberService) {
        this.memberService = memberService;
    }

    /**
     * 회원 로그인 API
     * @param loginRequest 로그인 요청 DTO (username, password)
     * @return 로그인 성공/실패 여부 및 메시지, 토큰 포함 응답
     */
    @PostMapping("/login")
    public ResponseEntity<MemberResponse> login(@RequestBody LoginRequest loginRequest) {
        MemberResponse response = memberService.login(loginRequest);
        return response.isSuccess() ? ResponseEntity.ok(response) : ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
    }

    /**
     * 회원가입 API
     * @param registerRequest 회원가입 요청 DTO (username, password)
     * @return 회원가입 성공/실패 여부 및 메시지 포함 응답
     */
    @PostMapping("/register")
    public ResponseEntity<MemberResponse> register(@RequestBody RegisterRequest registerRequest) {
        MemberResponse response = memberService.register(registerRequest);
        return response.isSuccess() ? ResponseEntity.status(HttpStatus.CREATED).body(response) : ResponseEntity.badRequest().body(response);
    }
}