# 🚀 Adaptive LearnVault: API & Feature Documentation

This document provides a comprehensive technical overview of the Adaptive LearnVault backend, its endpoints, and core AI-driven features.

---

## 🛠 Core AI & Data Architecture

### 1. MongoDB Async Persistence (NoSQL)
The system uses an asynchronous architecture to handle the rich, evolving metadata of learning resources.
- **Driver**: [Motor](https://motor.readthedocs.io/) (Async MongoDB driver).
- **ID Strategy**: Support for MongoDB `ObjectId` via `PyObjectId` Pydantic helper, with backward compatibility for string-based IDs.
- **Collections**: `users`, `content`, `user_activity`, `user_content_status`, `graph_nodes`, `graph_edges`, `chat_sessions`, `chat_messages`.

### 2. Multi-Model AI Stack
The backend integrates with elite AI models to automate curricula and provide tutoring:
- **NVIDIA NIM (Llama 3.1 70B)**: Powers the **LearnVault AI Agent** for structured lesson plans and concept deep-dives.
- **DeepSeek V3**: Handles **Metadata Extraction** from URLs and **Curriculum Generation** for new topics.
- **Google Gemini**: Generates personalized **Recommendation Rationales**.

### 3. Gamification Framework
Real-time tracking of learner engagement:
- **XP Scaling**: Users gain 100 XP per resource completed.
- **Leveling**: Automatic promotion (Beginner ➡️ Intermediate ➡️ Advanced) when XP thresholds (1000 XP/level) are met.
- **Activity Metrics**: Atomic tracking of weekly hours and completion rates.

---

## 📡 API Endpoints Reference

### 🔐 Authentication (`/api/auth`)

#### `POST /register` | `POST /token`
- **Security**: Simplified model using **Plain-text Passwords** for rapid development.
- **Auth Type**: Stateless JWT (Bearer Token).

---

### 🤖 LearnVault AI Agent (`/api/agent`)

#### `POST /chat`
Interacts with the Curriculum Architect agent.
- **Input**: `message`, `session_id` (optional).
- **Persistence**: Conversation history is stored in `chat_messages` and provided to the agent as context (last 20 messages).
- **Logic**: Tailors complexity based on the Student's `Level` from their profile.

#### `GET /sessions` | `GET /sessions/{session_id}`
- **Behavior**: Retrieves chat history for user study sessions.

---

### 📚 Content & Curriculum (`/api/content`)

#### `POST /import`
Extracts metadata from a URL (YouTube, Blogs, PDFs) using DeepSeek.
- **Extracted Fields**: Title, Description, Type, Difficulty (1-5), Duration (mins), Topic, Tags.

#### `POST /generate`
Generates a structured 3-item curriculum for any given topic.
- **Behavior**: Creates content records and adds them to the user's "Todo" list automatically.

#### `POST /complete/{content_id}`
Marks a resource as finished.
- **Impact**: Awards XP, increments `todayProgress`, and evaluates Level Up conditions.

#### `GET /notes/{content_id}` | `POST /notes`
- **Behavior**: Allows users to store persistent JSON-based notes for specific learning materials.

---

### 🕸 Knowledge Graph (`/api/graph`)

#### `GET /data`
Serves the 3D Knowledge Graph visualization data.
- **Enrichment**: Nodes are decorated with user-specific progress status:
    - `locked`: Node is unvisited (#374151).
    - `in_progress`: User has started but not completed (#fb923c).
    - `completed`: User has finished the resource (#10b981).

---

### ⛳ Physical Directory Mapping
- **Uploads**: Local files (PDF/Docs) are served via `app.mount("/uploads", ...)` and accessible at `http://localhost:8000/uploads/{filename}`.

---

## 🚀 Environment Configuration
Required variables in `.env`:
- `MONGODB_URL`: Connection string.
- `JWT_SECRET`: Token signature key.
- `NVIDIA_API_KEY`: For Llama 3.1 & DeepSeek V3.
- `GEMINI_API_KEY`: For recommendation rationales.
