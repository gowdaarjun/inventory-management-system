from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

import models, schemas
from database import SessionLocal, engine
import inventory_service as service

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Inventory Management API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
@app.get("/inventory")
def list_inventory(db: Session = Depends(get_db)):
    return service.fetch_inventory(db)

@app.post("/inventory")
def create_inventory(record: schemas.ItemCreate, db: Session = Depends(get_db)):
    return service.add_inventory_record(db, record)

@app.put("/inventory/{record_id}")
def update_inventory(record_id: int, record: schemas.ItemCreate, db: Session = Depends(get_db)):
    return service.modify_inventory(db, record_id, record)

@app.delete("/inventory/{record_id}")
def delete_inventory(record_id: int, db: Session = Depends(get_db)):
    service.remove_inventory_record(db, record_id)
    return {"status": "deleted"}

@app.get("/inventory/alerts")
def stock_alerts(db: Session = Depends(get_db)):
    return service.compute_low_stock_alerts(db)

@app.get("/inventory/metrics")
def dashboard_metrics(db: Session = Depends(get_db)):
    return service.build_inventory_metrics(db)