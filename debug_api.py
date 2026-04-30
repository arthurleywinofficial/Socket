import os
import sys

# Add the app directory to sys.path
sys.path.append('/app')

import routers.home
import database
import traceback

def main():
    try:
        db = next(database.get_db())
        res = routers.home.get_home_overview(db)
        print("SUCCESS:", res)
    except Exception:
        print("FAILURE:")
        traceback.print_exc()

if __name__ == "__main__":
    main()
