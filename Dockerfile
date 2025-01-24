# Base Image
FROM node:14

WORKDIR /usr/src/app

# Copy both package files into the root of the working dir
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the website into the contianer
COPY . .

# Use a build argument to set the port via the environment variable
ARG PORT=5000
ENV PORT=${PORT}

EXPOSE ${PORT}

CMD [ "node", "server.js" ]