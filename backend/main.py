from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.candidates import router as candidates_router
from app.api.interview import router as interview_router

app = FastAPI(title="The Interview Agent")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(interview_router)
app.include_router(candidates_router)


@app.get("/health")
def health_check():
    return {"status": "ok"}
