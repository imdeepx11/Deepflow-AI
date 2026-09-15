from fastapi import FastAPI

app = FastAPI()
import os
import sys
import uvicorn

if __name__ == '__main__':
    sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
    uvicorn.run('app.main:app', host='127.0.0.1', port=8000, reload=True, app_dir='backend')
