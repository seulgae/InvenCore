package com.inven.core.backend;

import com.inven.core.backend.api.orderlab.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import java.time.Instant;
import static com.inven.core.backend.api.orderlab.OrderLabDto.*;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(properties={"benchmark.rows=1000","gw-sync.mode=local","gw-sync.enabled=true",
        "order-lab.publish-delay-ms=600000","order-lab.consume-delay-ms=600000",
        "spring.datasource.url=jdbc:h2:mem:order-lab-local;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE"})
class OrderLabLocalTests {
    @Autowired OrderLabStore store;
    @Autowired OrderLabEngine engine;
    @Autowired OrderLabPublisher publisher;
    @Autowired OrderLabLocalEngine local;
    @Test void pausedGroupBuildsLagWhileOtherGroupContinuesAndReplayIsIdempotent() throws Exception {
        engine.control(Group.PROCESSING,"pause");
        var run=store.start(new Start(Routing.KEYED,3));
        publisher.publishOrders(); local.consumeLocalOrders();
        var view=store.inspect(run.runId());
        assertEquals(12,view.published());
        assertEquals(12,view.deliveries().stream().filter(r->r.group()==Group.AUDIT).count());
        assertEquals(0,view.deliveries().stream().filter(r->r.group()==Group.PROCESSING).count());
        assertTrue(engine.state().groups().get(0).partitions().stream().mapToLong(PartitionState::lag).sum()>=12);
        engine.control(Group.PROCESSING,"restart"); local.consumeLocalOrders();
        for(int i=0;i<10 && store.inspect(run.runId()).deliveries().stream().filter(r->r.group()==Group.PROCESSING).count()<12;i++) local.consumeLocalOrders();
        assertEquals(3,store.inspect(run.runId()).projections().stream().filter(p->p.group()==Group.PROCESSING && p.sequence()==4).count());
        engine.control(Group.PROCESSING,"pause"); engine.control(Group.PROCESSING,"replay");
        engine.control(Group.PROCESSING,"resume"); local.consumeLocalOrders();
        for(int i=0;i<10 && store.inspect(run.runId()).deliveries().stream().filter(r->r.group()==Group.PROCESSING).count()<24;i++) local.consumeLocalOrders();
        assertTrue(store.inspect(run.runId()).deliveries().stream().anyMatch(r->r.group()==Group.PROCESSING && (r.outcome().equals("STALE")||r.outcome().equals("DUPLICATE"))));
        assertTrue(store.inspect(run.runId()).projections().stream().allMatch(p->p.sequence()==4));
        engine.control(Group.PROCESSING,"pause");
        engine.replayFrom(Group.PROCESSING,store.replayOffsets(run.runId()));
        engine.control(Group.PROCESSING,"resume");
        for(int i=0;i<10 && store.inspect(run.runId()).deliveries().stream().filter(r->r.group()==Group.PROCESSING).count()<36;i++) local.consumeLocalOrders();
        assertTrue(store.inspect(run.runId()).deliveries().stream().filter(r->r.group()==Group.PROCESSING).count()>=36);
    }
    @Test void spreadingAnOrderAcrossPartitionsExposesBusinessSequenceGaps() throws Exception {
        var run=store.start(new Start(Routing.SPREAD,1));
        publisher.publishOrders();
        Instant deadline=Instant.now().plusSeconds(5);
        while(Instant.now().isBefore(deadline) && store.inspect(run.runId()).deliveries().size()<8) { local.consumeLocalOrders(); Thread.sleep(50); }
        assertTrue(store.inspect(run.runId()).deliveries().stream().anyMatch(r->r.outcome().equals("APPLIED_WITH_GAP")));
    }
}
