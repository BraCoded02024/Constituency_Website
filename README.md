# Constituency Management System

A premium, modern constituency management web platform for a Ghanaian Member of Parliament. Built with Next.js, Express.js, Tailwind CSS, and Framer Motion.

## Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS, Framer Motion
- **Backend:** Node.js, Express.js
- **Icons:** Lucide React

## Color Theme

Ghana national colors:
- Green `#006B3F`
- Gold `#FCD116`
- Red `#CE1126`
- Black `#111111`
- White `#FFFFFF`

## Pages

| Page | Route | Description |
|------|-------|-------------|
| Homepage | `/` | Hero section, stats, services, announcements, projects, success stories |
| Announcements | `/announcements` | Filterable announcements with categories |
| Opportunities | `/opportunities` | Training, grants, employment, volunteer opportunities |
| Projects | `/projects` | Project tracker with progress bars and details |
| Events | `/events` | Upcoming and past events with details |
| Gallery | `/gallery` | Photo gallery with lightbox and category filter |
| About MP | `/about` | MP profile, priorities, achievements, timeline |
| Register | `/register` | Constituent registration form |
| Submit Concern | `/concerns` | Concern/complaint submission form |
| Volunteer | `/volunteer` | Volunteer registration form |
| Admin Dashboard | `/admin` | Analytics, stats, concerns management, project tracking |

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

1. Clone the repository:
```bash
git clone <repo-url>
cd constituency_management_system
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Install frontend dependencies:
```bash
cd frontend
npm install
```

### Running the Application

1. Start the backend server:
```bash
cd backend
npm start
```
The API will be available at `http://localhost:5001`

2. Start the frontend dev server:
```bash
cd frontend
npm run dev
```
The app will be available at `http://localhost:3001`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/announcements` | Get all announcements |
| POST | `/api/announcements` | Create announcement |
| GET | `/api/opportunities` | Get all opportunities |
| POST | `/api/opportunities/:id/apply` | Apply for opportunity |
| GET | `/api/projects` | Get all projects |
| GET | `/api/events` | Get all events |
| GET | `/api/gallery` | Get gallery items |
| GET | `/api/gallery/stories` | Get success stories |
| POST | `/api/constituents` | Register constituent |
| POST | `/api/concerns` | Submit concern |
| POST | `/api/volunteers` | Register volunteer |
| GET | `/api/dashboard/stats` | Get dashboard statistics |
