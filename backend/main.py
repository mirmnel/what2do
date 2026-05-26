from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from supabase import create_client, Client
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],
    allow_methods=["POST"],
    allow_headers=["*"],
)

supabase: Client = create_client(
    os.environ["SUPABASE_URL"],
    os.environ["SUPABASE_SERVICE_KEY"],
)


class SubmitRequest(BaseModel):
    user_id: str
    value: int = Field(ge=1, le=10)


@app.post("/submit")
def submit(req: SubmitRequest):
    try:
        supabase.table("submissions").insert(
            {"user_id": req.user_id, "value": req.value}
        ).execute()
        return {"success": True}
    except Exception as e:
        msg = str(e).lower()
        if "duplicate" in msg or "unique" in msg or "23505" in msg:
            raise HTTPException(status_code=409, detail="Already submitted")
        raise HTTPException(status_code=500, detail="Server error")
