FROM nginx
WORKDIR /etc/nginx/conf.d
COPY ./conf .
EXPOSE 80
CMD ["nginx", "-c", "./conf.d/dev.conf"]