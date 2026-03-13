# 1. 使用官方 Python 镜像
FROM python:3.10-slim

# 2. 安装 Tesseract 及其依赖
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    libtesseract-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 3. 先在根目录操作
WORKDIR /app

# 4. 复制并安装依赖（注意路径）
# 如果你的 requirements.txt 在根目录，就这样写：
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 5. 复制所有代码到 /app
COPY . .

# 6. 【关键点】切换到后端文件夹运行程序
WORKDIR /app/src/backend

# 7. 运行 FastAPI
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "10000"]