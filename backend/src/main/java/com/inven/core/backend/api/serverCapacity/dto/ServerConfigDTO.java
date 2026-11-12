package com.inven.core.backend.api.serverCapacity.dto;

import lombok.Data;

/**
 * 서버 설정 정보 DTO
 */
@Data
public class ServerConfigDTO {

	/* 서버 호스트 */
	private String host;

	/* 서버 포트 */
	private int port;

	/* 사용자명 */
	private String user;

	/* 서버 타입 (WEB/WAS/DB) */
	private String serverType;

	/* 서버 번호 */
	private String serverNo;
}
