import React, { useState, useEffect, useMemo } from 'react';
import apiClient from '../../api/axios';
import '../../styles/ServerCapacity.css';

// TODO: 이 서버 목록은 향후 DB나 설정 파일에서 관리하는 것이 좋습니다.
const MONITORED_SERVERS = [
    {
        host: '13.124.177.193', // 실제 서버 호스트
        port: 22,
        user: 'ec2-user', // 실제 접속 유저
        serverNo: 'AWS-WAS-01', // 서버 번호 형식 변경
        serverType: 'WAS',
        osType: 'LINUX'
    },
    // 다른 서버가 있다면 여기에 추가
];

function ServerCapacityPage() {
    const [capacities, setCapacities] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [checking, setChecking] = useState({});

    const fetchCapacities = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/server-capacity');
            const capacitiesMap = response.data.reduce((acc, cur) => {
                acc[cur.serverNo] = cur;
                return acc;
            }, {});
            setCapacities(capacitiesMap);
        } catch (err) {
            setError('서버 용량 정보를 불러오는 데 실패했습니다.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCapacities();
    }, []);

    const handleCheckCapacity = async (serverConfig) => {
        setChecking(prev => ({ ...prev, [serverConfig.serverNo]: true }));
        setError('');

        try {
            // 비밀번호 프롬프트 제거, 백엔드에서 하드코딩된 비밀번호 사용
            await apiClient.post('/server-capacity/check', serverConfig);
            alert(`${serverConfig.serverNo} 서버의 용량 조사가 완료되었습니다.`);
            fetchCapacities();
        } catch (err) {
            if (err.response && err.response.status === 429) {
                alert(err.response.data);
            } else {
                setError(`${serverConfig.serverNo} 서버 용량 조사에 실패했습니다. (서버 상태 확인)`);
            }
            console.error(err);
        } finally {
            setChecking(prev => ({ ...prev, [serverConfig.serverNo]: false }));
        }
    };

    const serverList = useMemo(() => {
        return MONITORED_SERVERS.map(server => ({
            ...server,
            capacity: capacities[server.serverNo] || null
        }));
    }, [capacities]);

    if (loading) {
        return <div className="capacity-container"><h2>로딩 중...</h2></div>;
    }

    return (
        <div className="capacity-container">
            <h1>서버 용량 조사</h1>
            <p>각 서버의 최신 용량 정보를 확인하고, 버튼을 눌러 실시간으로 업데이트할 수 있습니다.</p>
            {error && <div className="error-message">{error}</div>}
            
            <table className="capacity-table">
                <thead>
                    <tr>
                        <th>서버 번호</th>
                        <th>서버 타입</th>
                        <th>메모리 사용량</th>
                        <th>CPU 사용량</th>
                        <th>서버 시스템 용량</th>
                        <th>마지막 업데이트</th>
                        <th>동작</th>
                    </tr>
                </thead>
                <tbody>
                    {serverList.length === 0 ? (
                        <tr>
                            <td colSpan="7" className="empty-message">모니터링할 서버가 설정되지 않았습니다.</td>
                        </tr>
                    ) : (
                        serverList.map(server => (
                            <tr key={server.serverNo}>
                                <td>{server.serverNo}</td>
                                <td>{server.serverType}</td>
                                <td>{server.capacity ? `${server.capacity.memoryUsed} / ${server.capacity.memoryCapacity}` : 'N/A'}</td>
                                <td>{server.capacity ? server.capacity.cpuUsage : 'N/A'}</td>
                                <td>{server.capacity ? `${server.capacity.systemDiskUsed} / ${server.capacity.systemDiskTotal} (${server.capacity.systemDiskUsagePercent})` : 'N/A'}</td>
                                <td>{server.capacity ? new Date(server.capacity.regDt).toLocaleString() : 'N/A'}</td>
                                <td>
                                    <button 
                                        onClick={() => handleCheckCapacity(server)}
                                        disabled={checking[server.serverNo]}
                                        className="check-button"
                                    >
                                        {checking[server.serverNo] ? '조사중...' : '용량조사'}
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default ServerCapacityPage;
