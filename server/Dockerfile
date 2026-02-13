# Use lightweight Node image
FROM node:18-alpine

# Create app directory inside container
WORKDIR /app

# Copy package files first (for better caching)
COPY package*.json ./

# Install only production dependencies
RUN npm install --production

# Copy rest of the app
COPY . .

# Expose app port
EXPOSE 5000

# Start the server
CMD ["node", "server.js"]
