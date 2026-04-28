FROM python:3.11-slim

WORKDIR /app

RUN pip install --no-cache-dir flask requests

COPY app.py .
COPY templates/ templates/

ENV COMMAND_CENTER_URL=http://localhost:5000
ENV COMMAND_CENTER_PORT=5000

EXPOSE 5000

CMD ["python", "app.py"]
