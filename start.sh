#!/bin/bash

# Navigate to the client directory and start the client
echo "Starting client..."
cd client && npm run dev &

# Navigate to the API directory and start the API
echo "Starting API..."
cd ./api && nodemon app.js &

# Navigate to the socket directory and start the socket server
echo "Starting socket..."
cd ./socket && nodemon app.js &

echo "All services are up and running."
