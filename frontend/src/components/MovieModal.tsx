import { useState, useEffect } from 'react';
import { MovieDetails, Rating } from '../types';
import { movieApi } from '../api';
import './MovieModal.css';

interface MovieModalProps {
  movie: MovieDetails;
  onClose: () => void;
  loading: boolean;
}

function MovieModal({ movie, onClose, loading }: MovieModalProps) {
  const [userRating, setUserRating] = useState<Rating | null>(null);
  const [ratingValue, setRatingValue] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadUserRating();
  }, [movie.id]);

  const loadUserRating = async () => {
    try {
      const rating = await movieApi.getRatingByTmdbId(movie.id);
      setUserRating(rating);
      if (rating) {
        setRatingValue(rating.rating);
      }
    } catch (err) {
      console.error('Failed to load rating:', err);
    }
  };

  const handleRate = async () => {
    if (ratingValue < 1 || ratingValue > 5) {
      setError('Please select a rating between 1 and 5');
      return;
    }

    setSaving(true);
    setError('');

    try {
      if (userRating) {
        await movieApi.updateRating(userRating.id, { rating: ratingValue });
      } else {
        await movieApi.addRating({
          tmdb_id: movie.id,
          title: movie.title,
          poster_path: movie.poster_path,
          rating: ratingValue,
        });
      }
      await loadUserRating();
      setIsEditing(false);
    } catch (err) {
      setError('Failed to save rating. Please try again.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRating = async () => {
    if (!userRating) return;

    if (!confirm('Are you sure you want to delete this rating?')) return;

    setSaving(true);
    setError('');

    try {
      await movieApi.deleteRating(userRating.id);
      setUserRating(null);
      setRatingValue(0);
      setIsEditing(false);
    } catch (err) {
      setError('Failed to delete rating. Please try again.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : 'https://via.placeholder.com/500x750?text=No+Poster';

  const cast = movie.credits?.cast?.slice(0, 5) || [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          ×
        </button>

        {loading ? (
          <div className="modal-loading">Loading...</div>
        ) : (
          <>
            <div className="modal-header">
              <img src={posterUrl} alt={movie.title} className="modal-poster" />
              <div className="modal-info">
                <h2 className="modal-title">{movie.title}</h2>
                <p className="modal-release-date">
                  Release Date: {movie.release_date || 'N/A'}
                </p>
                <div className="modal-rating-section">
                  {userRating && !isEditing ? (
                    <div className="user-rating-display">
                      <span className="rating-label">Your Rating:</span>
                      <span className="rating-value">{userRating.rating}/5</span>
                      <button
                        className="edit-rating-button"
                        onClick={() => setIsEditing(true)}
                      >
                        Edit
                      </button>
                      <button
                        className="delete-rating-button"
                        onClick={handleDeleteRating}
                      >
                        Delete
                      </button>
                    </div>
                  ) : (
                    <div className="rating-input">
                      <span className="rating-label">Rate this movie:</span>
                      <div className="rating-stars">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            className={`star-button ${star <= ratingValue ? 'active' : ''}`}
                            onClick={() => setRatingValue(star)}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                      <button
                        className="save-rating-button"
                        onClick={handleRate}
                        disabled={saving}
                      >
                        {saving ? 'Saving...' : 'Save Rating'}
                      </button>
                      {userRating && (
                        <button
                          className="cancel-button"
                          onClick={() => {
                            setIsEditing(false);
                            setRatingValue(userRating.rating);
                          }}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-body">
              <div className="modal-section">
                <h3 className="section-title">Synopsis</h3>
                <p className="modal-overview">{movie.overview || 'No synopsis available.'}</p>
              </div>

              {cast.length > 0 && (
                <div className="modal-section">
                  <h3 className="section-title">Cast</h3>
                  <div className="cast-list">
                    {cast.map((actor) => (
                      <div key={actor.id} className="cast-member">
                        <span className="actor-name">{actor.name}</span>
                        <span className="character-name">as {actor.character}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {error && <div className="modal-error">{error}</div>}
          </>
        )}
      </div>
    </div>
  );
}

export default MovieModal;
