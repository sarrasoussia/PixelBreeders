# Movie Search Application

A full-stack movie search application built with React + TypeScript (frontend) and Flask (backend), using The Movie Database (TMDB) API.

## Features

### Implemented Features

✅ **Main Page**
- Search bar for searching movies via TMDB API
- Results listing with movie posters and titles
- Loading states during API calls
- Click on movie to open detail modal

✅ **Movie Detail Modal**
- Displays movie synopsis
- Shows release date
- Lists cast members (top 5)
- Rating system (1-5 stars)
- Add new rating if not yet rated
- Edit existing rating
- Delete existing rating
- Close button

✅ **Rated Movies Page**
- Lists all movies the user has rated
- Shows movie title, poster, and user score
- Click on movie to open detail modal
- Empty state with link to search page

✅ **Technical Features**
- Full TypeScript implementation
- RESTful API endpoints
- SQLite database for storing ratings
- Docker containerization
- Error handling throughout the application
- Responsive design
- Loading states for all async operations

### Not Implemented Features

❌ **Pagination / Infinite Scroll** - Currently shows first page of results only
❌ **Filter by Genre or Year** - Basic search only
❌ **Authentication** - No user authentication system
❌ **Cache Implementation** - No caching layer

## Tech Stack

- **Frontend**: React 18 + TypeScript, Vite
- **Backend**: Flask (Python), Flask-SQLAlchemy
- **Database**: SQLite
- **API**: The Movie Database (TMDB) API
- **Infrastructure**: Docker, Docker Compose
- **HTTP Client**: Axios

## Prerequisites

- Docker and Docker Compose installed
- TMDB API key (free from [themoviedb.org](https://www.themoviedb.org/))

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd pixelsBreeders
```

### 2. Get TMDB API Key

1. Go to [themoviedb.org](https://www.themoviedb.org/)
2. Sign up for a free account
3. Go to Settings > API
4. Create a new API key
5. Copy your API key

### 3. Configure Environment Variables

```bash
cp .env.example .env
```

Edit the `.env` file and add your TMDB API key:

```
TMDB_API_KEY=your_actual_api_key_here
```

### 4. Run with Docker (Single Command)

```bash
docker-compose up --build
```

This will:
- Build the backend and frontend Docker images
- Start both services
- Make the application available at http://localhost:3000

### 5. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Running Locally (Without Docker)

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Add your TMDB API key to .env
python app.py
```

Backend will run on http://localhost:5000

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend will run on http://localhost:3000

## API Endpoints

### Movie Search
- `GET /api/search?query={query}&page={page}` - Search movies via TMDB

### Movie Details
- `GET /api/movie/{movie_id}` - Get detailed movie information including cast

### Ratings
- `GET /api/ratings` - Get all user ratings
- `POST /api/ratings` - Add a new rating
- `PUT /api/ratings/{rating_id}` - Update an existing rating
- `DELETE /api/ratings/{rating_id}` - Delete a rating
- `GET /api/ratings/tmdb/{tmdb_id}` - Get rating by TMDB movie ID

### Health Check
- `GET /health` - Health check endpoint

## Project Structure

```
pixelsBreeders/
├── backend/
│   ├── app.py              # Flask application with API endpoints
│   ├── requirements.txt     # Python dependencies
│   ├── Dockerfile          # Backend Docker configuration
│   └── .env.example        # Environment variables template
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── SearchPage.tsx
│   │   │   ├── RatedMoviesPage.tsx
│   │   │   ├── MovieCard.tsx
│   │   │   └── MovieModal.tsx
│   │   ├── App.tsx         # Main App component
│   │   ├── main.tsx        # Entry point
│   │   ├── api.ts          # API client
│   │   ├── types.ts        # TypeScript type definitions
│   │   └── *.css           # Component styles
│   ├── package.json        # Node dependencies
│   ├── vite.config.ts      # Vite configuration
│   ├── tsconfig.json       # TypeScript configuration
│   └── Dockerfile          # Frontend Docker configuration
├── docker-compose.yml      # Docker Compose configuration
├── .env.example            # Environment variables template
└── README.md               # This file
```

## AI Tool Usage

This project was built with assistance from AI tools (Cascade/Cursor). AI was used for:
- Generating initial project structure
- Writing boilerplate code for React components
- Setting up Docker configuration
- Writing API endpoints

All code has been reviewed and understood. The technical decisions made include:
- **Flask over Django**: Chosen for simplicity and faster development time for this scope
- **SQLite over PostgreSQL**: Chosen for simplicity and zero configuration requirements
- **Vite over Create React App**: Chosen for faster build times and modern tooling
- **TypeScript**: Chosen for type safety and better developer experience
- **Axios over fetch**: Chosen for better error handling and request/response interceptors

## Testing

To test the application:

1. Start the application with `docker-compose up --build`
2. Navigate to http://localhost:3000
3. Search for a movie (e.g., "Inception")
4. Click on a movie to view details
5. Rate the movie (1-5 stars)
6. Navigate to "Rated Movies" to see your ratings
7. Edit or delete ratings from the modal

## Troubleshooting

### Backend won't start
- Ensure TMDB API key is correctly set in `.env` file
- Check that port 5000 is not already in use

### Frontend can't connect to backend
- Ensure backend is running before starting frontend
- Check Docker network configuration
- Verify API URL in frontend environment variables

### Docker build fails
- Ensure Docker and Docker Compose are properly installed
- Check for sufficient disk space
- Try removing old images: `docker system prune -a`

## License

This project was created as an internship test for Pixel Breeders.

## Contact

For questions about this project, please contact through the internship application process.
# PixelBreeders
