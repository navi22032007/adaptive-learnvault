import requests
import os
import time

API_URL = "http://localhost:8000/api"

def test_flow():
    print("--- Starting Flow Verification ---")
    
    # 1. Auth Bypass
    print("\n1. Testing Auth Bypass...")
    headers = {"Authorization": "Bearer dummy"}
    try:
        user_res = requests.get(f"{API_URL}/user", headers=headers)
        if user_res.status_code == 200:
            user = user_res.json()
            print(f"SUCCESS: Logged in as {user['name']} ({user['email']})")
        else:
            print(f"FAILED: Auth bypass returned {user_res.status_code}")
            return
    except Exception as e:
        print(f"ERROR: Could not connect to backend. {e}")
        return

    # 2. Import Content
    print("\n2. Testing Content Import (Logic)...")
    import_data = {"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}
    import_res = requests.post(f"{API_URL}/content/import", headers=headers, json=import_data)
    if import_res.status_code == 200:
        content = import_res.json()
        print(f"SUCCESS: Imported '{content['title']}'")
    else:
        print(f"FAILED: Import returned {import_res.status_code}")

    # 3. File Upload (Test Folder)
    print("\n3. Testing File Upload...")
    # Use environment variable or relative path for portability
    test_folder = os.getenv("TEST_DATA_PATH", "./test_data")
    if os.path.exists(test_folder):
        files = os.listdir(test_folder)
        if files:
            test_file = files[0]
            print(f"Uploading {test_file}...")
            full_path = os.path.join(test_folder, test_file)
            with open(full_path, "rb") as f:
                upload_res = requests.post(
                    f"{API_URL}/content/upload", 
                    headers={"Authorization": "Bearer dummy"},
                    files={"file": (test_file, f)}
                )
                if upload_res.status_code == 200:
                    uploaded = upload_res.json()
                    print(f"SUCCESS: Uploaded '{uploaded['title']}' - Stored at {uploaded['file_path_or_url']}")
                else:
                    print(f"FAILED: Upload returned {upload_res.status_code}")
        else:
            print("SKIPPED: Test folder is empty.")
    else:
        print(f"SKIPPED: {test_folder} not found.")

    # 4. YouTube Recommendations
    print("\n4. Testing YouTube Recommendations...")
    yt_res = requests.get(f"{API_URL}/recommendations/youtube/search?topic=Algorithms", headers=headers)
    if yt_res.status_code == 200:
        recs = yt_res.json()
        print(f"SUCCESS: Fetched {len(recs)} YT recommendations for 'Algorithms'")
        for r in recs:
            print(f" - {r['title']}")
    else:
        print(f"FAILED: YT Recommendations returned {yt_res.status_code}")

    # 5. Progress Update
    print("\n5. Testing Progress Completion...")
    # Using the last imported content ID
    if 'content' in locals() and 'id' in content: # content is from step 2
         content_id = content['id']
         update_res = requests.patch(f"{API_URL}/recommendations/{content_id}/progress?progress=100", headers=headers)
         if update_res.status_code == 200:
             print(f"SUCCESS: Marked content {content_id} as complete.")
         else:
             print(f"FAILED: Progress update returned {update_res.status_code}")

    print("\n--- Verification Finished ---")

if __name__ == "__main__":
    test_flow()
