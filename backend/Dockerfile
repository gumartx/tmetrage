FROM eclipse-temurin:25-jdk AS build
WORKDIR /app
COPY . .
RUN chmod +x mvnw
RUN ./mvnw clean package -DskipTests

FROM eclipse-temurin:25-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

RUN mkdir -p /app/uploads/avatars
RUN mkdir -p /app/uploads/covers

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]