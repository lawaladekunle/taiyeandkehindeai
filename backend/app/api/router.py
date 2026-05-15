from fastapi import APIRouter

api_router = APIRouter()


@api_router.get("/")
def root():
    return {"message": "Medical Communications & Scheduling Assistant API"}
