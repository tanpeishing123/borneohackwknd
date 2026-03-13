# 使用官方 Python 镜像
FROM python:3.10-slim

# 安装 Tesseract 及其依赖
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    libtesseract-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 设置工作目录
WORKDIR /app

# 复制依赖文件并安装
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制所有代码
COPY . .

# 运行你的 FastAPI 项目 (确保端口和 main.py 路径对齐)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "10000"]