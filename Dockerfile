FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY dist/ dist/
COPY public/ public/
EXPOSE 3100
ENV PORT=3100
CMD ["node", "dist/index.js"]
