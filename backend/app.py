from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import os
import requests
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from datetime import datetime, timedelta
import json
import hashlib

load_dotenv()

app = Flask(__name__)
CORS(app)

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///movies.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# TMDB API configuration
TMDB_API_KEY = os.getenv('TMDB_API_KEY')
TMDB_BASE_URL = 'https://api.themoviedb.org/3'

# JWT configuration
JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
JWT_EXPIRATION_HOURS = 24

# Simple in-memory cache
cache = {}
CACHE_TTL = 3600  # 1 hour in seconds

def get_cache_key(endpoint, params):
    """Generate a cache key from endpoint and parameters"""
    key_str = f"{endpoint}:{json.dumps(params, sort_keys=True)}"
    return hashlib.md5(key_str.encode()).hexdigest()

def get_from_cache(key):
    """Get value from cache if it exists and is not expired"""
    if key in cache:
        data, timestamp = cache[key]
        if datetime.utcnow().timestamp() - timestamp < CACHE_TTL:
            return data
        else:
            del cache[key]
    return None

def set_cache(key, value):
    """Set value in cache with current timestamp"""
    cache[key] = (value, datetime.utcnow().timestamp())

# Database Models
class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    ratings = db.relationship('Rating', backref='user', lazy=True)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'created_at': self.created_at.isoformat()
        }

class Rating(db.Model):
    __tablename__ = 'ratings'
    
    id = db.Column(db.Integer, primary_key=True)
    tmdb_id = db.Column(db.Integer, nullable=False)
    title = db.Column(db.String(255), nullable=False)
    poster_path = db.Column(db.String(255))
    rating = db.Column(db.Integer, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    __table_args__ = (db.UniqueConstraint('tmdb_id', 'user_id', name='unique_user_movie_rating'),)
    
    def to_dict(self):
        return {
            'id': self.id,
            'tmdb_id': self.tmdb_id,
            'title': self.title,
            'poster_path': self.poster_path,
            'rating': self.rating,
            'user_id': self.user_id
        }

# Initialize database
with app.app_context():
    db.create_all()

# TMDB API helper functions
def tmdb_request(endpoint, params=None):
    """Make a request to TMDB API with caching"""
    if params is None:
        params = {}
    params['api_key'] = TMDB_API_KEY
    
    # Check cache first
    cache_key = get_cache_key(endpoint, params)
    cached_data = get_from_cache(cache_key)
    if cached_data:
        return cached_data
    
    # Make API request
    response = requests.get(f'{TMDB_BASE_URL}{endpoint}', params=params)
    response.raise_for_status()
    data = response.json()
    
    # Cache the response
    set_cache(cache_key, data)
    
    return data

# Authentication helper functions
def generate_token(user_id):
    """Generate JWT token for user"""
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm='HS256')

def verify_token(token):
    """Verify JWT token and return user_id"""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=['HS256'])
        return payload['user_id']
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def auth_required(f):
    """Decorator to require authentication for endpoints"""
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'Authorization token required'}), 401
        
        # Remove 'Bearer ' prefix if present
        if token.startswith('Bearer '):
            token = token[7:]
        
        user_id = verify_token(token)
        if not user_id:
            return jsonify({'error': 'Invalid or expired token'}), 401
        
        request.user_id = user_id
        return f(*args, **kwargs)
    
    decorated_function.__name__ = f.__name__
    return decorated_function

