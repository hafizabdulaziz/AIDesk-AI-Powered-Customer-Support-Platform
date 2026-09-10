# Use a slim Python image
FROM python:3.13-slim

# Set working directory
WORKDIR /app

# Install system dependencies (for building some python packages)
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Set environment variables
ENV PYTHONPATH=/app/backend/src
ENV PORT=7860

# Expose the port Hugging Face Spaces uses
EXPOSE 7860

# Start the application
CMD ["gunicorn", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "backend.src.api.main:app", "--bind", "0.0.0.0:7860"]
