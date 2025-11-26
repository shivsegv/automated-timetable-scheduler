#!/bin/bash

echo "=========================================="
echo "  Timetable Scheduler - Quick Start"
echo "=========================================="
echo ""

# Check if Java is installed
if ! command -v java &> /dev/null; then
    echo "[ERROR] Java is not installed. Please install Java 11 or higher."
    exit 1
fi

# Check if Maven is installed
if ! command -v mvn &> /dev/null; then
    echo "[ERROR] Maven is not installed. Please install Maven 3.6+."
    exit 1
fi

# Check if Node is installed
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed. Please install Node.js 14+."
    exit 1
fi

echo "[OK] All prerequisites found."
echo ""

# Install frontend dependencies if needed
if [ ! -d "frontend/node_modules" ]; then
    echo "[INFO] Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
    echo "[OK] Frontend dependencies installed."
    echo ""
fi

# Start backend
echo "[INFO] Starting backend server..."
echo "       URL: http://localhost:8080"
mvn spring-boot:run &
BACKEND_PID=$!
echo "       PID: $BACKEND_PID"
echo ""

# Wait for backend to start
echo "[INFO] Waiting for backend to initialize (15 seconds)..."
sleep 15

# Start frontend
echo "[INFO] Starting frontend server..."
echo "       URL: http://localhost:3000"
cd frontend
npm start &
FRONTEND_PID=$!
cd ..
echo "       PID: $FRONTEND_PID"
echo ""

echo "=========================================="
echo "  Application Started Successfully"
echo "=========================================="
echo ""
echo "  Backend:  http://localhost:8080"
echo "  Frontend: http://localhost:3000"
echo ""
echo "  Press Ctrl+C to stop both servers"
echo ""

# Cleanup function
cleanup() {
    echo ""
    echo "[INFO] Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "[OK] Servers stopped."
    exit 0
}

# Trap Ctrl+C
trap cleanup SIGINT SIGTERM

# Wait for user to stop
wait
