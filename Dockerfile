FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN mkdir -p uploads/prescriptions logs
ENV PORT=3001
EXPOSE 3001
CMD ["node", "server.js"]
