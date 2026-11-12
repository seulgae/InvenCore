package com.inven.core.backend.api.practice;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import java.sql.*;
import java.util.*;
import java.util.function.LongUnaryOperator;
import java.util.stream.LongStream;

/** Fixed fixtures only: learner code runs in isolation, never against application tables or SSH. */
@Service
@RequiredArgsConstructor
public class InventoryPractice {
    private final UserParallelCode parallel;
    private final UserIndexCode index;
    private final UserGwCode gw;
    private final UserCapacityCode capacity;
    private final UserAuthCode auth;
    private final UserBoardCode board;
    private final UserFilesCode files;
    private final UserCommentsCode comments;

    public record Check(String title, boolean passed, String detail) {}
    public record Report(String cardId, boolean ready, List<Check> checks) {}
    @FunctionalInterface interface Task { void run() throws Exception; }
    private Check check(String title, Task task) {
        try { task.run(); return new Check(title, true, "예제·경계값 검사 통과"); }
        catch (Exception | AssertionError e) {
            // Return fixed test feedback, never a database URL, hash, or stack trace.
            return new Check(title, false, e instanceof UnsupportedOperationException
                    ? "TODO 미구현 · 해당 Java 메서드를 작성하세요."
                    : e instanceof AssertionError ? e.getMessage() : "검사 중 예외 · 입력 조건과 반환 형식을 확인하세요.");
        }
    }
    private static void expect(boolean valid, String message) { if (!valid) throw new AssertionError(message); }
    private static void rejects(Task task) throws Exception {
        try { task.run(); } catch (IllegalArgumentException expected) { return; }
        throw new AssertionError("잘못된 입력은 IllegalArgumentException으로 거부해야 합니다.");
    }
    public Report inspect(String cardId) {
        List<Check> checks = switch (cardId) {
            case "parallel-stream" -> List.of(
                check("순차·병렬 결과 일치", () -> {
                    var values=LongStream.rangeClosed(1, 10000).boxed().toList();
                    LongUnaryOperator work=x -> x*x;
                    expect(parallel.aggregate(values,false,work)==333383335000L,"순차 제곱 합계가 다릅니다.");
                    expect(parallel.aggregate(values,true,work)==333383335000L,"병렬 제곱 합계가 다릅니다.");
                }),
                check("빈 목록·long 범위·연산 전달", () -> {
                    for (boolean p : new boolean[]{false,true}) {
                        expect(parallel.aggregate(List.of(),p,x->x)==0,"빈 목록은 0입니다.");
                        expect(parallel.aggregate(List.of(3000000000L,4L),p,x->x*2)==6000000008L,"long 범위와 work 적용을 확인하세요.");
                    }
                }));
            case "index-tuning" -> List.of(check("H2 실제 쿼리·인덱스 실행 계획", this::inspectIndex));
            case "gw-sync" -> List.of(
                check("신규·중복·역전·삭제 후 이전 버전", () -> {
                    expect(gw.shouldApply(0,1),"최초 버전을 반영하세요.");
                    expect(gw.shouldApply(3,5),"최신 상태 연동은 버전 건너뛰기를 허용합니다.");
                    expect(!gw.shouldApply(5,5),"중복 이벤트를 무시하세요.");
                    expect(!gw.shouldApply(5,2),"삭제 버전 5 이후 과거 버전 2도 무시하세요.");
                    expect(gw.shouldApply(5,6),"삭제 이후 새 버전은 반영할 수 있습니다.");
                    expect(gw.shouldApply(3000000000L,3000000001L),"long 버전을 지원하세요.");
                }));
            case "capacity" -> List.of(
                check("df 공백·탭·0/100%", () -> {
                    expect(new UserCapacityCode.Disk("100G","25G",25).equals(capacity.parseDisk("  /dev/sda   100G 25G 75G 25% /  ")),"df 컬럼 위치를 확인하세요.");
                    expect(capacity.parseDisk("tmpfs\t2G\t0G\t2G\t0%\t/run").percent()==0,"탭과 0%를 지원하세요.");
                    expect(capacity.parseDisk("disk 2T 2T 0T 100% /").percent()==100,"100%도 유효합니다.");
                }),
                check("불완전한 SSH 응답 거부", () -> {
                    for(String s : Arrays.asList(null,"","disk 1G","disk 1G 0G 1G 101% /","disk 1G 0G 1G x% /","disk 1G 0G 1G -1% /","disk 1G 0G 1G 25 /")) rejects(()->capacity.parseDisk(s));
                }));
            case "auth" -> List.of(check("BCrypt salt·일치·불일치·누락", () -> {
                var encoder=new BCryptPasswordEncoder(4); // small cost for fixed, synthetic practice fixtures
                String first=auth.encode("PracticeOnly123!",encoder), second=auth.encode("PracticeOnly123!",encoder);
                expect(!"PracticeOnly123!".equals(first) && encoder.matches("PracticeOnly123!",first),"전달된 encoder로 암호화하세요.");
                expect(!Objects.equals(first,second),"BCrypt salt로 동일 입력도 다른 해시가 생성됩니다.");
                expect(auth.matches("PracticeOnly123!",first,encoder),"matches로 원문과 저장 해시를 비교하세요.");
                expect(!auth.matches("Wrong",first,encoder),"틀린 비밀번호는 거부하세요.");
                expect(!auth.matches(null,first,encoder) && !auth.matches("x",null,encoder) && !auth.matches("x","",encoder),"누락된 자격 정보는 false입니다.");
            }));
            case "board" -> List.of(
                check("페이지 offset·내림차순·최대 크기", () -> {
                    var page=board.page(2,20);
                    expect(page.getPageNumber()==2 && page.getPageSize()==20 && page.getOffset()==40,"0 기준 페이지와 offset을 확인하세요.");
                    var order=page.getSort().getOrderFor("id");
                    expect(order!=null && order.isDescending(),"id 내림차순으로 정렬하세요.");
                    expect(board.page(0,1).getOffset()==0 && board.page(1,100).getPageSize()==100,"허용 경계 1/100을 확인하세요.");
                    expect(board.page(Integer.MAX_VALUE,100).getOffset()==214748364700L,"offset 계산은 long입니다.");
                }),
                check("잘못된 페이지 요청", () -> {
                    rejects(()->board.page(-1,20)); rejects(()->board.page(0,0)); rejects(()->board.page(0,101));
                }));
            case "files" -> List.of(
                check("확장자·크기 경계", () -> {
                    for(String name : List.of("image.PNG","a.jpg","a.jpeg","a.pdf","a.txt")) expect(files.allowed(name,1),"허용 확장자/대소문자를 확인하세요.");
                    expect(files.allowed("a.pdf",5242880),"5MiB까지 허용하세요.");
                    for(long size : new long[]{-1,0,5242881}) expect(!files.allowed("a.pdf",size),"크기는 1..5MiB입니다.");
                }),
                check("경로·실행 파일·빈 이름 거부", () -> {
                    for(String name : Arrays.asList(null,""," ",".","..","../x.png","C:\\x.png","a/b.txt","a.exe","x.png.exe","README")) expect(!files.allowed(name,100),"경로 또는 허용되지 않은 이름을 거부하세요.");
                }));
            case "comments" -> List.of(check("게시글 격리·정렬·직접 답글·고아 제외", () -> {
                var rows=List.of(new UserCommentsCode.Row(4,1,1L,"reply"),new UserCommentsCode.Row(9,2,null,"other"),
                    new UserCommentsCode.Row(2,1,null,"second"),new UserCommentsCode.Row(6,1,4L,"deep"),
                    new UserCommentsCode.Row(8,1,999L,"orphan"),new UserCommentsCode.Row(1,1,null,"first"),
                    new UserCommentsCode.Row(3,1,1L,"reply"),new UserCommentsCode.Row(7,2,1L,"cross board"));
                var expected=List.of(new UserCommentsCode.Thread(rows.get(5),List.of(rows.get(6),rows.get(0))),new UserCommentsCode.Thread(rows.get(2),List.of()));
                expect(expected.equals(comments.threads(rows,1)),"부모 [1,2], 부모 1 답글 [3,4]만 반환하세요.");
                expect(comments.threads(rows,99).isEmpty() && comments.threads(List.of(),1).isEmpty(),"없는 게시글과 빈 입력은 빈 목록입니다.");
            }));
            default -> throw new ResponseStatusException(HttpStatus.NOT_FOUND,"실습 카드가 없습니다.");
        };
        return new Report(cardId,checks.stream().allMatch(Check::passed),checks);
    }
    private void inspectIndex() throws Exception {
        // An independent short-lived DB: never runs student SQL against benchmark or application data.
        try(var db=DriverManager.getConnection("jdbc:h2:mem:practice_"+UUID.randomUUID());var statement=db.createStatement()) {
            statement.execute("CREATE TABLE practice_orders(id BIGINT PRIMARY KEY,customer_id BIGINT,amount BIGINT)");
            statement.execute("INSERT INTO practice_orders SELECT X, MOD(X,100), X FROM SYSTEM_RANGE(1,10000)");
            String sql=index.sumSql();
            long before=queryTotal(db,sql,42);
            expect(before==499200,"customer_id=42의 합계는 499200입니다.");
            expect(queryTotal(db,sql,-1)==0,"결과가 없으면 합계는 0입니다.");
            statement.execute(index.indexSql());
            statement.execute("ANALYZE");
            expect(queryTotal(db,sql,42)==before,"인덱스 추가 전후 결과가 같아야 합니다.");
            try(var explain=db.prepareStatement("EXPLAIN "+sql)) {
                explain.setLong(1,42);
                try(var result=explain.executeQuery()) {
                    result.next();
                    expect(result.getString(1).toUpperCase(Locale.ROOT).contains("IDX_PRACTICE_CUSTOMER"),"EXPLAIN에서 customer_id 인덱스 사용을 확인하세요.");
                }
            }
        }
    }
    private long queryTotal(Connection db,String sql,long customer) throws SQLException {
        try(var query=db.prepareStatement(sql)) {
            query.setQueryTimeout(3); query.setLong(1,customer);
            try(var result=query.executeQuery()) {
                expect(result.next(),"합계 한 행을 반환하세요.");
                long value=result.getLong("total");
                expect(!result.wasNull(),"빈 합계에 COALESCE를 적용하세요.");
                expect(!result.next(),"합계 한 행만 반환하세요.");
                return value;
            }
        }
    }
}
