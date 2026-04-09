#!/bin/bash
DIR="$(cd "$(dirname "$0")" && pwd)"

echo "🚀 Arrancando CRM Inmobiliaria..."

# Matar procesos anteriores si existen
kill $(lsof -ti:4000) 2>/dev/null
kill $(lsof -ti:5173) 2>/dev/null
sleep 1

# Backend
cd "$DIR/backend"
node server.js &
BACKEND_PID=$!
echo "✅ Backend iniciado (PID $BACKEND_PID) → http://localhost:4000"

# Esperar a que arranque
sleep 2

# Frontend
cd "$DIR/frontend"
npm run dev &
FRONTEND_PID=$!
echo "✅ Frontend iniciado (PID $FRONTEND_PID) → http://localhost:5173"

echo ""
echo "================================================"
echo "  CRM listo en: http://localhost:5173"
echo "  Usuario:      admin@agencia.com"
echo "  Contraseña:   Admin1234!"
echo "================================================"
echo ""
echo "Pulsa Ctrl+C para detener ambos servidores."

# Esperar y capturar Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'Servidores detenidos.'; exit" INT TERM
wait
