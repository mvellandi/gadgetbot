#!/bin/bash

# Quick Logs Script
# View logs for production services

COMPOSE_FILE=~/gadgetbot/docker-compose.prod.yml

show_menu() {
    echo "GadgetBot Production Logs"
    echo "========================"
    echo ""
    echo "1) All services"
    echo "2) Application only"
    echo "3) Database only"
    echo "4) Zitadel only"
    echo "5) Exit"
    echo ""
}

view_logs() {
    local service=$1
    cd ~/gadgetbot

    if [ -z "$service" ]; then
        echo "Viewing all logs (Ctrl+C to exit)..."
        docker compose -f $COMPOSE_FILE logs -f
    else
        echo "Viewing $service logs (Ctrl+C to exit)..."
        docker compose -f $COMPOSE_FILE logs -f $service
    fi
}

# Main loop
while true; do
    show_menu
    read -p "Select option: " choice
    echo ""

    case $choice in
        1) view_logs ;;
        2) view_logs app ;;
        3) view_logs postgres ;;
        4) view_logs zitadel ;;
        5) exit 0 ;;
        *) echo "Invalid option. Please try again." ;;
    esac

    echo ""
    read -p "Press Enter to continue..."
    clear
done
