#!/bin/bash

# Deploy script for Render
# This script runs database migrations before starting the server

echo "Running database migrations..."
npm run db:push

echo "Starting server..."
npm run start
