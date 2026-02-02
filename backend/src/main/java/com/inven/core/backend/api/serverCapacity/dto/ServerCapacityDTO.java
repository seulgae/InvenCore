package com.inven.core.backend.api.serverCapacity.dto;

import java.io.Serializable;
import lombok.Data;

/**
 * 서버 용량 정보 DTO
 * 
 * @author SI본부 개발팀 길태형
 * @since 2025.12.12
 * @version 1.0
 */
@Data
public class ServerCapacityDTO implements Serializable {

	private static final long serialVersionUID = 1L;
	
	private Long sysSn;
	private String serverType;
	private String serverNo;
	
	private String memoryCapacity;
	private String memoryUsed;
	private String memoryAvailable;
	private String memoryShared;
	private String memoryBuffer;
	private String memoryFree;
	
	private String cpuStatus;
	private String cpuUsage;
	
	// '서버 시스템 용량' 관련 필드
	private String systemDiskTotal;
	private String systemDiskUsed;
	private String systemDiskUsagePercent;
	
	private String regDt;
}
