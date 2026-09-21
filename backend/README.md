# CareCircle API

## Start locally

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export CARECIRCLE_SECRET="replace-this-with-a-long-random-value"
uvicorn main:app --reload --port 8000
```

API documentation: `http://localhost:8000/docs`

The SQLite database is created automatically. For production, set a strong secret, restrict CORS to the deployed frontend, serve over HTTPS, and migrate the schema to managed PostgreSQL.
