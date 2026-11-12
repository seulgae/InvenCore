package com.inven.core.backend.api.practice;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/practice")
@RequiredArgsConstructor
public class InventoryPracticeController {
    private final InventoryPractice practice;
    @PostMapping("/{cardId}/check")
    public InventoryPractice.Report check(@PathVariable String cardId) { return practice.inspect(cardId); }
}
