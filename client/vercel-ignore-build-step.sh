#!/bin/bash
# Этот скрипт предотвращает выполнение команд из корневого package.json
echo "✅ Ignoring build step from root package.json"
exit 0 