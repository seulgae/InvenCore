package com.inven.core.backend.api.practice;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/practice")
@RequiredArgsConstructor
public class InventoryPracticeController {

    private final InventoryPractice practice;

    /**
     * 선택한 카드의 고정 입력 실습 검사를 실행합니다.
     */
    @PostMapping("/{cardId}/check")
    public InventoryPractice.Report check(@PathVariable String cardId) {
        return practice.inspect(cardId);
    }
}
