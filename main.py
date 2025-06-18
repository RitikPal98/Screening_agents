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
from agents.schema_identification_agent import EnhancedSchemaIdentificationAgent
from utils.data_loader import DataLoader

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
        # Initialize enhanced agent with auto-schema extension
        agent = EnhancedSchemaIdentificationAgent(auto_extend_schema=True)
        
        logger.info("🤖 Starting Enhanced Schema Identification Agent...")
        logger.info("Features: Structured & Unstructured data processing, Dynamic schema evolution")
        
        # Process all data sources intelligently
        results = agent.discover_and_process_all_sources()
        
        if not results:
            logger.error("No data sources found! Please ensure files are in the data_sources directory.")
            return
        
        # Print processing summary
        success_count = sum(1 for r in results.values() if r['status'] == 'success')
        total_records = sum(r.get('records_processed', 0) for r in results.values() if r['status'] == 'success')
        
        logger.info(f"✅ Processing complete!")
        logger.info(f"   Sources processed: {success_count}/{len(results)}")
        logger.info(f"   Total records: {total_records}")
        
        # Get processing summary
        summary = agent.get_processing_summary()
        logger.info(f"   Schema fields: {summary['unified_schema_fields']}")
        logger.info(f"   Unmapped fields: {summary['unmapped_fields_count']}")
        
        # Create output directory for Agent 2 compatibility
        output_dir = Path("output")
        output_dir.mkdir(exist_ok=True)
        
        # Copy processed files to output directory with Agent 2 compatible naming
        processed_dir = Path("processed_data")
        if processed_dir.exists():
            for file in processed_dir.glob("*.csv"):
                # Copy with _unified suffix for Agent 2 compatibility
                output_file = output_dir / f"{file.stem}_unified.csv"
                import shutil
                shutil.copy2(file, output_file)
                logger.info(f"   Created: {output_file}")
        
        logger.info("🎯 Ready for Agent 2 - Profile Matching!")
        
    except Exception as e:
        logger.error(f"Process failed with error: {str(e)}", exc_info=True)

if __name__ == "__main__":
    main() 