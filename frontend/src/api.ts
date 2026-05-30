import axios from 'axios';
import { MovieDetails, Rating, TMDBSearchResponse, GenresResponse, AuthResponse, LoginCredentials, RegisterCredentials, User } from './types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const movieApi = {
  searchMovies: async (query: string, page: number = 1, genre?: string, year?: string): Promise<TMDBSearchResponse> => {
    const response = await api.get('/api/search', { params: { query, page, genre, year } });
    return response.data;
  },

  getGenres: async (): Promise<GenresResponse> => {
    const response = await api.get('/api/genres');
    return response.data;
  },

  getMovieDetails: async (movieId: number): Promise<MovieDetails> => {
    const response = await api.get(`/api/movie/${movieId}`);
    return response.data;
  },

  getRatings: async (): Promise<Rating[]> => {
    const response = await api.get('/api/ratings');
    return response.data;
  },

  addRating: async (rating: Omit<Rating, 'id'>): Promise<Rating> => {
    const response = await api.post('/api/ratings', rating);
    return response.data;
  },

  updateRating: async (ratingId: number, rating: Partial<Rating>): Promise<Rating> => {
    const response = await api.put(`/api/ratings/${ratingId}`, rating);
    return response.data;
  },

  deleteRating: async (ratingId: number): Promise<void> => {
    await api.delete(`/api/ratings/${ratingId}`);
  },

  getRatingByTmdbId: async (tmdbId: number): Promise<Rating | null> => {
    const response = await api.get(`/api/ratings/tmdb/${tmdbId}`);
    return response.data;
  },

  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post('/api/auth/login', credentials);
    return response.data;
  },

  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    const response = await api.post('/api/auth/register', credentials);
    return response.data;
  },

  getCurrentUser: async (token: string): Promise<User> => {
    const response = await api.get('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },
};

// Add token to axios interceptors
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
