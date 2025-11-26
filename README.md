# Automated Timetable Scheduler

A comprehensive Java-based timetable scheduling system that uses **OptaPlanner** for constraint-based optimization to generate conflict-free academic schedules.

[![Java](https://img.shields.io/badge/Java-11+-orange.svg)](https://openjdk.java.net/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-2.x-green.svg)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![License](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)

## Features

- **Constraint-Based Optimization** — Leverages OptaPlanner to solve complex scheduling problems with hard and soft constraints
- **Conflict-Free Schedules** — Automatically avoids overlapping sessions for faculty, rooms, and student batches
- **Balanced Faculty Workload** — Ensures equitable distribution of teaching hours
- **Flexible Room Management** — Supports lecture rooms, computer labs, hardware labs, and large seaters
- **Configurable Solver** — Adjust optimization parameters directly from the UI
- **CSV Data Management** — Upload, validate, preview, and manage scheduling data with real-time analytics
- **Modern Web Interface** — React-based frontend with responsive design

## Quick Start

### Prerequisites

| Tool | Version | Check Command |
|------|---------|---------------|
| Java JDK | 11+ | `java -version` |
| Maven | 3.6+ | `mvn -version` |
| Node.js | 14+ | `node -version` |

### Installation

```bash
git clone https://github.com/shivsegv/automated-timetable-scheduler.git
cd automated-timetable-scheduler
chmod +x start.sh
./start.sh
```

The script will automatically check prerequisites, install dependencies, and start both servers.

### Access Points

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8080 |

Press `Ctrl+C` to stop both servers.

## Project Structure

```
automated-timetable-scheduler/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── services/         # API service layer
│   │   └── utils/            # Utility functions
│   └── package.json
├── src/main/java/            # Spring Boot backend
│   └── com/timetable/
│       ├── controller/       # REST API controllers
│       ├── domain/           # Domain entities
│       ├── score/            # OptaPlanner constraints
│       ├── service/          # Business logic
│       └── util/             # Utilities
├── src/main/resources/       # Application configuration
├── *.csv                     # Sample data files
├── pom.xml                   # Maven configuration
└── start.sh                  # Quick start script
```

## Data Files

The project uses CSV files for input data:

| File | Description |
|------|-------------|
| `courses.csv` | Course definitions with faculty assignments |
| `faculty.csv` | Faculty members and details |
| `batches.csv` | Student batch information |
| `rooms.csv` | Room details and capacities |
| `minor.csv` | Minor course information |

## Solver Configuration

Configure OptaPlanner parameters directly from the dashboard:

1. Open the Dashboard at `http://localhost:3000`
2. Click **"Configure Solver"** to expand settings
3. Adjust parameters (time limits, termination conditions)
4. Save configuration and generate timetable

| Parameter | Description | Recommended |
|-----------|-------------|-------------|
| Termination Minutes | Maximum solver runtime | 5-10 minutes |
| Termination Seconds | Additional seconds | 0-30 seconds |
| Unimproved Limit | Stop if no improvement | 120-300 seconds |

## API Endpoints

### Timetable Operations
- `POST /api/timetable/generate` — Generate optimized timetable
- `GET /api/timetable` — Get current timetable

### CSV Management
- `GET /api/{type}/metadata` — File metadata
- `GET /api/{type}/statistics` — Statistical analysis
- `GET /api/{type}/preview?rows=N` — Preview data
- `POST /api/{type}/validate` — Validate CSV
- `POST /api/{type}/upload` — Upload with validation
- `GET /api/{type}/download` — Download CSV

## Manual Setup

### Backend Only

```bash
mvn spring-boot:run
```

### Frontend Only

```bash
cd frontend
npm install
npm start
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Port 8080 in use | `lsof -ti:8080 \| xargs kill -9` |
| Port 3000 in use | `lsof -ti:3000 \| xargs kill -9` |
| npm install fails | Delete `frontend/node_modules` and retry |
| Maven build fails | Run `mvn clean` then retry |

## Tech Stack

- **Backend**: Java 11+, Spring Boot, OptaPlanner
- **Frontend**: React 18, Axios
- **Build**: Maven, npm
- **Data**: OpenCSV

## License

This project is licensed under the ISC License — see the [LICENSE](LICENSE) file for details.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request



