import os
import sys
import uvicorn

# Ensure the backend directory is in the python path
sys.path.insert(0, os.path.dirname(__file__))

from app.main import app

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port)
