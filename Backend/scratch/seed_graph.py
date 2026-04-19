from pymongo import MongoClient
import math
import random

# Connection
client = MongoClient('mongodb://localhost:27017')
db = client['learnvault']

def seed_graph():
    print("Seeding Knowledge Graph...")
    
    # 1. Clear existing
    db.graph_nodes.delete_many({})
    db.graph_edges.delete_many({})
    
    nodes = []
    edges = []
    
    # 2. Central Core
    nodes.append({
        "node_id": "core",
        "label": "Knowledge Core",
        "x": 0, "y": 0, "z": 0,
        "size": 2.5,
        "color": "#ffffff"
    })
    
    # 3. Major Topics
    major_topics = [
        {"id": "os", "label": "Operating Systems", "color": "#3b82f6"},
        {"id": "algo", "label": "Algorithms", "color": "#10b981"},
        {"id": "coa", "label": "Computer Architecture", "color": "#f59e0b"},
        {"id": "dbms", "label": "Database Management", "color": "#ef4444"},
        {"id": "web", "label": "Web Development", "color": "#8b5cf6"}
    ]
    
    # Distribute topics around core (radius 3)
    for i, topic in enumerate(major_topics):
        angle = (2 * math.pi * i) / len(major_topics)
        nodes.append({
            "node_id": topic["id"],
            "label": topic["label"],
            "x": math.cos(angle) * 3,
            "y": math.sin(angle) * 3,
            "z": random.uniform(-1, 1),
            "size": 1.8,
            "color": topic["color"]
        })
        edges.append({
            "source": "core",
            "target": topic["id"]
        })
        
    # 4. Fetch content pieces to link to these topics
    # We'll map content to these topics based on their topic_name
    all_content = list(db.content.find({}))
    
    topic_map = {
        "Operating Systems": "os",
        "Algorithms": "algo",
        "Computer Architecture": "coa",
        "Database Management": "dbms",
        "Web Development": "web",
        "React": "web",
        "AI Basics": "algo" # Fallback mapping
    }
    
    # Distribute content nodes around their topics (radius 1.5 from topic center)
    content_counts = {} # track how many nodes per topic for distribution
    
    for c in all_content:
        topic_name = c.get("topic_name")
        parent_id = topic_map.get(topic_name)
        
        if not parent_id:
            # Fallback to a random major topic if no match
            parent_id = random.choice(major_topics)["id"]
            
        parent_node = next(n for n in nodes if n["node_id"] == parent_id)
        
        count = content_counts.get(parent_id, 0)
        content_counts[parent_id] = count + 1
        
        # Local angle
        local_angle = (2 * math.pi * count) / 5 # Assume ~5 nodes per topic cluster
        dist = 1.5
        
        node_id = str(c["_id"])
        nodes.append({
            "node_id": node_id,
            "content_id": node_id, # for lookups
            "label": c["title"],
            "x": parent_node["x"] + math.cos(local_angle) * dist,
            "y": parent_node["y"] + math.sin(local_angle) * dist,
            "z": parent_node["z"] + random.uniform(-0.5, 0.5),
            "size": 1.0,
            "color": parent_node["color"] # Inherit topic color
        })
        edges.append({
            "source": parent_id,
            "target": node_id
        })

    # 5. Insert into DB
    if nodes:
        db.graph_nodes.insert_many(nodes)
        print(f"Inserted {len(nodes)} nodes.")
    if edges:
        db.graph_edges.insert_many(edges)
        print(f"Inserted {len(edges)} edges.")

if __name__ == "__main__":
    seed_graph()
