from pydantic import BaseModel


class APIModel(BaseModel):
    class Config:
        orm_mode = True
        from_attributes = True
