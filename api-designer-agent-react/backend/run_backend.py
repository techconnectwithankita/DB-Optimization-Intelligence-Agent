from __future__ import annotations

import sys
import os
from pathlib import Path

package_dir = Path(__file__).parent / ".packages"
if package_dir.exists():
    sys.path.insert(0, str(package_dir))

project_root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(project_root))

import uvicorn

port = int(os.getenv("PORT", "8010"))
uvicorn.run("backend.app.main:app", host="0.0.0.0", port=port, reload=False)
