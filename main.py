"""
Main implementation of the Schema Identification Agent.

This script provides the core workflow for Agent 1:
1. Discovering data sources
2. Extracting schemas from each source
3. Generating AI-powered schema mappings
4. Saving mappings for later use
5. Applying mappings to transform data to unified schema
"""

import json
import logging
from pathlib import Path

# Import our modules
from agents.schema_identification_agent import SchemaIdentificationAgent
from utils.data_loader import DataLoader
from utils.config import UNIFIED_SCHEMA

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def main():
    """
    Main function implementing the Schema Identification Agent workflow.
    """
    try:
        # Initialize components
        agent = SchemaIdentificationAgent()
        data_loader = DataLoader()
        
        # Step 1: Discover data sources
        discovered_sources = agent.discover_data_sources()
        
        if not discovered_sources:
            logger.error("No data sources found! Please ensure CSV files are in the data_sources directory.")
            return
        
        # Step 2: Analyze schemas and generate mappings
        mapping_results = {}
        for source_name in discovered_sources.keys():
            mapping = agent.generate_schema_mapping(source_name)
            if mapping:
                mapping_results[source_name] = mapping
        
        # Step 3: Save schema mappings
        for source_name, mapping in mapping_results.items():
            agent.save_schema_mapping(source_name, mapping)
        
        # Step 4: Transform data to unified schema
        output_dir = Path("output")
        output_dir.mkdir(exist_ok=True)
        
        for source_name, mapping in mapping_results.items():
            df = data_loader.load_source_data(source_name)
            if df is not None:
                unified_df = agent.map_to_unified_schema(df, mapping)
                output_file = output_dir / f"{source_name}_unified.csv"
                unified_df.to_csv(output_file, index=False)
        
    except Exception as e:
        logger.error(f"Process failed with error: {str(e)}", exc_info=True)

if __name__ == "__main__":
    main() 