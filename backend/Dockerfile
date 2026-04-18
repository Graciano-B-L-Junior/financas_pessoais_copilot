FROM python:3.11-slim
WORKDIR /app
ENV PYTHONUNBUFFERED=1
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh
ENTRYPOINT ["./entrypoint.sh"]
CMD ["gunicorn","financas_pessoais.wsgi:application","--bind","0.0.0.0:8000","--workers","3"]
