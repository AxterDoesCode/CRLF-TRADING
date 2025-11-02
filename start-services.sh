#!/bin/bash

# Script to start all services in tmux panes

SESSION_NAME="crlf-services"

# Check if tmux session already exists
tmux has-session -t $SESSION_NAME 2>/dev/null

if [ $? == 0 ]; then
    echo "Session '$SESSION_NAME' already exists. Attaching..."
    tmux attach-session -t $SESSION_NAME
    exit 0
fi

# Create new tmux session with first pane running history_service
tmux new-session -d -s $SESSION_NAME -n services "make history_service"

# Split window horizontally and run trading_api
tmux split-window -h -t $SESSION_NAME:0 "make trading_api"

# Split the right pane vertically and run encoding_api
tmux split-window -v -t $SESSION_NAME:0.1 "make encoding_api"

# Attach to the session
tmux attach-session -t $SESSION_NAME
