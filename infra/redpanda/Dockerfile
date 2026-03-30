FROM docker.redpanda.com/redpandadata/redpanda:v25.1.2

CMD ["sh", "-c", "redpanda start --mode dev-container --smp 1 --memory 1G --reserve-memory 0M --node-id 0 --check=false --kafka-addr internal://0.0.0.0:${PORT:-9092} --advertise-kafka-addr internal://${RENDER_SERVICE_NAME:-interviewflow-redpanda}:${PORT:-9092}"]
