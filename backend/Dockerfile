FROM python:3.8-slim-buster
WORKDIR /src/backend

# install deps
COPY requirements.txt requirements.txt
RUN pip3 install -r requirements.txt
COPY . .

# Setup env
ENV PORT=443
ENV FLASK_ENV=development
ENV FLASK_APP=flaskr/app.py
ENV FLASK_RUN_PORT=443

# Run service
EXPOSE 443
EXPOSE 5000
CMD ["flask","run", "--host", "0.0.0.0"]