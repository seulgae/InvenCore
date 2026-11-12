package com.inven.core.backend;

import com.inven.core.backend.api.orderlab.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.kafka.test.context.EmbeddedKafka;
import org.springframework.test.annotation.DirtiesContext;
import java.time.*;
import java.util.*;
import java.util.function.BooleanSupplier;
import static com.inven.core.backend.api.orderlab.OrderLabDto.*;
import static org.junit.jupiter.api.Assertions.*;
import com.inven.core.backend.api.orderlab.practice.UserKafkaCode;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;

@SpringBootTest(properties={"benchmark.rows=1000","gw-sync.enabled=true","gw-sync.mode=external",
        "spring.datasource.url=jdbc:h2:mem:order-lab-kafka;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE"})
@EmbeddedKafka(partitions=3,bootstrapServersProperty="spring.kafka.bootstrap-servers")
@DirtiesContext
class OrderLabKafkaTests {
    @Autowired OrderLabStore store;
    @Autowired OrderLabEngine engine;
    @MockitoBean UserKafkaCode learner;
    @Test void realKafkaMaintainsKeyedPartitionOffsetsAndSupportsIndependentGroupsAndReplay() throws Exception {
        engine.control(Group.PROCESSING,"pause");
        await(()->engine.state().groups().get(0).paused());
        var run=store.start(new Start(Routing.KEYED,3));
        await(()->store.inspect(run.runId()).deliveries().stream().filter(r->r.group()==Group.AUDIT).count()==12);
        assertEquals(0,store.inspect(run.runId()).deliveries().stream().filter(r->r.group()==Group.PROCESSING).count());
        assertEquals(12,engine.state().groups().get(0).partitions().stream().mapToLong(PartitionState::lag).sum());
        engine.control(Group.PROCESSING,"resume");
        await(()->store.inspect(run.runId()).deliveries().size()==24);
        var receipts=store.inspect(run.runId()).deliveries().stream().filter(r->r.group()==Group.PROCESSING).sorted(Comparator.comparingLong(Receipt::id)).toList();
        for(var order:receipts.stream().map(Receipt::orderId).distinct().toList()) {
            var rows=receipts.stream().filter(r->r.orderId().equals(order)).toList();
            assertEquals(List.of(1,2,3,4),rows.stream().map(Receipt::sequence).toList());
            assertEquals(1,rows.stream().map(Receipt::partition).distinct().count());
            for(int i=1;i<rows.size();i++) assertTrue(rows.get(i).offset()>rows.get(i-1).offset());
        }
        engine.control(Group.PROCESSING,"restart");
        await(()->engine.state().groups().get(0).partitions().stream().allMatch(p->p.lag()==0));
        engine.control(Group.PROCESSING,"pause"); await(()->engine.state().groups().get(0).paused());
        engine.control(Group.PROCESSING,"replay"); engine.control(Group.PROCESSING,"resume");
        await(()->store.inspect(run.runId()).deliveries().stream().filter(r->r.group()==Group.PROCESSING).count()>=24);
        assertTrue(store.inspect(run.runId()).projections().stream().allMatch(p->p.sequence()==4));
        assertTrue(store.inspect(run.runId()).deliveries().stream().anyMatch(r->!r.outcome().equals("APPLIED")));
        engine.control(Group.PROCESSING,"pause"); await(()->engine.state().groups().get(0).paused());
        engine.replayFrom(Group.PROCESSING,store.replayOffsets(run.runId()));
        engine.control(Group.PROCESSING,"resume");
        await(()->store.inspect(run.runId()).deliveries().stream().filter(r->r.group()==Group.PROCESSING).count()>=36);
        var newer=store.start(new Start(Routing.KEYED,1));
        await(()->store.inspect(newer.runId()).deliveries().size()==8);
        engine.control(Group.PROCESSING,"pause"); await(()->engine.state().groups().get(0).paused());
        var starts=store.replayOffsets(newer.runId());
        assertTrue(starts.values().stream().allMatch(offset->offset>0));
        long olderCount=store.inspect(run.runId()).deliveries().size();
        engine.replayFrom(Group.PROCESSING,starts); engine.control(Group.PROCESSING,"resume");
        await(()->store.inspect(newer.runId()).deliveries().stream().filter(r->r.group()==Group.PROCESSING).count()>=8);
        assertEquals(olderCount,store.inspect(run.runId()).deliveries().size());
        // Test-only learner implementation; UserKafkaCode.java remains TODO for the learner.
        when(learner.selectPartition(anyString(),anyInt(),eq(3),any(Routing.class))).thenAnswer(invocation ->
                invocation.getArgument(3)==Routing.KEYED ? Math.floorMod(invocation.<String>getArgument(0).hashCode(),3)
                        : (invocation.<Integer>getArgument(1)-1)%3);
        when(learner.nextOffset(anyLong())).thenAnswer(invocation -> invocation.<Long>getArgument(0)+1);
        when(learner.shouldApply(anyLong(),anyLong())).thenAnswer(invocation -> invocation.<Long>getArgument(1)>invocation.<Long>getArgument(0));
        var practiceRun=store.start(new Start(Routing.KEYED,1,Implementation.LEARNER));
        await(()->store.inspect(practiceRun.runId()).deliveries().size()==8);
        await(()->engine.state().groups().stream().allMatch(group->group.partitions().stream().allMatch(p->p.lag()==0)));
        assertTrue(store.inspect(practiceRun.runId()).projections().stream().allMatch(p->p.sequence()==4));
        verify(learner,atLeastOnce()).nextOffset(anyLong());
        engine.control(Group.PROCESSING,"pause"); await(()->engine.state().groups().get(0).paused());
        engine.replayFrom(Group.PROCESSING,store.replayOffsets(practiceRun.runId()));
        engine.control(Group.PROCESSING,"resume");
        await(()->store.inspect(practiceRun.runId()).deliveries().stream().filter(r->r.group()==Group.PROCESSING).count()>=8);
        assertTrue(store.inspect(practiceRun.runId()).deliveries().stream().anyMatch(r->r.outcome().equals("DUPLICATE")));
    }
    private void await(BooleanSupplier condition) throws Exception {
        Instant deadline=Instant.now().plusSeconds(25);
        while(Instant.now().isBefore(deadline)) {
            try { if(condition.getAsBoolean()) return; }
            catch(org.springframework.web.server.ResponseStatusException initializing) {
                if(initializing.getStatusCode().value()!=503) throw initializing;
                // Topic metadata and initial group registration can lag broker startup briefly.
            }
            Thread.sleep(150);
        }
        fail("Kafka 실습 상태 반영 시간 초과");
    }
}
