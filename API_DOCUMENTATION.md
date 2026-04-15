# 🚀 Adaptive LearnVault: API & Feature Documentation

This document provides a detailed technical overview of the backend system, its endpoints, and the core features implemented during the migration to MongoDB.

---

## 🛠 Core Features

### 1. MongoDB Async Persistence
The backend has been migrated from a synchronous SQL architecture to an asynchronous NoSQL architecture.
- **Driver**: [Motor](https://motor.readthedocs.io/) (Async MongoDB driver).
- **Storage Strategy**: Data is stored in collections within a `learnvault` database.
- **ID Handling**: Supports both traditional string IDs and MongoDB `ObjectId` types via a custom `PyObjectId` Pydantic helper.

### 2. Simplified Security Model
As requested, the security layer has been simplified for rapid development:
- **Plain-text Passwords**: Hashing (bcrypt) has been removed. Passwords are stored and verified as raw strings.
- **JWT Authentication**: Still uses JSON Web Tokens for session management.
- **Stateless Auth**: The server remains stateless, requiring a Bearer token for protected resources.

### 3. Adaptive Recommendation Engine
An intelligent service that suggests content based on the student's level.
- **Scoring Logic**: `Score = (5 - |ContentDifficulty - UserLevelValue|) + RandomNoise`.
- **Filtering**: Automatically excludes content the user has already completed.
- **AI Rationale**: Integration with Google Gemini (if enabled) to generate a personalized "Why learn this?" message.

---

## 📡 API Endpoints Reference

### 🔐 Authentication (`/api/auth`)

#### `POST /register`
Creates a new user account.
- **Input**: `name`, `email`, `password`.
- **Behavior**: Checks for existing email, stores user in plain text, returns a JWT.

#### `POST /token`
交换用户凭据 (OAuth2 standard).
- **Input**: `username` (email), `password`.
- **Behavior**: Compares plain-text strings in MongoDB. Returns a `bearer` token.

---

### 👤 User Services (`/api/user`)

#### `GET /profile`
Retrieves the current user's profile.
- **Auth**: Required.
- **Data**: Returns name, level, streak, goals, and role.

#### `PUT /profile`
Updates user settings.
- **Behavior**: Allows dynamic updates of fields like `level`, `streak`, or `todayGoal`.

---

### 📚 Content Management (`/api/content`)

#### `GET /`
Lists all learning resources.
- **Filters**: Supports `topic` and `tag` query parameters.
- **Output**: Returns a list of `Content` objects with metadata (type, duration, difficulty).

#### `GET /{content_id}`
Fetch detailed metadata for a specific resource.
- **Handles**: Both classic integer-style IDs and MongoDB ObjectIds.

---

### 📈 Learning Activity (`/api/activity`)

#### `GET /`
Retrieves the user's learning stats.
- **Output**: Weekly hours (Monday-Sunday), completion rate, and XP progress.

#### `POST /record`
Logs time spent on learning.
- **Input**: `duration_minutes`, `day_label` (e.g., "Mon").
- **Behavior**: Atomically increments hours in the database using `$inc`.

---

### 🕸 Knowledge Graph (`/api/graph`)

#### `GET /data`
Serves the 3D Knowledge Graph.
- **Output**: An object containing `nodes` (concepts) and `edges` (relationships).
- **Visualization**: Designed for use with 3D force-directed graph libraries.

---

### 🎯 Recommendations (`/api/recommendations`)

#### `GET /`
Fetches personalized learning path.
- **Logic**: Ranks content based on difficulty proximity to the user's profile (`Beginner`, `Intermediate`, `Advanced`).

#### `PATCH /{recommendation_id}/progress`
Updates progress on a specific item.
- **Behavior**: Updates progress (0-100%). If progress >= 100, marks the content as `completion_status = True`.

---

## 🏗 Data Models (Pydantic)

All models inherit from `MongoBaseModel` which automatically handles `_id` to `id` mapping:

- **User**: Name, Email, Password, Level, Streak.
- **Content**: Title, Type, Difficulty, Tags, Topic.
- **Activity**: Aggregated learning time per user.
- **Status**: Progress tracker for users on specific content.

---

## 🚀 How to Run
1. Ensure MongoDB is running on `localhost:27017`.
2. Install dependencies: `pip install -r Backend/requirements.txt`.
3. Start the server: `uvicorn Backend.main:app --reload`.
