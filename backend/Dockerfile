# Backend-only context: docker build -f backend/Dockerfile backend
FROM eclipse-temurin:17-jdk-jammy AS build
WORKDIR /workspace
COPY . ./
RUN chmod +x gradlew \
    && ./gradlew --no-daemon bootJar \
    && cp "$(find build/libs -maxdepth 1 -name '*.jar' ! -name '*-plain.jar')" /tmp/app.jar

FROM eclipse-temurin:17-jre-jammy
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --uid 10001 --user-group --no-create-home app \
    && mkdir -p /app/uploads \
    && chown app:app /app/uploads
WORKDIR /app
COPY --from=build /tmp/app.jar /app/app.jar
USER app
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
