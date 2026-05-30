import { useState, useEffect } from 'react';
import { movieApi } from '../api';
import { Movie, MovieDetails, Genre } from '../types';
import MovieCard from './MovieCard';
import MovieModal from './MovieModal';
import './SearchPage.css';

function SearchPage() {
  const [query, setQuery] = useState('');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedMovie, setSelectedMovie] = useState<MovieDetails | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  useEffect(() => {
    const loadGenres = async () => {
      try {
        const response = await movieApi.getGenres();
        setGenres(response.genres);
      } catch (err) {
        console.error('Failed to load genres:', err);
      }
    };
    loadGenres();
  }, []);

  const handleSearch = async (e: React.FormEvent, page: number = 1) => {
    e.preventDefault();
    if (!query.trim()) return;

    console.log('Searching for:', query, 'Page:', page, 'Genre:', selectedGenre, 'Year:', selectedYear);
    setLoading(true);
    setError('');
    if (page === 1) {
      setMovies([]);
    }

    try {
      const response = await movieApi.searchMovies(query, page, selectedGenre, selectedYear);
      console.log('Search response:', response);
      console.log('Movies found:', response.results.length);
      
      if (page === 1) {
        setMovies(response.results);
      } else {
        setMovies(prev => [...prev, ...response.results]);
      }
      
      setTotalPages(response.total_pages);
      setCurrentPage(page);
    } catch (err) {
      setError('Failed to search movies. Please try again.');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMovieClick = async (movie: Movie) => {
    setModalLoading(true);
    setSelectedMovie(null);

    try {
      const details = await movieApi.getMovieDetails(movie.id);
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

  const handleLoadMore = () => {
    if (currentPage < totalPages && !loading) {
      handleSearch({ preventDefault: () => {} } as React.FormEvent, currentPage + 1);
    }
  };

  return (
    <div className="search-page">
      <div className="search-container">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for movies..."
            className="search-input"
          />
          <select
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
            className="filter-select"
          >
            <option value="">All Genres</option>
            {genres.map((genre) => (
              <option key={genre.id} value={genre.id.toString()}>
                {genre.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            placeholder="Year"
            className="year-input"
            min="1900"
            max={new Date().getFullYear()}
          />
          <button type="submit" className="search-button" disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="movies-grid">
        {movies.map((movie) => (
          <MovieCard
            key={movie.id}
            movie={movie}
            onClick={() => handleMovieClick(movie)}
          />
        ))}
      </div>

      {movies.length > 0 && currentPage < totalPages && (
        <div className="load-more-container">
          <button
            className="load-more-button"
            onClick={handleLoadMore}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
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

export default SearchPage;
