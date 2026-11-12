package com.inven.core.backend.api.orderlab;

import lombok.RequiredArgsConstructor;
import org.apache.kafka.common.utils.Utils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.nio.charset.StandardCharsets;
import java.util.*;
import static com.inven.core.backend.api.orderlab.OrderLabDto.*;
import com.inven.core.backend.api.orderlab.practice.OrderLabPractice;

@Service @RequiredArgsConstructor
public class OrderLabStore {
    private final OrderLabEventRepository events;
    private final OrderLabProjectionRepository projections;
    private final OrderLabDeliveryRepository deliveries;
    private final OrderLabPractice practice;
    public static int keyPartition(String key) { return Utils.toPositive(Utils.murmur2(key.getBytes(StandardCharsets.UTF_8)))%3; }

    @Transactional
    public Run start(Start request) {
        practice.requireReady(request.implementation());
        String runId=UUID.randomUUID().toString();
        String[] statuses={"CREATED","PAID","PACKED","SHIPPED"};
        for(int order=0;order<request.orders();order++) {
            String key;
            int suffix=0;
            do { key="ORD-"+runId.substring(0,8)+"-"+order+"-"+suffix++; } while(keyPartition(key)!=order%3);
            for(int step=0;step<4;step++) events.save(OrderLabEvent.builder().runId(runId).orderId(key).sequence(step+1)
                    .status(statuses[step]).partition(practice.partition(request.implementation(),key,step+1,request.routing()))
                    .learner(request.implementation()==Implementation.LEARNER).build());
        }
        return new Run(runId,request.routing(),request.orders()*4,request.implementation());
    }

    @Transactional
    public void confirm(long id,Position position) { events.findById(id).orElseThrow().confirm(position); }

    @Transactional
    public void consume(Message message,Group group,int partition,long offset) {
        if(events.lockOrder(message.runId(),message.orderId()).isEmpty()) return;
        String id=group+":"+message.orderId();
        var projection=projections.findById(id).orElseGet(()->OrderLabProjection.builder()
                .runId(message.runId()).orderId(message.orderId()).group(group).build());
        String outcome=projection.apply(message,practice.shouldApply(message.learner(),projection.getLastSequence(),message.sequence()));
        projections.save(projection);
        deliveries.save(OrderLabDelivery.builder().message(message).group(group).partition(partition).offset(offset).outcome(outcome).build());
    }

    @Transactional(readOnly=true)
    public Map<Integer,Long> replayOffsets(String runId) {
        var records=events.findByRunIdOrderByIdAsc(runId);
        if(records.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND,"실습 실행을 찾을 수 없습니다.");
        if(records.stream().anyMatch(record->record.getBrokerOffset()==null))
            throw new ResponseStatusException(HttpStatus.CONFLICT,"모든 카드가 발행된 뒤 되감아 주세요.");
        Map<Integer,Long> offsets=new HashMap<>();
        records.forEach(record->offsets.merge(record.getBrokerPartition(),record.getBrokerOffset(),Math::min));
        return offsets;
    }

    @Transactional(readOnly=true)
    public RunView inspect(String runId) {
        var records=events.findByRunIdOrderByIdAsc(runId);
        if(records.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND,"실습 실행을 찾을 수 없습니다.");
        return new RunView(runId,records.stream().filter(e->e.getBrokerOffset()!=null).count(),
                deliveries.findTop240ByRunIdOrderByIdDesc(runId).stream().map(OrderLabDelivery::view).toList(),
                projections.findByRunIdOrderByOrderIdAsc(runId).stream().map(OrderLabProjection::view).toList());
    }
}
