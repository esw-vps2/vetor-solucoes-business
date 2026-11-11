FROM python:3.13-slim

RUN apt-get update && apt-get install -y curl unzip && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY pyproject.toml requirements.lock ./

RUN pip install --upgrade pip && \
    pip install uv uvicorn && \
    pip install -r requirements.lock --upgrade

COPY . .

EXPOSE 8000

CMD ["uvicorn", "src.app.server:app", "--host", "0.0.0.0", "--port", "8000"]
