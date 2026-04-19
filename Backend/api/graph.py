from fastapi import APIRouter, Depends
from typing import List, Dict
from core.database import get_db
from models.domain import GraphNode, GraphEdge
from motor.motor_asyncio import AsyncIOMotorDatabase

router = APIRouter(prefix="/graph", tags=["graph"])

from .auth import get_current_user
from models.domain import User

@router.get("/ping")
async def ping():
    return {"message": "pong"}

@router.get("/data")
async def get_graph_data(
    db: AsyncIOMotorDatabase = Depends(get_db),
    user: User = Depends(get_current_user)
):
    try:
        # Find labels the user has interacted with
        statuses = await db["user_content_status"].find({"user_email": user.email}).to_list(length=1000)
        status_map = {s["content_id"]: s for s in statuses}
        
        nodes_cursor = db["graph_nodes"].find({})
        all_nodes = await nodes_cursor.to_list(length=1000)
        
        # We want to return nodes that the user has status for, OR nodes that are connected to them
        # For now, let's return all nodes but decorate them with status
        
        enriched_nodes = []
        for n in all_nodes:
            content_id = n.get("content_id") or n.get("node_id")
            status = status_map.get(content_id)
            
            node_data = n.copy()
            
            # Map node_id to id for frontend compatibility
            node_data["id"] = node_data.get("node_id", str(node_data.get("_id")))
            
            if "_id" in node_data:
                del node_data["_id"]
                
            is_topic = not n.get("content_id")
            
            if is_topic:
                node_data["progress"] = 100
                node_data["status"] = "completed"
                node_data["color"] = n.get("color", "#1e1e2e")
            else:
                if status:
                    node_data["progress"] = status.get("progress", 0)
                    node_data["status"] = "completed" if status.get("completion_status") else "in_progress"
                    node_data["color"] = n.get("color") if status.get("completion_status") else "#fb923c"
                else:
                    node_data["progress"] = 0
                    node_data["status"] = "locked"
                    node_data["color"] = "#374151" # locked content color
                
            enriched_nodes.append(node_data)
        
        edges_cursor = db["graph_edges"].find({})
        all_edges = await edges_cursor.to_list(length=1000)
        
        # Frontend expects an array of arrays for edges: [[sourceId, targetId], ...]
        enriched_edges = []
        for e in all_edges:
            source = e.get("source") or e.get("from")
            target = e.get("target") or e.get("to")
            if source and target:
                enriched_edges.append([source, target])
        
        return {
            "nodes": enriched_nodes,
            "edges": enriched_edges
        }

    except Exception as e:
        import traceback
        import json
        from fastapi import Response
        return Response(content=json.dumps({"error": traceback.format_exc()}), status_code=500, media_type="application/json")
