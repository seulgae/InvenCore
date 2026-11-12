package com.inven.core.backend;

import static org.junit.jupiter.api.Assertions.*;

import com.inven.core.backend.api.serverCapacity.dto.ServerConfigDTO;
import com.inven.core.backend.api.serverCapacity.service.impl.ServerCapacityServiceImpl;
import java.lang.reflect.InvocationTargetException;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class ServerCapacityKeyConfigurationTests {

    @TempDir
    Path temporaryDirectory;

    @Test
    void externalKeyMustBeConfiguredAndReadableBeforeConnecting() throws Exception {
        var service = new ServerCapacityServiceImpl(null, null);
        var keyField = ServerCapacityServiceImpl.class.getDeclaredField("pemFileName");
        keyField.setAccessible(true);
        var collect = ServerCapacityServiceImpl.class.getDeclaredMethod(
            "getServerCapacityFromSsh",
            ServerConfigDTO.class
        );
        collect.setAccessible(true);
        for (String path : new String[] {
            "",
            temporaryDirectory.resolve("missing.key").toString(),
        }) {
            keyField.set(service, path);
            var error = assertThrows(InvocationTargetException.class, () ->
                collect.invoke(service, new ServerConfigDTO())
            );
            assertInstanceOf(IllegalArgumentException.class, error.getCause());
        }
    }
}
