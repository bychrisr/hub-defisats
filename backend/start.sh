#!/bin/sh

# Configure tsconfig-paths
export TS_NODE_BASEURL=./dist
export TS_NODE_PROJECT=./tsconfig.json

# Start the application
exec node -r tsconfig-paths/register dist/index.js
