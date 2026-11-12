package com.inven.core.backend.api.orderlab;

import com.inven.core.backend.api.gwsync.config.GwSyncProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.util.*;
import static com.inven.core.backend.api.orderlab.OrderLabDto.*;
import com.inven.core.backend.api.orderlab.practice.OrderLabPractice;

@Service @RequiredArgsConstructor
@ConditionalOnProperty(prefix="gw-sync",name="mode",havingValue="local",matchIfMissing=true)
public class OrderLabLocalEngine implements OrderLabEngine {
    private final OrderLabEventRepository events;
    private final OrderLabStore store;
    private final GwSyncProperties properties;
    private final OrderLabPractice practice;
    private final long[] ends=new long[3];
    private final long[][] positions=new long[2][3];
    private final long[][] committed=new long[2][3];
    private final boolean[] paused=new boolean[2];
    @Override public synchronized Position publish(OrderLabEvent event) {
        int partition=event.getDestinationPartition(); return new Position(partition,ends[partition]++);
    }
    @Scheduled(fixedDelayString="${order-lab.consume-delay-ms:300}")
    public synchronized void consumeLocalOrders() {
        if(!properties.isEnabled()) return;
        for(Group group:Group.values()) {
            int g=group.ordinal(); if(paused[g]) continue;
            // Deliberately read partition 2,1,0: this is a visible teaching model, not a Kafka measurement.
            for(int p=2;p>=0;p--) for(var event:events.records(p,positions[g][p],PageRequest.of(0,4))) {
                store.consume(event.message(),group,p,event.getBrokerOffset());
                positions[g][p]=practice.nextOffset(event.isLearner(),event.getBrokerOffset()); committed[g][p]=positions[g][p];
            }
        }
    }
    @Override public synchronized State state() {
        List<GroupState> groups=new ArrayList<>();
        for(Group group:Group.values()) {
            List<PartitionState> partitions=new ArrayList<>();
            for(int p=0;p<3;p++) partitions.add(new PartitionState(p,0,ends[p],committed[group.ordinal()][p],Math.max(0,ends[p]-committed[group.ordinal()][p])));
            groups.add(new GroupState(group,paused[group.ordinal()],paused[group.ordinal()],partitions));
        }
        return new State("LOCAL_SIMULATION","local:order-events",groups);
    }
    @Override public synchronized void control(Group group,String action) {
        int g=group.ordinal();
        switch(action) {
            case "pause" -> paused[g]=true;
            case "resume" -> paused[g]=false;
            case "restart" -> { positions[g]=committed[g].clone(); paused[g]=false; }
            case "replay" -> {
                if(!paused[g]) throw new ResponseStatusException(HttpStatus.CONFLICT,"그룹을 일시정지한 뒤 재처리하세요.");
                positions[g]=new long[3];
            }
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"지원하지 않는 그룹 명령입니다.");
        }
    }
    @Override public synchronized void replayFrom(Group group,Map<Integer,Long> offsets) {
        if(!paused[group.ordinal()]) throw new ResponseStatusException(HttpStatus.CONFLICT,"작업자가 쉬는 상태에서 되감아 주세요.");
        offsets.forEach((partition,offset)->positions[group.ordinal()][partition]=offset);
    }
}
