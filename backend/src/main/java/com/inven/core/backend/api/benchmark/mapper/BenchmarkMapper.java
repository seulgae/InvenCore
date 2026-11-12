package com.inven.core.backend.api.benchmark.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface BenchmarkMapper {
    void createTable(@Param("indexed") boolean indexed);
    long countRows(@Param("indexed") boolean indexed);
    void clearTable(@Param("indexed") boolean indexed);
    void seedPlain(@Param("rows") int rows);
    void copyIndexed();
    void createIndex();
    void analyze(@Param("indexed") boolean indexed);
    String databaseVersion();
    long sumAmount(@Param("indexed") boolean indexed, @Param("accountId") int accountId, @Param("state") int state);
    String explain(@Param("indexed") boolean indexed, @Param("accountId") int accountId, @Param("state") int state);
}
