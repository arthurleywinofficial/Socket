FROM python:3.11-slim

WORKDIR /app

# PostgreSQL C bağımlılıkları ve genel araçlar derleme için kurulur
RUN apt-get update && apt-get install -y gcc libpq-dev && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Uygulama kodları docker-compose üzerinden volume olarak bağlanacak. Bu lokal Geliştirme(Dev) Ortamı için mükemmeldir.
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
