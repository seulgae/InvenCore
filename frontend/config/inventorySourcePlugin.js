import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Public implementation source allowlist. Never include config or key files.
const allowedPaths = new Set([
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
