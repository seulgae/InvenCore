package com.inven.core.backend.api.orderlab.practice;

import com.inven.core.backend.api.orderlab.OrderLabDto.*;
import com.inven.core.backend.api.orderlab.OrderLabStore;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import java.util.*;
import java.util.function.BooleanSupplier;

@Service @RequiredArgsConstructor
public class OrderLabPractice {
    private final UserKafkaCode learner;
    public record Check(String id, String title, boolean passed, String detail) {}
    public record Report(boolean ready, List<Check> checks) {}

    public Report inspectCode() {
        List<Check> checks=List.of(
            check("partition","TODO 1 · 파티션 선택",()-> {
                Set<Integer> distribution=new HashSet<>();
                for(String key:List.of("ORDER-A","ORDER-B","ORDER-C","ORDER-D")) {
                    int first=learner.selectPartition(key,1,3,Routing.KEYED); distribution.add(first);
                    for(int seq=1;seq<=4;seq++) if(learner.selectPartition(key,seq,3,Routing.KEYED)!=first || first<0 || first>=3) return false;
                }
                for(int seq=1;seq<=4;seq++) if(learner.selectPartition("ORDER-A",seq,3,Routing.SPREAD)!=(seq-1)%3) return false;
                return distribution.size()>1;
            }),
            check("offset","TODO 2 · 다음 오프셋",()-> {
                for(long offset:new long[]{0,7,41,1_000_000_000L}) if(learner.nextOffset(offset)!=offset+1) return false;
                return true;
            }),
            check("idempotency","TODO 3 · 중복·과거 버전 방어",()-> learner.shouldApply(0,1) && learner.shouldApply(4,5)
                    && !learner.shouldApply(4,4) && !learner.shouldApply(4,2)));
        return new Report(checks.stream().allMatch(Check::passed),checks);
    }

    private Check check(String id,String title,BooleanSupplier contract) {
        try { boolean passed=contract.getAsBoolean(); return new Check(id,title,passed,passed?"기본 계약 검사 통과":"입력·반환 규칙을 다시 확인하세요."); }
        catch(RuntimeException failure) { return new Check(id,title,false,failure.getMessage()==null?failure.getClass().getSimpleName():failure.getMessage()); }
    }

    public void requireReady(Implementation implementation) {
        if(implementation==Implementation.LEARNER && !inspectCode().ready())
            throw new ResponseStatusException(HttpStatus.CONFLICT,"내 코드의 TODO 세 곳을 구현하고 검사를 통과한 뒤 플레이하세요.");
    }
    public int partition(Implementation implementation,String key,int sequence,Routing routing) {
        int value=implementation==Implementation.LEARNER ? learner.selectPartition(key,sequence,3,routing)
                : routing==Routing.KEYED ? OrderLabStore.keyPartition(key) : (sequence-1)%3;
        if(value<0 || value>=3) throw new IllegalArgumentException("파티션은 0~2 범위여야 합니다.");
        return value;
    }
    public long nextOffset(boolean useLearner,long offset) {
        long next=useLearner?learner.nextOffset(offset):Math.addExact(offset,1);
        if(next!=offset+1) throw new IllegalArgumentException("다음 오프셋 계산을 확인하세요: "+offset);
        return next;
    }
    public boolean shouldApply(boolean useLearner,long stored,long incoming) {
        return useLearner?learner.shouldApply(stored,incoming):incoming>stored;
    }
}
