package com.inven.core.backend.api.orderlab;
import static com.inven.core.backend.api.orderlab.OrderLabDto.*;
public interface OrderLabEngine {
    Position publish(OrderLabEvent event) throws Exception;
    State state();
    void control(Group group,String action);
    void replayFrom(Group group,java.util.Map<Integer,Long> offsets);
}
