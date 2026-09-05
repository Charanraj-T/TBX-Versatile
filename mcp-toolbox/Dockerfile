FROM us-central1-docker.pkg.dev/database-toolbox/toolbox/toolbox:latest

COPY tools.yaml /app/tools.yaml

EXPOSE 5000

CMD ["--config", "/app/tools.yaml", "--address", "0.0.0.0", "--port", "5000"]