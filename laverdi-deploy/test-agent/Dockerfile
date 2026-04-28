FROM python:3.11-slim

WORKDIR /app

RUN pip install --no-cache-dir flask requests

COPY app.py .

ENV AGENT_ID=test-agent-1
ENV COMMAND_CENTER_URL=http://command-center:5000
ENV AGENT_HOST=test-agent
ENV AGENT_PORT=5001

EXPOSE 5001

CMD ["python", "app.py"]
