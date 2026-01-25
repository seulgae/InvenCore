package com.inven.core.backend.api.member.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.ColumnDefault;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "members")
public class Member {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Column(nullable = false)
    private String password;

    // ✅ role 컬럼 추가
    @Column(nullable = false)
    @ColumnDefault("1") // ✅ 기본값 1 (일반사용자)
    private Integer role;

    @Builder
    public Member(String username, String password, Integer role) {
        this.username = username;
        this.password = password;
        this.role = (role != null) ? role : 1; // ✅ 빌더 사용 시 role이 없으면 1로 설정
    }
}