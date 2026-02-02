package com.inven.core.backend.api.serverCapacity.dto;

import java.io.Serializable;

import lombok.Data;

/**
 * 서버 설정 정보 DTO
 * @author SI본부 개발팀 길태형
 * @since 2025.12.12
 * @version 1.0
 */
@Data
public class ServerConfigDTO implements Serializable {

	private static final long serialVersionUID = 1L;
	
	/* 서버 호스트 */
	private String host;
	
	/* 서버 포트 */
	private int port;
	
	/* 사용자명 */
	private String user;
	
	/* 비밀번호 - 이 필드는 더 이상 사용되지 않음 */
	private String password;
	
	/* 서버 타입 (WEB/WAS/DB) */
	private String serverType;
	
	/* 서버 번호 */
	private String serverNo;
	
	/* OS 타입 (WINDOWS, LINUX) */
	private String osType;
}
