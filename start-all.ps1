Write-Host "Setting up and starting the backend API..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; if (!(Test-Path .venv)) { python -m venv .venv }; .\.venv\Scripts\Activate.ps1; pip install -e .; uvicorn app.main:app --reload --port 8000"

Write-Host "Setting up and starting the frontend..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm install; npm run dev"

Write-Host "Done! Backend and frontend are starting up in separate windows."
