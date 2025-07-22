# Mental Health chat

This project is a mental health support platform designed for athletes, built for the Comité National Olympique Tunisien (CNOT). It provides tools to help users build confidence, manage emotional pressure, and improve mental well-being before, during, and after competitions.

## Features

- **Speech-to-Text**: Converts spoken input to text using advanced models.
- **Emotion Detection**: Analyzes speech to detect emotional states.
- **AI Chat Assistant**: Offers supportive, motivational responses tailored for athletes.
- **Two Frontends**: Choose between a modern React-based frontend or a simple static HTML/CSS/JS frontend.

## Project Structure

```
mental-health-repo/
  backend/         # Python Flask API and ML models
  frontend/        # React + Vite + Tailwind frontend
  NEW_frontend/    # Simple HTML/CSS/JS frontend
  requirements.txt # Python dependencies
```

## How to Run

### 1. Backend (API & Models)

1. Install Python dependencies:
   ```sh
   pip install -r requirements.txt
   ```
2. Start the Flask API:
   ```sh
   cd backend
   python api.py
   ```

### 2. Frontend Options

#### Option 1: Modern React Frontend

1. Install Node.js dependencies:
   ```sh
   cd frontend
   npm install
   ```
2. Start the development server:
   ```sh
   npm run dev
   ```
3. Open your browser at [http://localhost:5173](http://localhost:5173) (default Vite port).

#### Option 2: Simple Static Frontend

1. Open `NEW_frontend/index.html` directly in your browser.
2. No build step or dependencies required.

## Notes

- The backend must be running for both frontends to function fully.
- The React frontend offers a richer, more interactive experience.
- The static frontend is lightweight and easy to deploy anywhere.

---

For more details, see [frontend/README.md](frontend/README.md)
