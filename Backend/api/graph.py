from fastapi import APIRouter, Depends
from typing import List, Dict
from core.database import get_db
from models.domain import GraphNode, GraphEdge
from motor.motor_asyncio import AsyncIOMotorDatabase

router = APIRouter(prefix="/graph", tags=["graph"])

@router.get("/data")
async def get_graph_data(db: AsyncIOMotorDatabase = Depends(get_db)):
    nodes_cursor = db["graph_nodes"].find({})
    edges_cursor = db["graph_edges"].find({})
    
    nodes = await nodes_cursor.to_list(length=1000)
    edges = await edges_cursor.to_list(length=1000)
    
    return {
        "nodes": [GraphNode(**n) for n in nodes],
        "edges": [GraphEdge(**e) for e in edges]
    }
