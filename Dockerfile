FROM python:3.10-slim

WORKDIR /app

# Install system dependencies for opencv-python-headless
RUN apt-get update && \
    apt-get install -y --no-install-recommends libgl1 libglib2.0-0 && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY image_transformer.py server.py ./
COPY web/ web/
COPY images/ images/

EXPOSE 4040

CMD ["python", "server.py"]