# API Routes
@app.route('/api/auth/register', methods=['POST'])
def register():
    """Register a new user"""
    data = request.json
    
    if not all(k in data for k in ['username', 'email', 'password']):
        return jsonify({'error': 'Missing required fields'}), 400
    
    if len(data['password']) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400
    
    # Check if username or email already exists
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already exists'}), 400
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 400
    
    user = User(username=data['username'], email=data['email'])
    user.set_password(data['password'])
    
    db.session.add(user)
    db.session.commit()
    
    token = generate_token(user.id)
    
    return jsonify({
        'message': 'User registered successfully',
        'token': token,
        'user': user.to_dict()
    }), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Login user"""
    data = request.json
    
    if not all(k in data for k in ['username', 'password']):
        return jsonify({'error': 'Missing required fields'}), 400
    
    user = User.query.filter_by(username=data['username']).first()
    
    if not user or not user.check_password(data['password']):
        return jsonify({'error': 'Invalid username or password'}), 401
    
    token = generate_token(user.id)
    
    return jsonify({
        'message': 'Login successful',
        'token': token,
        'user': user.to_dict()
    })

@app.route('/api/auth/me', methods=['GET'])
@auth_required
def get_current_user():
    """Get current user information"""
    user = User.query.get(request.user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify(user.to_dict())

@app.route('/api/search', methods=['GET'])
def search_movies():
    """Search for movies using TMDB API"""
    query = request.args.get('query')
    page = request.args.get('page', 1, type=int)
    genre = request.args.get('genre')
    year = request.args.get('year')
    
    if not query:
        return jsonify({'error': 'Query parameter is required'}), 400
    
    try:
        params = {'query': query, 'page': page}
        if genre:
            params['with_genres'] = genre
        if year:
            params['year'] = year
        data = tmdb_request('/search/movie', params)
        return jsonify(data)
    except requests.RequestException as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/genres', methods=['GET'])
def get_genres():
    """Get list of movie genres from TMDB"""
    try:
        data = tmdb_request('/genre/movie/list')
        return jsonify(data)
    except requests.RequestException as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/movie/<int:movie_id>', methods=['GET'])
def get_movie_details(movie_id):
    """Get detailed information about a movie"""
    try:
        movie_data = tmdb_request(f'/movie/{movie_id}', {'append_to_response': 'credits'})
        return jsonify(movie_data)
    except requests.RequestException as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ratings', methods=['GET'])
@auth_required
def get_ratings():
    """Get all user ratings"""
    ratings = Rating.query.filter_by(user_id=request.user_id).all()
    return jsonify([rating.to_dict() for rating in ratings])

@app.route('/api/ratings', methods=['POST'])
@auth_required
def add_rating():
    """Add a new rating"""
    data = request.json
    
    if not all(k in data for k in ['tmdb_id', 'title', 'rating']):
        return jsonify({'error': 'Missing required fields'}), 400
    
    if not 1 <= data['rating'] <= 5:
        return jsonify({'error': 'Rating must be between 1 and 5'}), 400
    
    # Check if rating already exists for this user
    existing = Rating.query.filter_by(tmdb_id=data['tmdb_id'], user_id=request.user_id).first()
    if existing:
        return jsonify({'error': 'Movie already rated'}), 400
    
    rating = Rating(
        tmdb_id=data['tmdb_id'],
        title=data['title'],
        poster_path=data.get('poster_path'),
        rating=data['rating'],
        user_id=request.user_id
    )
    
    db.session.add(rating)
    db.session.commit()
    
    return jsonify(rating.to_dict()), 201

@app.route('/api/ratings/<int:rating_id>', methods=['PUT'])
@auth_required
def update_rating(rating_id):
    """Update an existing rating"""
    rating = Rating.query.filter_by(id=rating_id, user_id=request.user_id).first()
    if not rating:
        return jsonify({'error': 'Rating not found'}), 404
    
    data = request.json
    
    if 'rating' in data:
        if not 1 <= data['rating'] <= 5:
            return jsonify({'error': 'Rating must be between 1 and 5'}), 400
        rating.rating = data['rating']
    
    if 'title' in data:
        rating.title = data['title']
    
    if 'poster_path' in data:
        rating.poster_path = data['poster_path']
    
    db.session.commit()
    
    return jsonify(rating.to_dict())

@app.route('/api/ratings/<int:rating_id>', methods=['DELETE'])
@auth_required
def delete_rating(rating_id):
    """Delete a rating"""
    rating = Rating.query.filter_by(id=rating_id, user_id=request.user_id).first()
    if not rating:
        return jsonify({'error': 'Rating not found'}), 404
    
    db.session.delete(rating)
    db.session.commit()
    
    return jsonify({'message': 'Rating deleted successfully'})

@app.route('/api/ratings/tmdb/<int:tmdb_id>', methods=['GET'])
@auth_required
def get_rating_by_tmdb_id(tmdb_id):
    """Get rating by TMDB movie ID for current user"""
    rating = Rating.query.filter_by(tmdb_id=tmdb_id, user_id=request.user_id).first()
    if rating:
        return jsonify(rating.to_dict())
    return jsonify(None)

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
