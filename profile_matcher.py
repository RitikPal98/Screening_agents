"""
Main script for running the Profile Matching Agent (Agent 2).
This script assumes that Agent 1 has already been run and its outputs are available.
"""

import json
import logging
from pathlib import Path
from agents.profile_matching_agent import ProfileMatchingAgent

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def main():
    """
    Main function to run the Profile Matching Agent.
    """
    try:
        # Verify that required directories and files exist
        output_dir = Path("output")
        schema_mappings_dir = Path("schema_mappings")
        
        if not output_dir.exists():
            logger.error("Output directory not found! Please run Agent 1 first.")
            return
        
        if not schema_mappings_dir.exists():
            logger.error("Schema mappings directory not found! Please run Agent 1 first.")
            return
        
        # Check for unified data files
        unified_files = list(output_dir.glob("*_unified.csv"))
        if not unified_files:
            logger.error("No unified data files found in output directory! Please run Agent 1 first.")
            return
        
        # Check for schema mapping files
        mapping_files = list(schema_mappings_dir.glob("*_schema_map.json"))
        if not mapping_files:
            logger.error("No schema mapping files found! Please run Agent 1 first.")
            return
        
        logger.info(f"Found {len(unified_files)} unified data files and {len(mapping_files)} schema mapping files")
        
        # Example query
        query = {
            "fullname": "Leonardo DiCaprio",
            "dob": "1974-11-11",
            "client_id": "BANK001"
        }
        
        # Initialize Agent 2
        logger.info("Initializing Profile Matching Agent...")
        agent2 = ProfileMatchingAgent()
        
        # Find and merge profiles
        logger.info("Searching for matching profiles...")
        profile = agent2.find_and_merge_profile(query)
        
        if profile:
            logger.info("Found matching profile:")
            print("\nMerged Profile:")
            print(json.dumps(profile, indent=2))
        else:
            logger.info("No matching profile found")
        
    except Exception as e:
        logger.error(f"Process failed with error: {str(e)}", exc_info=True)

if __name__ == "__main__":
    main() 