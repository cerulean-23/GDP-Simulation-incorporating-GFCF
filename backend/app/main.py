import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router

app = FastAPI(title="Solow-Swan Simulation API")

# Origins allowed to call this API. Localhost for dev, plus anything set via
# the ALLOWED_ORIGINS env var (comma-separated) once deployed — e.g. on
# Railway set ALLOWED_ORIGINS=https://your-app.vercel.app
default_origins = ["http://localhost:5173", "http://127.0.0.1:5173"]
extra_origins = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "").split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=default_origins + extra_origins,
    # Also allow any Vercel preview-deploy URL (they get a random subdomain
    # per branch/PR) without needing to update env vars for every preview.
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/api/health")
async def health():
    return {"status": "ok"}
