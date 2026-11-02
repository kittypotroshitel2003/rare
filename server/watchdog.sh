#!/bin/bash
# Поднимает rare-leads, если он не запущен. Запускается из cron пользователя deploy:
#   * * * * * /home/deploy/rare-leads/watchdog.sh >/dev/null 2>&1
#   @reboot   /home/deploy/rare-leads/watchdog.sh >/dev/null 2>&1
DIR="/home/deploy/rare-leads"
PIDFILE="$DIR/rare-leads.pid"
LOGFILE="$DIR/rare-leads.log"

if [ -f "$PIDFILE" ] && kill -0 "$(cat "$PIDFILE" 2>/dev/null)" 2>/dev/null; then
  exit 0
fi

cd "$DIR" || exit 1
set -a
. ./.env
set +a
nohup /usr/bin/python3 -I rare-leads.py >> "$LOGFILE" 2>&1 &
echo $! > "$PIDFILE"
