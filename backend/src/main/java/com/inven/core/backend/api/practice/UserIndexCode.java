package com.inven.core.backend.api.practice;

import org.springframework.stereotype.Component;

@Component
public class UserIndexCode {

    /**
     * TODO: practice_orders(customer_id, amount)에서 customer_id = ?인
     * amount 합계 SQL. 값은 바인딩, 별칭은 total. 일치하는 행이 없으면 0. 테이블/컬럼 이름은 고정.
     */
    public String sumSql() {
        throw new UnsupportedOperationException("TODO · sumSql");
    }

    /**
     * TODO: customer_id에 idx_practice_customer라는 인덱스를 만드는 DDL.
     */
    public String indexSql() {
        throw new UnsupportedOperationException("TODO · indexSql");
    }
}
