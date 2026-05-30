import { useState, useEffect } from 'react';
import { movieApi } from '../api';
import { Rating } from '../types';
import MovieCard from './MovieCard';
import MovieModal from './MovieModal';
import { MovieDetails } from '../types';
import './RatedMoviesPage.css';

function RatedMoviesPage() {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMovie, setSelectedMovie] = useState<MovieDetails | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    loadRatings();
  }, []);

  const loadRatings = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await movieApi.getRatings();
      setRatings(data);
    } catch (err) {
      setError('Failed to load rated movies. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMovieClick = async (rating: Rating) => {
    setModalLoading(true);
    setSelectedMovie(null);

    try {
      const details = await movieApi.getMovieDetails(rating.tmdb_id);
      setSelectedMovie(details);
    } catch (err) {
      console.error('Failed to fetch movie details:', err);
    } finally {
      setModalLoading(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedMovie(null);
  };

  if (loading) {
    return <div className="rated-page loading">Loading rated movies...</div>;
  }

  return (
    <div className="rated-page">
      <h1 className="page-title">Rated Movies</h1>

      {error && <div className="error-message">{error}</div>}

      {ratings.length === 0 ? (
        <div className="no-ratings">
          <p>You haven't rated any movies yet.</p>
          <a href="/" className="back-link">Go to search</a>
        </div>
      ) : (
        <div className="movies-grid">
          {ratings.map((rating) => (
            <div key={rating.id} className="rated-movie-card">
              <MovieCard
                movie={{
                  id: rating.tmdb_id,
                  title: rating.title,
                  poster_path: rating.poster_path,
                  release_date: '',
                  overview: '',
                  vote_average: 0,
                }}
                onClick={() => handleMovieClick(rating)}
              />
              <div className="user-rating-badge">
                Your rating: {rating.rating}/5
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedMovie && (
        <MovieModal
          movie={selectedMovie}
          onClose={handleCloseModal}
          loading={modalLoading}
        />
      )}
    </div>
  );
}

export default RatedMoviesPage;
