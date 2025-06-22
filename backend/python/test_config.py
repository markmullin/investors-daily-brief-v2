#!/usr/bin/env python
# Python service configuration test

import os
import sys
import platform
import importlib.util
import subprocess
import requests
import json
from pathlib import Path

# ANSI color codes
class Colors:
    RESET = '\033[0m'
    BRIGHT = '\033[1m'
    RED = '\033[91m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    MAGENTA = '\033[95m'

# Test result tracking
tests_passed = 0
tests_failed = 0
tests_warning = 0

print(f"{Colors.BRIGHT}=== Python Service Configuration Test ==={Colors.RESET}\n")

# Test 1: Check Python version
print(f"{Colors.BLUE}[TEST]{Colors.RESET} Checking Python version...")
python_version = platform.python_version()
version_parts = python_version.split('.')
major_version = int(version_parts[0])
minor_version = int(version_parts[1])

if major_version >= 3 and minor_version >= 8:
    print(f"{Colors.GREEN}[PASS]{Colors.RESET} Python version {python_version} is compatible.")
    tests_passed += 1
else:
    print(f"{Colors.RED}[FAIL]{Colors.RESET} Python version {python_version} is not compatible. Please use Python 3.8 or higher.")
    tests_failed += 1

# Test 2: Check required Python packages
print(f"\n{Colors.BLUE}[TEST]{Colors.RESET} Checking required Python packages...")
required_packages = [
    'fastapi', 'uvicorn', 'pandas', 'numpy', 'matplotlib', 'scikit-learn', 
    'requests', 'python-dotenv', 'plotly'
]
missing_packages = []

for package in required_packages:
    spec = importlib.util.find_spec(package)
    if spec is None:
        missing_packages.append(package)

if not missing_packages:
    print(f"{Colors.GREEN}[PASS]{Colors.RESET} All required Python packages are installed.")
    tests_passed += 1
else:
    print(f"{Colors.RED}[FAIL]{Colors.RESET} Missing required Python packages: {', '.join(missing_packages)}")
    print("Please run: pip install -r requirements.txt")
    tests_failed += 1

# Test 3: Check if we can load environment variables from parent directory
print(f"\n{Colors.BLUE}[TEST]{Colors.RESET} Checking environment variables...")
parent_env_file = Path('../.env')
eod_api_key = None
mistral_api_key = None

if parent_env_file.exists():
    try:
        from dotenv import load_dotenv
        env_loaded = load_dotenv(parent_env_file)
        
        if env_loaded:
            eod_api_key = os.environ.get('EOD_API_KEY')
            mistral_api_key = os.environ.get('MISTRAL_API_KEY')
            
            if eod_api_key and mistral_api_key:
                print(f"{Colors.GREEN}[PASS]{Colors.RESET} Environment variables loaded successfully.")
                tests_passed += 1
            else:
                missing_vars = []
                if not eod_api_key:
                    missing_vars.append('EOD_API_KEY')
                if not mistral_api_key:
                    missing_vars.append('MISTRAL_API_KEY')
                print(f"{Colors.YELLOW}[WARNING]{Colors.RESET} Some environment variables are missing: {', '.join(missing_vars)}")
                tests_warning += 1
        else:
            print(f"{Colors.YELLOW}[WARNING]{Colors.RESET} Failed to load environment variables from parent .env file.")
            tests_warning += 1
    except ImportError:
        print(f"{Colors.YELLOW}[WARNING]{Colors.RESET} python-dotenv package not installed, could not load environment variables.")
        tests_warning += 1
else:
    print(f"{Colors.YELLOW}[WARNING]{Colors.RESET} Parent .env file not found.")
    tests_warning += 1

# Test 4: Test FastAPI
print(f"\n{Colors.BLUE}[TEST]{Colors.RESET} Testing FastAPI setup...")
try:
    from fastapi import FastAPI
    app = FastAPI()
    print(f"{Colors.GREEN}[PASS]{Colors.RESET} FastAPI can be initialized.")
    tests_passed += 1
except Exception as e:
    print(f"{Colors.RED}[FAIL]{Colors.RESET} FastAPI could not be initialized: {str(e)}")
    tests_failed += 1

# Test 5: Check if app directory structure is correct
print(f"\n{Colors.BLUE}[TEST]{Colors.RESET} Checking app directory structure...")
required_files = [
    'app/main.py',
    'app/analysis/numerical_analysis.py',
    'app/analysis/chart_selection.py',
    'app/utils/data_processing.py'
]
missing_files = []

for file_path in required_files:
    if not Path(file_path).exists():
        missing_files.append(file_path)

if not missing_files:
    print(f"{Colors.GREEN}[PASS]{Colors.RESET} All required files exist.")
    tests_passed += 1
else:
    print(f"{Colors.RED}[FAIL]{Colors.RESET} Missing required files: {', '.join(missing_files)}")
    tests_failed += 1

# Test 6: Test EOD API key (if available)
if eod_api_key:
    print(f"\n{Colors.BLUE}[TEST]{Colors.RESET} Testing EOD API key...")
    try:
        response = requests.get(
            f"https://eodhistoricaldata.com/api/eod/AAPL",
            params={"api_token": eod_api_key, "limit": 1, "fmt": "json"}
        )
        if response.status_code == 200:
            try:
                data = response.json()
                if isinstance(data, list):
                    print(f"{Colors.GREEN}[PASS]{Colors.RESET} EOD API key is valid.")
                    tests_passed += 1
                else:
                    print(f"{Colors.YELLOW}[WARNING]{Colors.RESET} EOD API response was successful but returned unexpected data format.")
                    tests_warning += 1
            except json.JSONDecodeError:
                print(f"{Colors.RED}[FAIL]{Colors.RESET} EOD API returned non-JSON response.")
                tests_failed += 1
        else:
            print(f"{Colors.RED}[FAIL]{Colors.RESET} EOD API returned status code {response.status_code}.")
            tests_failed += 1
    except Exception as e:
        print(f"{Colors.RED}[FAIL]{Colors.RESET} Error testing EOD API: {str(e)}")
        tests_failed += 1
else:
    print(f"\n{Colors.YELLOW}[SKIP]{Colors.RESET} EOD API key not available, skipping test.")

# Print summary
print(f"\n{Colors.BRIGHT}=== Test Summary ==={Colors.RESET}")
print(f"Tests passed: {Colors.GREEN}{tests_passed}{Colors.RESET}")
print(f"Tests failed: {Colors.RED}{tests_failed}{Colors.RESET}")
print(f"Warnings: {Colors.YELLOW}{tests_warning}{Colors.RESET}")

if tests_failed > 0:
    print(f"\n{Colors.RED}[ERROR]{Colors.RESET} Configuration test failed. Please fix the issues and run the test again.")
    sys.exit(1)
elif tests_warning > 0:
    print(f"\n{Colors.YELLOW}[WARNING]{Colors.RESET} Configuration test passed with warnings. Some features may not work correctly.")
    sys.exit(0)
else:
    print(f"\n{Colors.GREEN}[SUCCESS]{Colors.RESET} All configuration tests passed!")
    sys.exit(0)
