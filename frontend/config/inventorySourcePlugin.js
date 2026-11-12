import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Public implementation source allowlist. Never include config or key files.
const allowedPaths = new Set([
  "backend/src/main/java/com/inven/core/backend/api/practice/UserParallelCode.java",
  "backend/src/main/java/com/inven/core/backend/api/practice/UserIndexCode.java",
  "backend/src/main/java/com/inven/core/backend/api/practice/UserGwCode.java",
  "backend/src/main/java/com/inven/core/backend/api/practice/UserCapacityCode.java",
  "backend/src/main/java/com/inven/core/backend/api/practice/UserAuthCode.java",
  "backend/src/main/java/com/inven/core/backend/api/practice/UserBoardCode.java",
  "backend/src/main/java/com/inven/core/backend/api/practice/UserFilesCode.java",
  "backend/src/main/java/com/inven/core/backend/api/practice/UserCommentsCode.java",
  "backend/src/main/java/com/inven/core/backend/api/orderlab/practice/UserKafkaCode.java",
  "backend/src/main/java/com/inven/core/backend/api/orderlab/practice/OrderLabPractice.java",
  "backend/src/main/java/com/inven/core/backend/api/orderlab/OrderLabDto.java",
  "backend/src/main/java/com/inven/core/backend/api/orderlab/OrderLabEvent.java",
  "backend/src/main/java/com/inven/core/backend/api/orderlab/OrderLabDelivery.java",
  "backend/src/main/java/com/inven/core/backend/api/orderlab/OrderLabProjection.java",
  "backend/src/main/java/com/inven/core/backend/api/orderlab/OrderLabEventRepository.java",
  "backend/src/main/java/com/inven/core/backend/api/orderlab/OrderLabDeliveryRepository.java",
  "backend/src/main/java/com/inven/core/backend/api/orderlab/OrderLabProjectionRepository.java",
  "backend/src/main/java/com/inven/core/backend/api/orderlab/OrderLabStore.java",
  "backend/src/main/java/com/inven/core/backend/api/orderlab/OrderLabEngine.java",
  "backend/src/main/java/com/inven/core/backend/api/orderlab/OrderLabPublisher.java",
  "backend/src/main/java/com/inven/core/backend/api/orderlab/OrderLabLocalEngine.java",
  "backend/src/main/java/com/inven/core/backend/api/orderlab/OrderLabKafkaConsumer.java",
  "backend/src/main/java/com/inven/core/backend/api/orderlab/OrderLabKafkaConfig.java",
  "backend/src/main/java/com/inven/core/backend/api/orderlab/OrderLabKafkaEngine.java",
  "backend/src/main/java/com/inven/core/backend/api/orderlab/OrderLabController.java",
  "backend/src/main/java/com/inven/core/backend/api/gwsync/config/GwSyncConfig.java",
  "backend/src/main/java/com/inven/core/backend/api/gwsync/cache/GwCacheStore.java",
  "backend/src/main/java/com/inven/core/backend/api/gwsync/cache/GwLocalSnapshotCache.java",
  "backend/src/main/java/com/inven/core/backend/api/gwsync/messaging/GwLocalEventPublisher.java",
  "backend/src/main/java/com/inven/core/backend/api/gwsync/messaging/GwLocalEventListener.java",
  "backend/src/main/java/com/inven/core/backend/api/gwsync/entity/GwSource.java",
  "backend/src/main/java/com/inven/core/backend/api/gwsync/entity/GwTarget.java",
  "backend/src/main/java/com/inven/core/backend/api/gwsync/dto/GwSyncDto.java",
  "backend/src/main/java/com/inven/core/backend/api/gwsync/event/GwChangedEvent.java",
  "backend/src/main/java/com/inven/core/backend/api/gwsync/repository/GwSourceRepository.java",
  "backend/src/main/java/com/inven/core/backend/api/gwsync/repository/GwTargetRepository.java",
  "backend/src/main/java/com/inven/core/backend/api/gwsync/service/GwSourceService.java",
  "backend/src/main/java/com/inven/core/backend/api/gwsync/service/GwProjectionService.java",
  "backend/src/main/java/com/inven/core/backend/api/gwsync/service/GwQueryService.java",
  "backend/src/main/java/com/inven/core/backend/api/gwsync/messaging/GwEventPublisher.java",
  "backend/src/main/java/com/inven/core/backend/api/gwsync/messaging/GwEventListener.java",
  "backend/src/main/java/com/inven/core/backend/api/gwsync/cache/GwSnapshotCache.java",
  "backend/src/main/java/com/inven/core/backend/api/gwsync/controller/GwSyncController.java",
  "backend/src/main/java/com/inven/core/backend/api/gwsync/config/GwSyncProperties.java",
  "backend/src/main/java/com/inven/core/backend/api/gwsync/config/GwKafkaConfig.java",
  "backend/src/main/java/com/inven/core/backend/api/benchmark/mapper/BenchmarkMapper.java",
  "backend/src/main/resources/mappers/benchmark/BenchmarkMapper.xml",
  "backend/src/main/java/com/inven/core/backend/api/benchmark/BenchmarkService.java",
  "backend/src/main/java/com/inven/core/backend/api/benchmark/BenchmarkController.java",
  "backend/src/main/java/com/inven/core/backend/api/benchmark/BenchmarkDataInitializer.java",
  "backend/src/main/java/com/inven/core/backend/api/benchmark/BenchmarkResult.java",
  "backend/build.gradle",
  "backend/src/main/java/com/inven/core/backend/api/member/service/MemberService.java",
  "backend/src/main/java/com/inven/core/backend/security/JwtAuthenticationFilter.java",
  "backend/src/main/java/com/inven/core/backend/util/JwtUtil.java",
  "backend/src/main/java/com/inven/core/backend/api/requestboard/controller/RequestBoardController.java",
  "backend/src/main/java/com/inven/core/backend/api/requestboard/service/impl/RequestBoardServiceImpl.java",
  "backend/src/main/java/com/inven/core/backend/api/requestboard/repository/RequestBoardRepository.java",
  "backend/src/main/java/com/inven/core/backend/api/comment/controller/CommentController.java",
  "backend/src/main/java/com/inven/core/backend/api/comment/service/CommentService.java",
  "backend/src/main/java/com/inven/core/backend/api/comment/entity/Comment.java",
  "backend/src/main/java/com/inven/core/backend/api/requestboard/entity/RequestBoard.java",
  "backend/src/main/java/com/inven/core/backend/api/serverCapacity/controller/ServerCapacityController.java",
  "backend/src/main/java/com/inven/core/backend/api/serverCapacity/service/impl/ServerCapacityServiceImpl.java",
  "backend/src/main/java/com/inven/core/backend/api/serverCapacity/entity/ServerCapacity.java",
]);
const projectRoot = fileURLToPath(new URL("../../", import.meta.url));
const prefix = "virtual:inventory-source/";
export default function inventorySourcePlugin() {
  return {
    name: "inventory-implementation-source",
    resolveId(id) {
      if (!id.startsWith(prefix)) return null;
      const path = id.slice(prefix.length);
      if (!allowedPaths.has(path))
        throw new Error("Source file is not in the inventory allowlist");
      return `\0${id}`;
    },
    load(id) {
      if (!id.startsWith(`\0${prefix}`)) return null;
      const path = id.slice(prefix.length + 1);
      if (!allowedPaths.has(path))
        throw new Error("Source file is not in the inventory allowlist");
      const absolutePath = resolve(projectRoot, path);
      this.addWatchFile(absolutePath);
      return `export default ${JSON.stringify(readFileSync(absolutePath, "utf8"))};`;
    },
  };
}
