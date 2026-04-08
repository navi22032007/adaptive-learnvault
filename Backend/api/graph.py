from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from ..core.database import get_session
from ..models.domain import GraphNode, GraphEdge

router = APIRouter(prefix="/knowledge-graph", tags=["knowledge-graph"])

@router.get("/", response_model=Dict[str, Any])
def read_graph(session: Session = Depends(get_session)):
    nodes = session.exec(select(GraphNode)).all()
    edges_records = session.exec(select(GraphEdge)).all()
    
    formatted_edges = [[edge.source, edge.target] for edge in edges_records]
    
    return {
        "nodes": nodes,
        "edges": formatted_edges
    }
