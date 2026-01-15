import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getItems } from '../services/itemService';
import { logout } from '../services/authService';

function ItemsPage() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchItems = async () => {
            try {
                const data = await getItems();
                setItems(data);
            } catch (err) {
                // API 호출 시 401(Unauthorized) 또는 403(Forbidden) 에러가 발생하면
                // 토큰이 유효하지 않다는 의미이므로 로그인 페이지로 보냅니다.
                if (err.response && [401, 403].includes(err.response.status)) {
                    alert('인증이 만료되었습니다. 다시 로그인해주세요.');
                    handleLogout(); // 로그아웃 처리 후 리디렉션
                } else {
                    setError('데이터를 불러오는 데 실패했습니다.');
                    console.error(err);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchItems();
    }, []); // navigate를 의존성 배열에서 제거하여 불필요한 재호출 방지

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (loading) {
        return <div>데이터를 불러오는 중...</div>;
    }

    if (error) {
        return <div style={{ color: 'red' }}>{error}</div>;
    }

    return ( 
        <div> 
            <h1>재고 목록</h1> 
            <button onClick={handleLogout} style={{ marginBottom: '20px' }}>로그아웃</button> 
            {items.length === 0 ? (
                <p>등록된 재고가 없습니다.</p>
            ) : (
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>상품명</th>
                            <th>수량</th>
                            <th>가격</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item) => (
                            <tr key={item.id}>
                                <td>{item.id}</td>
                                <td>{item.name}</td>
                                <td>{item.quantity}</td>
                                <td>{item.price.toLocaleString()}원</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div> 
    ); 
}

export default ItemsPage;