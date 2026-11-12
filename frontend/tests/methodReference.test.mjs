import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { extractMethods } from "../src/data/methodReference.js";

test("여러 줄의 Mapper 파라미터와 애너테이션을 빠짐없이 읽는다", async () => {
  const source = await readFile(
    new URL(
      "../../backend/src/main/java/com/inven/core/backend/api/benchmark/mapper/BenchmarkMapper.java",
      import.meta.url,
    ),
    "utf8",
  );
  const methods = extractMethods(source, true);
  assert.equal(methods.length, 10);
  for (const name of ["sumAmount", "explain"]) {
    const method = methods.find((entry) => entry.name === name);
    assert.match(method.params, /@Param\("accountId"\) int accountId/);
    assert.match(method.params, /@Param\("state"\) int state/);
    assert.ok(method.code.endsWith(");"));
    assert.notEqual(method.note[0], "Mapper 메서드");
  }
});

test("이름이 같은 메서드도 각 소스의 Javadoc을 우선 표시한다", () => {
  const source = `
/** 첫 번째 원본의 버전을 조회합니다. */
@Transactional(readOnly = true)
public String inspect(@RequestParam(defaultValue = "}") String id) {
    return "문자열의 } 는 본문 끝이 아닙니다.";
}
/** 두 번째 캐시의 TTL을 조회합니다. */
public long inspect(String id, boolean cached) {
    // 주석의 } 도 본문 끝이 아닙니다.
    return 30;
}`;
  const methods = extractMethods(source, true);
  assert.equal(methods.length, 2);
  assert.match(methods[0].note[1], /원본의 버전/);
  assert.match(methods[1].note[1], /캐시의 TTL/);
  assert.ok(methods[0].code.endsWith("\n}"));
  assert.match(methods[1].code, /return 30;/);
});

test("React 기본 내보내기와 내부 처리 함수의 설명을 읽는다", () => {
  const source = `
/** 실습 화면을 표시합니다. */
export default function Example({ item }) {
  /** 입력값을 검증합니다. */
  const validate = (value) => {
    return value !== "}";
  };
  return validate(item);
}`;
  const methods = extractMethods(source, false);
  assert.deepEqual(
    methods.map((entry) => entry.name),
    ["Example", "validate"],
  );
  assert.equal(methods[1].note[1], "입력값을 검증합니다.");
});
