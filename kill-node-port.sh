#!/bin/bash

# Find the PID of the process running on port 3000
PID=$(lsof -t -i :3000)

# Check if a PID was found
if [ -z "$PID" ]; then
  echo "No process found on port 3000."
else
  echo "Killing process $PID on port 3000..."
  kill -9 $PID
  echo "Process $PID killed."
fi

