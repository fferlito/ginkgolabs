# Mushroompedia API - Railway-ready Dockerfile
# Railway sets PORT at runtime; use that URL as VITE_API_URL in the frontend app.
# Build context must be the backend directory (so COPY . . includes data/).
FROM python:3.12-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Application and data (data/ is included when context is backend/)
COPY . .

# PORT is set by Railway at runtime; default 8000 for local runs
ENV PORT=8000
EXPOSE 8000

# Entrypoint reads PORT from env; JSON CMD for proper signal handling
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
