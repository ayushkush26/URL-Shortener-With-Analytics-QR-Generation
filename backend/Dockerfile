# 1 Use a lightweight Node.js base image
FROM node:18-alpine

# 2 Set working directory inside the container
WORKDIR /app

# 3 Copy package files first to install dependencies
COPY package*.json ./

# 4 Install only production dependencies
RUN npm ci --only=production

# 5 Copy all remaining backend source code
COPY . .

# 6 Set environment variable
ENV NODE_ENV=production

# 7 Expose backend port
EXPOSE 5000

# 8 Run the app
CMD ["node", "server.js"]


