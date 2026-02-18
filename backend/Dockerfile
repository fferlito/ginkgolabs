# Mushroompedia API - Railway-ready Dockerfile
# Railway sets PORT at runtime; use that URL as VITE_API_URL in the frontend app.
FROM python:3.12-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Application and data
COPY . .
COPY data/ /app/data/

# PORT is set by Railway at runtime (e.g. 8000); default 8000 for local runs
ENV PORT=8000
EXPOSE 8000

# Run with host 0.0.0.0 so Railway can reach it
CMD sh -c "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"
