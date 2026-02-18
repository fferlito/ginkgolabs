# Mushroompedia API - Railway-ready Dockerfile
# Railway sets PORT at runtime; use that URL as VITE_API_URL in the frontend app.
# Build context: repository root (paths below are relative to root).
FROM python:3.12-slim

WORKDIR /app

# Install dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Application, data, and entrypoint (all from backend/)
COPY backend/ .

# PORT is set by Railway at runtime; default 8000 for local runs
ENV PORT=8000
EXPOSE 8000

# Entrypoint reads PORT from env; JSON form for proper signal handling
RUN chmod +x /app/entrypoint.sh
ENTRYPOINT ["/app/entrypoint.sh"]
