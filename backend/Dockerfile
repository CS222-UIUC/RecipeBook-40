FROM python:3.8-slim-buster
WORKDIR /src/backend

# install deps
COPY requirements.txt requirements.txt
RUN pip3 install -r requirements.txt
COPY . .

# Setup env
ENV PORT=443
ENV FLASK_ENV=development
ENV FLASK_APP=flaskr/__init__.py

# Run service
EXPOSE 443
CMD ["python3", "./flaskr/__init__.py"]