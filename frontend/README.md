# Timetable Scheduler - React Frontend

This is the React-based web UI for the Automated Timetable Scheduler.

## Features

- **Dashboard**: Overview of the system with statistics and quick access to generate timetables
- **Timetable View**: Interactive weekly schedule view with filtering options
- **Batch View**: View schedules by student batch
- **Faculty View**: View teaching schedules for each faculty member
- **Room View**: View room utilization schedules

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

The application will open in your browser at `http://localhost:3000`.

### Building for Production

To create a production build:

```bash
npm run build
```

The optimized build will be in the `build/` directory.

## API Integration

The frontend communicates with the Spring Boot backend running on `http://localhost:8080`. Make sure the backend server is running before starting the frontend.

## Available Endpoints

The frontend uses the following API endpoints:

- `GET /api/timetable` - Get the current timetable
- `POST /api/timetable/generate` - Generate a new timetable
- `GET /api/faculty` - Get all faculty members
- `GET /api/rooms` - Get all rooms
- `GET /api/batches` - Get all student batches
- `GET /api/courses` - Get all courses
- `GET /api/timetable/batch/:id` - Get timetable for a specific batch
- `GET /api/timetable/faculty/:id` - Get timetable for a specific faculty
- `GET /api/timetable/room/:id` - Get timetable for a specific room

## Technologies Used

- React 18
- React Router v6
- Axios for API calls
- CSS3 with responsive design
