FROM registry.access.redhat.com/ubi8/openjdk-17:1.14

# Set working directory
WORKDIR /work/

# Copy the application files
COPY target/*-runner /work/application

# Expose port
EXPOSE 8080

# Run the application
ENTRYPOINT ["./application", "-Dquarkus.http.host=0.0.0.0"]