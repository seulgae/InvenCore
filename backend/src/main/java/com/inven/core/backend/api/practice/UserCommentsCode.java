package com.inven.core.backend.api.practice;

import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class UserCommentsCode {
    /** TODO: boardId의 최상위 댓글(parentId=null)에 직접 답글을 묶으세요.
     * 부모와 답글 각각 id 오름차순. 다른 게시글/고아 답글/답글의 답글은 제외.
     * 입력 순서에 의존하거나 원본 목록을 변경하지 마세요. */
    public List<Thread> threads(List<Row> rows, long boardId) {
        throw new UnsupportedOperationException("TODO · threads");
    }
    public record Row(long id, long boardId, Long parentId, String content) {}
    public record Thread(Row parent, List<Row> replies) {}
}
