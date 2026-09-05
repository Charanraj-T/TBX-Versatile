FROM maven:3.9.9-eclipse-temurin-21-alpine AS builder

WORKDIR /build

COPY pom.xml .
RUN mvn dependency:go-offline -B || true

COPY src ./src
RUN mvn clean package -DskipTests -B

FROM eclipse-temurin:21-jre-alpine AS runner

WORKDIR /app

RUN addgroup -S finops && adduser -S finops -G finops

COPY --from=builder /build/target/*.jar app.jar

RUN chown -R finops:finops /app
USER finops

EXPOSE 8080

HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]

