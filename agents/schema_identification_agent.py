"""
Schema Identification Agent - Agent 1

This agent is responsible for:
1. Loading CSV files from data sources
2. Extracting and analyzing column schemas
3. Mapping inconsistent field names to unified schema using LLM logic
4. Saving schema mappings for later use by other agents
5. Providing functions to transform data according to mappings
"""

import os
import json
import pandas as pd
import logging
from typing import Dict, List, Optional, Tuple
from datetime import datetime
from pathlib import Path

# Import our utility modules
from utils.config import UNIFIED_SCHEMA
from utils.llm_service import LLMSchemaMapper

# Define defaults here since they are no longer in config
DATA_SOURCES_DIR = "data_sources"
SCHEMA_MAPPINGS_DIR = "schema_mappings"
SUPPORTED_FILE_TYPES = [".csv", ".xlsx", ".json"]

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SchemaIdentificationAgent:
    """
    AI-powered agent that identifies, analyzes, and maps data schemas from various sources
    to a unified schema structure for customer data integration.
    """
    
    def __init__(self, data_sources_dir: str = DATA_SOURCES_DIR, 
                 schema_mappings_dir: str = SCHEMA_MAPPINGS_DIR):
        """
        Initialize the Schema Identification Agent.
        
        Args:
            data_sources_dir (str): Directory containing source data files
            schema_mappings_dir (str): Directory to save schema mapping files
        """
        self.data_sources_dir = data_sources_dir
        self.schema_mappings_dir = schema_mappings_dir
        self.llm_mapper = LLMSchemaMapper()  # Uses config default
        
        # Ensure directories exist
        self._ensure_directories()
        
        # Store discovered sources and their mappings
        self.discovered_sources = {}
        self.schema_mappings = {}
        
        logger.info(f"Schema Identification Agent initialized")
        logger.info(f"Data sources directory: {self.data_sources_dir}")
        logger.info(f"Schema mappings directory: {self.schema_mappings_dir}")
    
    def _ensure_directories(self):
        """
        Ensure that required directories exist, create them if they don't.
        """
        Path(self.data_sources_dir).mkdir(parents=True, exist_ok=True)
        Path(self.schema_mappings_dir).mkdir(parents=True, exist_ok=True)
        logger.info("Ensured all required directories exist")
    
    def discover_data_sources(self) -> Dict[str, Dict]:
        """
        Discover and catalog all data source files in the data sources directory.
        
        Returns:
            Dict[str, Dict]: Dictionary of discovered sources with metadata
        """
        logger.info(f"Discovering data sources in: {self.data_sources_dir}")
        
        discovered = {}
        
        # Scan for supported file types
        data_dir = Path(self.data_sources_dir)
        for file_path in data_dir.iterdir():
            if file_path.is_file() and file_path.suffix.lower() in SUPPORTED_FILE_TYPES:
                source_name = file_path.stem  # filename without extension
                
                # Get file metadata
                file_stats = file_path.stat()
                source_info = {
                    'file_path': str(file_path),
                    'file_name': file_path.name,
                    'file_type': file_path.suffix.lower(),
                    'file_size': file_stats.st_size,
                    'modified_time': datetime.fromtimestamp(file_stats.st_mtime).isoformat(),
                    'source_name': source_name
                }
                
                discovered[source_name] = source_info
                logger.info(f"Discovered source: {source_name} ({file_path.name})")
        
        self.discovered_sources = discovered
        logger.info(f"Total sources discovered: {len(discovered)}")
        return discovered
    
    def extract_schema_from_source(self, source_name: str) -> Optional[List[str]]:
        """
        Extract column schema (field names) from a specific data source.
        
        Args:
            source_name (str): Name of the source to extract schema from
            
        Returns:
            Optional[List[str]]: List of column names, or None if extraction fails
        """
        if source_name not in self.discovered_sources:
            logger.error(f"Source '{source_name}' not found in discovered sources")
            return None
        
        source_info = self.discovered_sources[source_name]
        file_path = source_info['file_path']
        file_type = source_info['file_type']
        
        try:
            # Load data based on file type
            if file_type == '.csv':
                df = pd.read_csv(file_path, nrows=0)  # Read only headers
            elif file_type == '.xlsx':
                df = pd.read_excel(file_path, nrows=0)  # Read only headers
            elif file_type == '.json':
                # For JSON, read first record to infer schema
                df = pd.read_json(file_path, lines=True, nrows=1)
            else:
                logger.error(f"Unsupported file type: {file_type}")
                return None
            
            schema = df.columns.tolist()
            logger.info(f"Extracted schema from {source_name}: {schema}")
            return schema
            
        except Exception as e:
            logger.error(f"Failed to extract schema from {source_name}: {str(e)}")
            return None
    
    def generate_schema_mapping(self, source_name: str) -> Optional[Dict]:
        """
        Generate a complete schema mapping for a source using LLM-powered analysis.
        
        Args:
            source_name (str): Name of the source to generate mapping for
            
        Returns:
            Optional[Dict]: Complete mapping dictionary, or None if generation fails
        """
        logger.info(f"Generating schema mapping for source: {source_name}")
        
        # Extract schema from source
        source_fields = self.extract_schema_from_source(source_name)
        if not source_fields:
            logger.error(f"Cannot generate mapping - failed to extract schema from {source_name}")
            return None
        
        # Use LLM service to generate mappings
        # mapping_result = self.llm_mapper.generate_schema_mapping(source_fields, source_name)
        # New implementation: iterate over each source field and call map_field_to_unified_schema
        mappings = {}
        unmapped_fields = []
        high_confidence = 0
        medium_confidence = 0
        low_confidence = 0
        for field in source_fields:
            unified_field, confidence = self.llm_mapper.map_field_to_unified_schema(field, source_fields)
            if unified_field:
                mappings[field] = {
                    "unified_field": unified_field,
                    "confidence": confidence,
                    "mapping_type": "high" if confidence >= 0.9 else "medium" if confidence >= 0.7 else "low"
                }
                if confidence >= 0.9:
                    high_confidence += 1
                elif confidence >= 0.7:
                    medium_confidence += 1
                else:
                    low_confidence += 1
            else:
                unmapped_fields.append(field)
        
        mapping_result = {
            "source_name": source_name,
            "source_fields": source_fields,
            "mappings": mappings,
            "unmapped_fields": unmapped_fields,
            "mapping_stats": {
                "total_fields": len(source_fields),
                "mapped_fields": len(mappings),
                "high_confidence": high_confidence,
                "medium_confidence": medium_confidence,
                "low_confidence": low_confidence,
                "success_rate": len(mappings) / len(source_fields) if source_fields else 0
            }
        }
        
        # Add timestamp and version info
        mapping_result['generated_at'] = datetime.now().isoformat()
        mapping_result['agent_version'] = '1.0.0'
        mapping_result['unified_schema_version'] = '1.0.0'
        
        # Store in memory
        self.schema_mappings[source_name] = mapping_result
        
        logger.info(f"Generated mapping for {source_name}: "
                   f"{mapping_result['mapping_stats']['mapped_fields']}/{mapping_result['mapping_stats']['total_fields']} "
                   f"fields mapped ({mapping_result['mapping_stats']['success_rate']:.1%} success rate)")
        
        return mapping_result
    
    def save_schema_mapping(self, source_name: str, mapping: Optional[Dict] = None) -> bool:
        """
        Save schema mapping to a JSON file for later use.
        
        Args:
            source_name (str): Name of the source
            mapping (Optional[Dict]): Mapping to save, or None to use stored mapping
            
        Returns:
            bool: True if save successful, False otherwise
        """
        # Use provided mapping or get from stored mappings
        if mapping is None:
            mapping = self.schema_mappings.get(source_name)
        
        if not mapping:
            logger.error(f"No mapping available to save for source: {source_name}")
            return False
        
        # Create filename
        mapping_filename = f"{source_name}_schema_map.json"
        mapping_path = Path(self.schema_mappings_dir) / mapping_filename
        
        try:
            # Save mapping to JSON file
            with open(mapping_path, 'w', encoding='utf-8') as f:
                json.dump(mapping, f, indent=2, ensure_ascii=False)
            
            logger.info(f"Saved schema mapping to: {mapping_path}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to save mapping for {source_name}: {str(e)}")
            return False
    
    def load_schema_mapping(self, source_name: str) -> Optional[Dict]:
        """
        Load a previously saved schema mapping from file.
        
        Args:
            source_name (str): Name of the source
            
        Returns:
            Optional[Dict]: Loaded mapping, or None if load fails
        """
        mapping_filename = f"{source_name}_schema_map.json"
        mapping_path = Path(self.schema_mappings_dir) / mapping_filename
        
        if not mapping_path.exists():
            logger.warning(f"Mapping file not found: {mapping_path}")
            return None
        
        try:
            with open(mapping_path, 'r', encoding='utf-8') as f:
                mapping = json.load(f)
            
            logger.info(f"Loaded schema mapping from: {mapping_path}")
            return mapping
            
        except Exception as e:
            logger.error(f"Failed to load mapping for {source_name}: {str(e)}")
            return None
    
    def map_to_unified_schema(self, df: pd.DataFrame, schema_map: Dict) -> pd.DataFrame:
        """
        Transform a DataFrame according to a schema mapping to match the unified schema.
        
        Args:
            df (pd.DataFrame): Source DataFrame to transform
            schema_map (Dict): Schema mapping dictionary
            
        Returns:
            pd.DataFrame: Transformed DataFrame with unified schema field names
        """
        logger.info("Applying schema mapping to DataFrame")
        
        # Create a copy to avoid modifying original
        mapped_df = df.copy()
        
        # Extract the field mappings
        mappings = schema_map.get('mappings', {})
        
        # Build rename dictionary from source field to unified field
        rename_dict = {}
        for source_field, mapping_info in mappings.items():
            unified_field = mapping_info['unified_field']
            if source_field in mapped_df.columns:
                rename_dict[source_field] = unified_field
        
        # Rename columns
        mapped_df = mapped_df.rename(columns=rename_dict)
        
        # Add missing unified schema columns with None values
        for unified_field in UNIFIED_SCHEMA.keys():
            if unified_field not in mapped_df.columns:
                mapped_df[unified_field] = None
                logger.debug(f"Added missing unified field: {unified_field}")
        
        # Reorder columns to match unified schema order
        unified_columns = list(UNIFIED_SCHEMA.keys())
        # Only include columns that exist in the DataFrame
        available_columns = [col for col in unified_columns if col in mapped_df.columns]
        mapped_df = mapped_df[available_columns]
        
        logger.info(f"Successfully mapped DataFrame: {len(rename_dict)} fields renamed, "
                   f"{len(available_columns)} unified fields in result")
        
        return mapped_df
    
    def process_all_sources(self) -> Dict[str, bool]:
        """
        Discover all sources and generate schema mappings for each one.
        
        Returns:
            Dict[str, bool]: Results of processing each source (True=success, False=failure)
        """
        logger.info("Starting processing of all data sources")
        
        # Discover all sources
        discovered = self.discover_data_sources()
        results = {}
        
        # Process each discovered source
        for source_name in discovered.keys():
            logger.info(f"Processing source: {source_name}")
            
            try:
                # Generate mapping
                mapping = self.generate_schema_mapping(source_name)
                if mapping:
                    # Save mapping
                    save_success = self.save_schema_mapping(source_name, mapping)
                    results[source_name] = save_success
                else:
                    results[source_name] = False
                    
            except Exception as e:
                logger.error(f"Failed to process source {source_name}: {str(e)}")
                results[source_name] = False
        
        # Log summary
        successful = sum(1 for success in results.values() if success)
        total = len(results)
        logger.info(f"Processing complete: {successful}/{total} sources processed successfully")
        
        return results
    
    def get_mapping_summary(self) -> Dict[str, Dict]:
        """
        Get a summary of all generated schema mappings.
        
        Returns:
            Dict[str, Dict]: Summary statistics for each source mapping
        """
        summary = {}
        
        for source_name, mapping in self.schema_mappings.items():
            stats = mapping.get('mapping_stats', {})
            summary[source_name] = {
                'total_fields': stats.get('total_fields', 0),
                'mapped_fields': stats.get('mapped_fields', 0),
                'success_rate': stats.get('success_rate', 0),
                'high_confidence': stats.get('high_confidence', 0),
                'medium_confidence': stats.get('medium_confidence', 0),
                'low_confidence': stats.get('low_confidence', 0),
                'unmapped_fields': len(mapping.get('unmapped_fields', []))
            }
        
        return summary
    
    def validate_mapping(self, source_name: str, mapping: Optional[Dict] = None) -> Dict[str, bool]:
        """
        Validate a schema mapping for completeness and correctness.
        
        Args:
            source_name (str): Name of the source
            mapping (Optional[Dict]): Mapping to validate, or None to use stored mapping
            
        Returns:
            Dict[str, bool]: Validation results
        """
        if mapping is None:
            mapping = self.schema_mappings.get(source_name)
        
        if not mapping:
            return {'valid': False, 'error': 'No mapping found'}
        
        validation_results = {
            'valid': True,
            'has_mappings': bool(mapping.get('mappings')),
            'has_stats': bool(mapping.get('mapping_stats')),
            'has_timestamp': bool(mapping.get('generated_at')),
            'all_unified_fields_valid': True,
            'confidence_scores_valid': True
        }
        
        # Validate unified field names
        mappings = mapping.get('mappings', {})
        valid_unified_fields = set(UNIFIED_SCHEMA.keys())
        
        for source_field, mapping_info in mappings.items():
            unified_field = mapping_info.get('unified_field')
            confidence = mapping_info.get('confidence', 0)
            
            if unified_field not in valid_unified_fields:
                validation_results['all_unified_fields_valid'] = False
                logger.warning(f"Invalid unified field in mapping: {unified_field}")
            
            if not (0 <= confidence <= 1):
                validation_results['confidence_scores_valid'] = False
                logger.warning(f"Invalid confidence score: {confidence}")
        
        # Overall validation
        validation_results['valid'] = all([
            validation_results['has_mappings'],
            validation_results['has_stats'],
            validation_results['all_unified_fields_valid'],
            validation_results['confidence_scores_valid']
        ])
        
        return validation_results 