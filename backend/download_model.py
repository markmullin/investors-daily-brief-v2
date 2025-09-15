"""
Download GPT OSS 20B model with retry logic
"""
import os
from huggingface_hub import snapshot_download
import time

def download_model_with_retry(max_retries=5):
    """Download model with automatic retry on failure"""
    
    local_dir = r"C:\ai-models\gpt-oss-20b"
    os.environ["HF_HUB_ENABLE_HF_TRANSFER"] = "1"
    
    for attempt in range(max_retries):
        try:
            print(f"\nAttempt {attempt + 1} of {max_retries}")
            print("Downloading GPT OSS 20B model...")
            
            # Download the model files
            snapshot_download(
                repo_id="openai/gpt-oss-20b",
                allow_patterns=["original/*"],
                local_dir=local_dir,
                local_dir_use_symlinks=False,
                resume_download=True,  # Resume if partially downloaded
                max_workers=2  # Limit concurrent connections
            )
            
            print("\n✓ Model downloaded successfully!")
            print(f"Location: {local_dir}")
            return True
            
        except Exception as e:
            print(f"\n✗ Download failed: {str(e)}")
            if attempt < max_retries - 1:
                wait_time = min(60 * (2 ** attempt), 300)  # Exponential backoff, max 5 minutes
                print(f"Waiting {wait_time} seconds before retry...")
                time.sleep(wait_time)
            else:
                print("\nAll download attempts failed.")
                print("The model is partially downloaded and will resume next time.")
                return False

if __name__ == "__main__":
    success = download_model_with_retry()
    if success:
        print("\nModel is ready for use in your investors daily brief backend!")
    else:
        print("\nPlease run this script again to continue downloading.")