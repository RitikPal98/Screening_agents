"""
Debug script for Profile Matching Agent
"""

import logging
from agents.profile_matching_agent import ProfileMatchingAgent

# Set up debug logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def main():
    print("=== Profile Matching Debug Script ===")
    
    # Initialize the agent
    agent = ProfileMatchingAgent()
    
    # Test query based on actual data
    test_query = {
        "full_name": "Leonardo DiCaprio",
        "dob": "1974-11-11",
        "national_id": "BANK001"
    }
    
    print(f"\nTesting with query: {test_query}")
    
    # Load data first
    print("\n1. Loading processed data...")
    data = agent.load_processed_data()
    print(f"Loaded data from {len(data)} sources: {list(data.keys())}")
    
    if not data:
        print("ERROR: No data loaded!")
        return
    
    # Show sample data
    for source_name, df in data.items():
        print(f"\nSource: {source_name}")
        print(f"Columns: {list(df.columns)}")
        print(f"Sample record:")
        if len(df) > 0:
            sample = df.iloc[0].to_dict()
            for key, value in sample.items():
                print(f"  {key}: {value}")
    
    # Test matching
    print(f"\n2. Testing profile matching...")
    result = agent.find_and_merge_profile(test_query)
    
    if result:
        print(f"\n✅ SUCCESS! Found matching profile:")
        print(f"Sources: {result.get('sources', [])}")
        print(f"Match quality: {result.get('match_quality', {})}")
        print(f"Full profile: {result}")
    else:
        print(f"\n❌ No matching profile found")
    
    # Test with simpler query
    print(f"\n3. Testing with name-only query...")
    simple_query = {"full_name": "Leonardo DiCaprio"}
    result2 = agent.find_and_merge_profile(simple_query)
    
    if result2:
        print(f"✅ SUCCESS with simple query!")
        print(f"Match quality: {result2.get('match_quality', {})}")
    else:
        print(f"❌ No match with simple query")

if __name__ == "__main__":
    main() 