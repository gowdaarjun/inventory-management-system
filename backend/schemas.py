from pydantic import BaseModel

class ItemBase(BaseModel):
    name: str
    category: str
    quantity: int
    threshold: int
    location: str

class ItemCreate(ItemBase):
    pass

class Item(ItemBase):
    id: int

    class Config:
        from_attributes = True