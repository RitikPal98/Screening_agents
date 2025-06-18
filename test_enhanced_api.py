#!/usr/bin/env python3
"""
Test script for the enhanced Profile Matching API
Tests the new functionality that returns all individual matches
"""

import requests
import json
import time

API_BASE_URL = "http://localhost:5000"

def test_api_health():
    """Test API health endpoint"""
    print("🔍 Testing API health...")
    try:
        response = requests.get(f"{API_BASE_URL}/health", timeout=10)
        response.raise_for_status()
        print("✅ API is healthy")
        return True
    except Exception as e:
        print(f"❌ API health check failed: {e}")
        return False

def test_profile_search():
    """Test enhanced profile search that returns all matches"""
    print("\n🔍 Testing enhanced profile search...")
    
    test_cases = [
        {
            "name": "Leonardo DiCaprio Test",
            "query": {
                "full_name": "Leonardo DiCaprio",
                "dob": "1974-11-11",
                "national_id": "BANK001"
            }
        },
        {
            "name": "John Doe Test", 
            "query": {
                "full_name": "John Doe",
                "dob": "1985-03-15"
            }
        },
        {
            "name": "Kate Winslet Test",
            "query": {
                "full_name": "Kate Winslet"
            }
        }
    ]
    
    for test_case in test_cases:
        print(f"\n📋 Running {test_case['name']}...")
        print(f"   Query: {test_case['query']}")
        
        try:
            response = requests.post(
                f"{API_BASE_URL}/match-profile",
                json=test_case['query'],
                timeout=30
            )
            response.raise_for_status()
            result = response.json()
            
            if result.get('success'):
                # Check for merged profile
                merged_profile = result.get('profile')
                individual_matches = result.get('individual_matches', [])
                match_summary = result.get('match_summary', {})
                
                print(f"   ✅ Search successful!")
                print(f"   📊 Match Summary:")
                print(f"      - Total matches: {match_summary.get('total_matches', 0)}")
                print(f"      - Sources matched: {match_summary.get('sources_matched', 0)}")
                print(f"      - Highest score: {match_summary.get('highest_score', 0):.1f}%")
                print(f"      - Strong matches: {'Yes' if match_summary.get('has_strong_matches') else 'No'}")
                
                if merged_profile:
                    print(f"   🎯 Merged Profile:")
                    print(f"      - Name: {merged_profile.get('full_name', 'N/A')}")
                    print(f"      - Sources: {len(merged_profile.get('sources', []))}")
                    print(f"      - Match Score: {merged_profile.get('match_quality', {}).get('overall_score', 0):.1f}%")
                
                if individual_matches:
                    print(f"   📄 Individual Matches ({len(individual_matches)}):")
                    for i, match in enumerate(individual_matches[:3], 1):  # Show first 3
                        source = match.get('source_name', 'Unknown')
                        score = match.get('match_info', {}).get('match_score', 0)
                        is_strong = match.get('match_info', {}).get('is_strong_match', False)
                        print(f"      {i}. {source}: {score:.1f}% {'(Strong)' if is_strong else ''}")
                    
                    if len(individual_matches) > 3:
                        print(f"      ... and {len(individual_matches) - 3} more matches")
                
                if match_summary.get('source_breakdown'):
                    print(f"   📂 Source Breakdown:")
                    for source, count in match_summary['source_breakdown'].items():
                        print(f"      - {source}: {count} matches")
                        
            else:
                print(f"   ❌ Search failed: {result.get('error', 'Unknown error')}")
                
        except Exception as e:
            print(f"   ❌ Request failed: {e}")
        
        time.sleep(1)  # Brief pause between tests

def test_data_sources():
    """Test data sources endpoint"""
    print("\n🔍 Testing data sources endpoint...")
    try:
        response = requests.get(f"{API_BASE_URL}/data-sources", timeout=10)
        response.raise_for_status()
        result = response.json()
        
        if result.get('success'):
            sources = result.get('sources', [])
            total_records = sum(source.get('record_count', 0) for source in sources)
            print(f"   ✅ Found {len(sources)} data sources with {total_records} total records")
            
            for source in sources:
                print(f"      - {source.get('name')}: {source.get('record_count')} records, {len(source.get('columns', []))} fields")
        else:
            print(f"   ❌ Failed: {result.get('error')}")
            
    except Exception as e:
        print(f"   ❌ Request failed: {e}")

def test_schema_mappings():
    """Test schema mappings endpoint"""
    print("\n🔍 Testing schema mappings endpoint...")
    try:
        response = requests.get(f"{API_BASE_URL}/schema-mappings", timeout=10)
        response.raise_for_status()
        result = response.json()
        
        if result.get('success'):
            mappings = result.get('mappings', [])
            total_fields = sum(mapping.get('field_count', 0) for mapping in mappings)
            avg_confidence = sum(mapping.get('confidence_avg', 0) for mapping in mappings) / len(mappings) if mappings else 0
            
            print(f"   ✅ Found {len(mappings)} schema mappings with {total_fields} total mapped fields")
            print(f"   📊 Average mapping confidence: {avg_confidence:.1f}%")
            
            for mapping in mappings:
                print(f"      - {mapping.get('source')}: {mapping.get('field_count')} fields, {mapping.get('confidence_avg', 0):.1f}% confidence")
        else:
            print(f"   ❌ Failed: {result.get('error')}")
            
    except Exception as e:
        print(f"   ❌ Request failed: {e}")

def main():
    """Run all tests"""
    print("🚀 Enhanced Profile Matching API Test Suite")
    print("=" * 50)
    
    # Test API health first
    if not test_api_health():
        print("❌ API is not responding. Make sure to run 'python app.py' first.")
        return
    
    # Test other endpoints
    test_data_sources()
    test_schema_mappings()
    test_profile_search()
    
    print("\n" + "=" * 50)
    print("✅ Test suite completed!")
    print("🎯 The enhanced API now returns:")
    print("   - Merged profile (best match from all sources)")
    print("   - All individual matches with scores and source info")
    print("   - Comprehensive match summary with statistics")
    print("   - Enhanced metadata for better UI display")

if __name__ == "__main__":
    main() 