from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models

router = APIRouter(prefix="/api/relationships", tags=["Relationships"])

@router.get("/heatmap")
def get_correlation_heatmap(db: Session = Depends(get_db)):
    # Returns correlation data for heatmap matrix
    scores = db.query(models.RelationshipScore).all()
    
    heatmap = []
    for s in scores:
        heatmap.append({
            "ticker_a": s.ticker_a,
            "ticker_b": s.ticker_b,
            "pearson_corr": s.pearson_corr,
            "rolling_corr": s.rolling_corr
        })
    return heatmap

@router.get("/network")
def get_network_graph(db: Session = Depends(get_db)):
    # nodes + edges for D3 network graph
    scores = db.query(models.RelationshipScore).filter(models.RelationshipScore.pearson_corr > 0.5).all()
    
    nodes_set = set()
    edges = []
    for s in scores:
        nodes_set.add(s.ticker_a)
        nodes_set.add(s.ticker_b)
        
        # Determine direction based on who is the leader
        source = s.ticker_a
        target = s.ticker_b
        is_directed = False
        
        if s.follower_score > s.leader_score:
            source = s.ticker_b
            target = s.ticker_a
            is_directed = True
        elif s.leader_score > s.follower_score:
            is_directed = True
            
        edges.append({
            "source": source,
            "target": target,
            "value": s.pearson_corr,
            "is_directed": is_directed
        })
        
    nodes = [{"id": n, "group": 1} for n in nodes_set]
    
    return {"nodes": nodes, "links": edges}

@router.get("/leaders")
def get_leaders(db: Session = Depends(get_db)):
    # Returns top leader/follower pairs
    scores = db.query(models.RelationshipScore).filter(
        models.RelationshipScore.lag_corr > 0.05
    ).order_by(models.RelationshipScore.lag_corr.desc()).limit(50).all()
    
    results = []
    for s in scores:
        if s.leader_score >= s.follower_score:
            leader = s.ticker_a
            follower = s.ticker_b
            strength = s.leader_score
        else:
            leader = s.ticker_b
            follower = s.ticker_a
            strength = s.follower_score
            
        results.append({
            "leader": leader,
            "follower": follower,
            "lag_corr": round(s.lag_corr * 100, 1),
            "strength": round(strength, 2)
        })
        
    return results
