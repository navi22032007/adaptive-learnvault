# **Adaptive LearnVault**

### **Product Requirements Document (PRD – EAR Format, Technical-Enhanced Version)**

---

## **1. Executive Summary (E)**

### **Product Name**

**Adaptive LearnVault**

### **Problem Statement**

Students rely on scattered learning resources (PDFs, videos, blogs), but existing systems act as **static repositories**. They neither track learning behavior nor adapt recommendations based on user performance, interests, difficulty comfort, or time availability.

### **Proposed Solution**

Adaptive LearnVault is a **database-driven intelligent learning repository** that:

* Stores structured educational content
* Tracks detailed user learning activity
* Uses **rule-based + content-based AI logic** to recommend the **next best 5 learning items** for each user

### **Value Proposition**

* Converts a static content library into a **personalized learning system**
* Demonstrates **strong DBMS concepts + applied AI logic**
* Uses **industry-relevant backend architecture (FastAPI + MySQL)**
* Simple tech stack → easy to defend in exams and viva

---

## **2. Aims & Objectives (A)**

### **Primary Aim**

To design and implement a **relational database–centric learning vault** integrated with a **FastAPI-based recommendation engine**.

### **Objectives**

1. Design a **fully normalized MySQL schema (3NF)**
2. Implement secure **role-based user management**
3. Log detailed user learning activity
4. Analyze stored data using SQL + Python
5. Generate **dynamic personalized recommendations**
6. Build a lightweight HTML/CSS frontend connected via REST APIs

---

## **3. Requirements Specification (R)**

---

## **3.1 Functional Requirements**

---

### **3.1.1 User Management**

#### **Roles**

* **Student:** consumes content and receives recommendations
* **Teacher / Content Curator:** uploads and manages content
* **Admin:** monitors system analytics and users

#### **How it Works (Technical Flow)**

1. User registers via HTML form
2. FastAPI validates input
3. Password is hashed (e.g., bcrypt)
4. User details stored in `Users` table
5. Role is linked using `Roles` table
6. JWT-based authentication for secure access

---

### **3.1.2 Learning Content Vault**

#### **Supported Content Types**

* PDF Notes
* Video Lectures (URL-based)
* Blogs / Articles
* Problem Sets
* Quizzes (optional)

#### **Content Storage Strategy**

* Metadata stored in **MySQL**
* Actual files stored in:

  * Server directory **or**
  * External URLs (YouTube, Drive, etc.)

#### **Content Metadata (Database Fields)**

* Title
* Description
* Content Type
* Topic & Subtopic
* Difficulty Level
* Estimated Duration
* Language
* Tags
* File path / URL
* Created by (Curator ID)

---

### **3.1.3 Content Organization**

#### **Collections / Playlists**

* One collection → many content items
* One content item → many collections

#### **Implementation**

* `Collections` table
* `Collection_Content` junction table
* Many-to-many relationship handled using foreign keys

---

### **3.1.4 User Interaction Tracking**

Every learner action is **persistently stored**.

#### **Tracked Parameters**

* View count
* Completion status
* Time spent (in seconds)
* Like / Dislike
* Bookmark
* Last accessed timestamp

#### **How It Works**

1. Student opens content
2. JavaScript timer tracks time spent
3. On exit or completion:

   * Data sent to FastAPI endpoint
4. Backend updates:

   * `User_Activity`
   * `User_Content_Status`

➡️ This data becomes the **core input for recommendations**

---

## **3.2 AI Recommendation Engine (Detailed Working)**

### **Recommendation Goal**

Recommend **5 personalized learning items** that best suit the learner **at that moment**.

---

### **Inputs Used**

* User’s past interactions
* Preferred difficulty (derived from history)
* Topics and tags consumed
* Average completion time
* Available learning time (user input)
* Content metadata

---

### **Step-by-Step Recommendation Flow**

#### **Step 1: Fetch User Learning Profile**

From SQL queries:

* Average difficulty consumed
* Most viewed topics
* Preferred content type
* Average session duration

---

#### **Step 2: Filter Content (SQL Level)**

* Exclude completed content
* Exclude disliked content
* Filter duration ≤ available time
* Match difficulty ± 1 level

---

#### **Step 3: Score Content (Python Logic)**

Each content item gets a score:

* * Topic match
* * Tag overlap
* * Difficulty match
* * Popularity among similar users (optional)

---

#### **Step 4: Ensure Diversity**

* Avoid recommending same topic repeatedly
* Mix content types (PDF + Video + Problem)

---

#### **Step 5: Rank & Select**

* Sort by score
* Return **Top 5 results**

---

### **Explainability (Viva-Friendly)**

Each recommendation can show:

> “Recommended because you completed similar Intermediate Python videos in under 20 minutes.”

---

## **4. Database Design Requirements**

---

### **4.1 Core Tables**

| Table Name          | Purpose                |
| ------------------- | ---------------------- |
| Users               | Store user credentials |
| Roles               | Role definitions       |
| Content             | Learning resources     |
| Topics              | Subject hierarchy      |
| Tags                | Keyword tagging        |
| Content_Tags        | Many-to-many mapping   |
| Collections         | Playlists              |
| Collection_Content  | Collection mapping     |
| User_Activity       | Interaction logs       |
| User_Content_Status | Completion tracking    |

---

### **4.2 DBMS Concepts Demonstrated**

* 3NF normalization
* Primary & foreign keys
* Composite keys
* Indexing on `user_id`, `content_id`
* Views for analytics
* Aggregate queries (`COUNT`, `AVG`, `SUM`)
* Referential integrity constraints

---

## **5. Non-Functional Requirements**

### **Performance**

* Optimized MySQL queries
* Index-based filtering
* Recommendation generated under seconds

### **Scalability (Conceptual)**

* New recommendation logic can replace rule-based logic later
* Additional content types can be added without schema change

### **Security**

* JWT authentication
* Role-based API access
* SQL injection prevention via ORM / prepared queries

### **Usability**

* Minimal HTML pages
* Clear dashboard
* One-click access to recommendations

---

## **6. System Architecture (Stack-Specific)**

### **Frontend**

* HTML + CSS for structure & design
* JavaScript for:

  * Animations
  * API calls (fetch)
  * Time tracking

---

### **Backend**

* **FastAPI**
* REST APIs:

  * `/login`
  * `/register`
  * `/content`
  * `/activity`
  * `/recommendations`

---

### **Database**

* **MySQL**
* Structured relational schema
* Strict constraints

---

## **7. MVP vs Extensions**

### **MVP**

* Content vault CRUD
* User activity logging
* Rule-based recommendation engine
* Student dashboard
* Admin analytics

### **Extensions**

* Quiz-based recommendations
* Learning path generation
* Collaborative filtering
* AI explainability UI

---

## **8. Success Metrics**

* Recommendations change dynamically
* SQL queries return correct analytics
* ER diagram is clean & normalized
* Recommendation logic is explainable
* Project clearly shows **DBMS + AI integration**

---

## **9. Academic Strength (Why Examiners Will Like It)**

* Heavy database usage
* Minimal but **real AI logic**
* Strong SQL + backend interaction
* Easy to explain step-by-step
* Real-world EdTech relevance