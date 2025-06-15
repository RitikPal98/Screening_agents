"""
Test script for Flask API
"""

import requests
import json

API_URL = "http://localhost:5000"

def test_health():
    """Test health endpoint"""
    try:
        response = requests.get(f"{API_URL}/health")
        print(f"Health check: {response.status_code}")
        if response.status_code == 200:
            print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"Health check failed: {e}")
        return False

def test_profile_matching():
    """Test profile matching endpoint"""
    test_query = {
        "full_name": "Leonardo DiCaprio",
        "dob": "1974-11-11",
        "national_id": "BANK001"
    }
    
    try:
        response = requests.post(f"{API_URL}/match-profile", json=test_query)
        print(f"\nProfile matching: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"Success: {result['success']}")
            if result['profile']:
                print(f"Found profile from sources: {result['profile'].get('sources', [])}")
                print(f"Match quality: {result['metadata'].get('match_quality', {})}")
            else:
                print("No profile found")
        else:
            print(f"Error: {response.text}")
        return response.status_code == 200
    except Exception as e:
        print(f"Profile matching failed: {e}")
        return False

def test_test_data():
    """Test test data endpoint"""
    try:
        response = requests.get(f"{API_URL}/test-data")
        print(f"\nTest data: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"Test cases available: {len(result['test_cases'])}")
            for i, case in enumerate(result['test_cases']):
                print(f"  {i+1}. {case['full_name']} ({case['dob']})")
        return response.status_code == 200
    except Exception as e:
        print(f"Test data failed: {e}")
        return False

def main():
    print("=== Flask API Test ===")
    
    # Test health
    if not test_health():
        print("❌ API is not responding. Make sure Flask server is running.")
        return
    
    # Test profile matching
    if test_profile_matching():
        print("✅ Profile matching is working!")
    else:
        print("❌ Profile matching failed")
    
    # Test test data
    if test_test_data():
        print("✅ Test data endpoint is working!")
    else:
        print("❌ Test data endpoint failed")

if __name__ == "__main__":
    main() 