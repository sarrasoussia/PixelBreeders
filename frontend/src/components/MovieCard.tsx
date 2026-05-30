import { Movie } from '../types';
import './MovieCard.css';

interface MovieCardProps {
  movie: Movie;
  onClick: () => void;
}

function MovieCard({ movie, onClick }: MovieCardProps) {
  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : 'https://via.placeholder.com/500x750?text=No+Poster';

  return (
    <div className="movie-card" onClick={onClick}>
      <img
        src={posterUrl}
        alt={movie.title}
        className="movie-poster"
        loading="lazy"
      />
      <div className="movie-info">
        <h3 className="movie-title">{movie.title}</h3>
        <p className="movie-year">
          {movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'}
        </p>
      </div>
    </div>
  );
}

export default MovieCard;
