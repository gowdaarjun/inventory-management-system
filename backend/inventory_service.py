from sqlalchemy.orm import Session
import models, schemas

def fetch_inventory(db: Session):
    return db.query(models.Item).all()

def add_inventory_record(db: Session, record: schemas.ItemCreate):
    obj = models.Item(**record.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

def modify_inventory(db: Session, record_id: int, record: schemas.ItemCreate):
    obj = db.query(models.Item).filter(models.Item.id == record_id).first()
    for k, v in record.dict().items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj

def remove_inventory_record(db: Session, record_id: int):
    obj = db.query(models.Item).filter(models.Item.id == record_id).first()
    db.delete(obj)
    db.commit()

def compute_low_stock_alerts(db: Session):
    return db.query(models.Item).filter(
        models.Item.quantity < models.Item.threshold
    ).all()

def build_inventory_metrics(db: Session):
    rows = db.query(models.Item).all()
    return {
        "total_units": len(rows),
        "critical_stock": len([r for r in rows if r.quantity < r.threshold]),
        "item_groups": len(set(r.category for r in rows))
    }