from fastapi import FastAPI

app = FastAPI(title="The Interview Agent")


@app.get("/health")
def health_check():
    return {"status": "ok"}
