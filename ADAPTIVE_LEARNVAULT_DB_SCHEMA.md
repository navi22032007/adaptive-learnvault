# Database Schema: Adaptive LearnVault (MongoDB)

This document provides a comprehensive breakdown of the NoSQL database architecture for **Adaptive LearnVault**. The system uses a document-oriented approach (MongoDB) to manage the high-velocity metadata required for personalized learning.

---

## 🏗 System Architecture Overview
- **Database Engine**: MongoDB (Async via Motor driver)
- **Data Modeling**: Pydantic v2 schemas for runtime validation.
- **Identity Management**: Uses standard `_id` (ObjectId) as primary keys, with secondary indexing on `email` and `content_id`.

---

## 📂 Collections & Document Structures

### 1. `users`
Stores user profile information, authentication credentials, and high-level progress stats.
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `_id` | ObjectId | - | Primary Key |
| `email` | String | - | Unique identifier for the user |
| `password` | String | - | Hashed password (or plain-text in dev) |
| `name` | String | - | Display name |
| `level` | String | "Beginner" | Mastery tier (Beginner, Intermediate, Advanced) |
| `streak` | Integer | 0 | Consecutive days active |
| `todayGoal` | Integer | 60 | Learning target in minutes |
| `todayProgress` | Integer | 0 | Progress towards daily goal |
| `last_active_date` | String | - | ISO format date (YYYY-MM-DD) |
| `role_name` | String | "Student" | System role (Student, Teacher, Admin) |

### 2. `content`
The primary repository of learning materials (Videos, PDFs, Blogs).
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `_id` | ObjectId | - | Primary Key |
| `title` | String | - | Title of the resource |
| `description` | String | - | AI-summarized overview |
| `type` | String | - | Resource type (Video, PDF, Blog) |
| `difficulty` | Integer | - | Level 1 (Easy) to 5 (Hard) |
| `duration` | Integer | - | Estimated completion time in minutes |
| `file_path_or_url` | String | - | Source link or local path |
| `topic_name` | String | - | Categorical topic label |
| `tags` | Array<String> | [] | Searchable tags |
| `enrolled` | Integer | 0 | Global count of users who added this |
| `created_by_email`| String | - | Email of the contributor/teacher |

### 3. `user_activity`
Aggregated tracking data for the gamification engine.
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `user_email` | String | - | Reference to `users.email` |
| `xp` | Integer | 0 | Cumulative Experience Points |
| `next_level_xp` | Integer | 1000 | Threshold for next promotion |
| `total_completed` | Integer | 0 | Lifetime resources finished |
| `weekly_hours` | Object | {} | Key-value store for daily duration tracking |
| `completion_rate` | Float | 0.0 | Ratio of completed vs enrolled content |

### 4. `user_content_status`
Bridge collection tracking individual progress on specific resources.
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `user_email` | String | - | Reference to `users.email` |
| `content_id` | String | - | Reference to `content._id` |
| `progress` | Integer | 0 | Percentage completion (0-100) |
| `completion_status`| Boolean | False | Is the resource marked as finished? |
| `bookmarked` | Boolean | False | Saved for later |
| `last_accessed` | DateTime | now() | Last interaction timestamp |

### 5. `graph_nodes` & `graph_edges`
Structural data for the interactive 3D Knowledge Graph.
- **Nodes**:
    - `node_id`: Unique identifier (often matches a Topic or Content ID).
    - `label`: Display text.
    - `x, y, z`: 3D coordinates.
    - `color`: CSS color code (Progress-dependent).
- **Edges**:
    - `source`: node_id.
    - `target`: node_id.

### 6. `chat_sessions` & `chat_messages`
Stores AI Tutor conversation history.
- **Sessions**: `user_email`, `title`, `updated_at`.
- **Messages**: `session_id`, `role` (user/bot), `content`, `timestamp`.

### 7. `notes`
Private study notes for specific resources.
- `user_email`, `content_id`, `text`, `updated_at`.

---

## 🔗 Primary Relationships (JOIN Logic)
Since MongoDB is schema-less, relationships are managed through "Soft Foreign Keys":
1. **User ↔ Activity**: Linked by `email`.
2. **User ↔ Content**: Managed via `user_content_status` (email + contentId).
3. **Topics ↔ Content**: Linked by `topic_name` string labels. 
4. **Graph ↔ Progress**: The system dynamically queries `user_content_status` during graph generation to set node colors based on completion status.

---

## 📊 Indexing Strategy
To ensure high performance, the following indexes are recommended:
- **`users`**: `{ "email": 1 }` (Unique)
- **`content`**: `{ "topic_name": 1 }`, `{ "tags": 1 }`
- **`user_content_status`**: `{ "user_email": 1, "content_id": 1 }` (Compound)
- **`chat_messages`**: `{ "session_id": 1, "timestamp": 1 }`
