import os
import shutil

# Files to remove inside src
files_to_remove = [
    r"d:\projects\civic-pulse\src\API_KEYS_GUIDE.md",
    r"d:\projects\civic-pulse\src\HOW_TO_RUN.md",
    r"d:\projects\civic-pulse\src\POSTGRES_SETUP.md",
    r"d:\projects\civic-pulse\src\README.md",
    r"d:\projects\civic-pulse\src\backend\websockets.py",
    r"d:\projects\civic-pulse\MILESTONES.md"
]

for file_path in files_to_remove:
    if os.path.exists(file_path):
        try:
            os.remove(file_path)
            print(f"Removed file: {file_path}")
        except Exception as e:
            print(f"Error removing {file_path}: {e}")

# Directories to remove
dirs_to_remove = [
    r"d:\projects\civic-pulse\src\frontend\municipal-officer-dashboard"
]

for dir_path in dirs_to_remove:
    if os.path.exists(dir_path):
        try:
            shutil.rmtree(dir_path)
            print(f"Removed directory: {dir_path}")
        except Exception as e:
            print(f"Error removing directory {dir_path}: {e}")

print("Cleanup complete!")
