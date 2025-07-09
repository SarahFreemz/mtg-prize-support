FROM node:14

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json ./
COPY package-lock.json ./

# Install dependencies
RUN npm install

# Copy the source code
COPY src ./src

# Install clasp globally
RUN npm install -g @google/clasp

# Expose the necessary port (if applicable)
EXPOSE 8080

# Command to run the application
CMD ["clasp", "run"]