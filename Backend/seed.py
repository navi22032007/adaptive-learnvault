from sqlmodel import Session, select
from .core.database import engine, create_db_and_tables
from .models.domain import User, Role, Content, Tag, ContentTag, UserActivity, UserContentStatus, GraphNode, GraphEdge
from .core.security import get_password_hash
import json

def seed_data():
    create_db_and_tables()
    with Session(engine) as session:
        # Check if seeded
        if session.exec(select(User)).first():
            print("Database already seeded.")
            return

        print("Seeding database...")

        # 1. Create Roles
        student_role = Role(name="Student")
        session.add(student_role)
        
        # 2. Create User
        user = User(
            email="arjun@example.com",
            hashed_password=get_password_hash("password123"),
            name="Arjun",
            level="Intermediate",
            streak=12,
            todayGoal=60,
            todayProgress=38,
            role=student_role
        )
        session.add(user)
        session.commit()
        session.refresh(user)

        # 3. Create Activity Data
        hours = {"Mon": 2.5, "Tue": 3.2, "Wed": 1.8, "Thu": 4.1, "Fri": 3.5, "Sat": 2.9, "Sun": 4.8}
        activity = UserActivity(
            user_id=user.id,
            weekly_hours_json=json.dumps(hours),
            completion_rate=73.0,
            total_completed=47,
            xp=3240,
            next_level_xp=5000
        )
        session.add(activity)

        # 4. Create Tags
        tag_names = ["python", "functions", "closures", "dsa", "trees", "graphs", "algorithms", "ml", "ai", "numpy", "scikit-learn", "react", "hooks", "frontend", "javascript", "sql", "database", "performance", "indexing", "system-design", "architecture", "scalability"]
        tags = {name: Tag(name=name) for name in tag_names}
        for tag in tags.values():
            session.add(tag)

        # 5. Create Content
        content_data = [
            (1, "Intermediate Python — Functions & Closures", "Video", 2, 15, ["python", "functions", "closures"], "Deep dive into Python functions...", "Dr. Aisha Patel", 4.8, 12400),
            (2, "Data Structures: Trees & Graphs", "PDF", 3, 25, ["dsa", "trees", "graphs", "algorithms"], "Comprehensive guide...", "Prof. Marcus Chen", 4.9, 8750),
            (3, "Machine Learning Fundamentals", "Video", 2, 20, ["ml", "ai", "numpy", "scikit-learn"], "Intro to supervised...", "Sarah Kim, PhD", 4.7, 23600),
            (4, "React Hooks — Advanced Patterns", "Video", 3, 18, ["react", "hooks", "frontend", "javascript"], "Master hooks...", "Ethan Reyes", 4.6, 15800),
            (5, "SQL Optimization — Query Performance", "PDF", 2, 12, ["sql", "database", "performance", "indexing"], "Learn query optimization...", "Nadia Okonkwo", 4.5, 9100),
            (6, "System Design Fundamentals", "Video", 4, 35, ["system-design", "architecture", "scalability"], "Scalable systems...", "Alex Mercer", 4.9, 31200)
        ]

        contents = []
        for cid, title, ctype, diff, dur, ctags, desc, inst, rating, enrolled in content_data:
            c = Content(
                title=title,
                type=ctype,
                difficulty=diff,
                duration=dur,
                description=desc,
                instructor=inst,
                rating=rating,
                enrolled=enrolled,
                file_path_or_url="http://example.com"
            )
            c.tags = [tags[t] for t in ctags]
            contents.append(c)
            session.add(c)
            
        session.commit()
        
        # Give user progress on some
        status = UserContentStatus(user_id=user.id, content_id=contents[0].id, progress=50)
        session.add(status)
        
        # 6. Knowledge Graph Nodes
        nodes = [
            GraphNode(id="python", label="Python", x=0, y=0, z=0, size=1.4, color="#0891b2"),
            GraphNode(id="functions", label="Functions", x=2, y=1, z=-1, size=1.0, color="#06b6d4"),
            GraphNode(id="oop", label="OOP", x=-2, y=1, z=0.5, size=1.0, color="#06b6d4"),
            GraphNode(id="dsa", label="DSA", x=1, y=-2, z=1, size=1.2, color="#0891b2"),
            GraphNode(id="trees", label="Trees", x=3, y=-1, z=0, size=0.8, color="#22d3ee"),
            GraphNode(id="graphs", label="Graphs", x=2.5, y=-2.5, z=-0.5, size=0.8, color="#22d3ee"),
            GraphNode(id="ml", label="Machine Learning", x=-1, y=2, z=-2, size=1.3, color="#0891b2"),
            GraphNode(id="numpy", label="NumPy", x=-3, y=2.5, z=-1, size=0.8, color="#22d3ee"),
            GraphNode(id="react", label="React", x=-2, y=-1.5, z=-1.5, size=1.1, color="#06b6d4"),
            GraphNode(id="js", label="JavaScript", x=-3.5, y=-0.5, z=-0.5, size=1.0, color="#06b6d4"),
            GraphNode(id="sql", label="SQL", x=0.5, y=-3, z=-1, size=0.9, color="#22d3ee"),
            GraphNode(id="sysdesign", label="Sys Design", x=0, y=3, z=1, size=1.2, color="#0891b2"),
        ]
        for node in nodes:
            session.add(node)

        # 7. Knowledge Graph Edges
        edges_data = [
            ["python", "functions"], ["python", "oop"], ["python", "dsa"],
            ["python", "ml"], ["dsa", "trees"], ["dsa", "graphs"],
            ["ml", "numpy"], ["ml", "python"], ["react", "js"],
            ["dsa", "sql"], ["sysdesign", "dsa"], ["sysdesign", "sql"],
            ["functions", "react"], ["oop", "react"],
        ]
        for edge in edges_data:
            session.add(GraphEdge(source=edge[0], target=edge[1]))

        session.commit()
        print("Database seeded successfully.")

if __name__ == "__main__":
    seed_data()
