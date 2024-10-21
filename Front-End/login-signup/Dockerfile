FROM node:18
WORKDIR /src/webapp
COPY package*.json ./
RUN npm install
COPY . .

# Proper setup for polling
ENV PORT=3000
ENV CHOKIDAR_USEPOLLING=true 

# Run service
EXPOSE 3000
CMD ["npm", "run", "start"]