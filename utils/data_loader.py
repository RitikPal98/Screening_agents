"""
Data Loader utility module for loading data from various sources
and applying schema transformations.
"""

import os
import pandas as pd
import json
import logging
from typing import Dict, List, Optional, Union
from pathlib import Path

# Define defaults here since they are no longer in config
DATA_SOURCES_DIR = "data_sources"
SUPPORTED_FILE_TYPES = [".csv", ".xlsx", ".json"]

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DataLoader:
    """
    Utility class for loading data from various source formats
    and applying schema transformations.
    """
    
    def __init__(self, data_sources_dir: str = DATA_SOURCES_DIR):
        """
        Initialize the Data Loader.
        
        Args:
            data_sources_dir (str): Directory containing source data files
        """
        self.data_sources_dir = data_sources_dir
        logger.info(f"DataLoader initialized with sources directory: {data_sources_dir}")
    
    def load_source_data(self, source_name: str, **kwargs) -> Optional[pd.DataFrame]:
        """
        Load data from a specific source file.
        
        Args:
            source_name (str): Name of the source (filename without extension)
            **kwargs: Additional arguments passed to pandas loading functions
            
        Returns:
            Optional[pd.DataFrame]: Loaded data, or None if loading fails
        """
        # Find the source file
        source_file = self._find_source_file(source_name)
        if not source_file:
            logger.error(f"Source file not found for: {source_name}")
            return None
        
        file_path = Path(self.data_sources_dir) / source_file
        file_extension = file_path.suffix.lower()
        
        try:
            # Load based on file type
            if file_extension == '.csv':
                df = pd.read_csv(file_path, **kwargs)
            elif file_extension == '.xlsx':
                df = pd.read_excel(file_path, **kwargs)
            elif file_extension == '.json':
                df = pd.read_json(file_path, **kwargs)
            else:
                logger.error(f"Unsupported file type: {file_extension}")
                return None
            
            logger.info(f"Loaded {len(df)} rows from {source_name}")
            return df
            
        except Exception as e:
            logger.error(f"Failed to load data from {source_name}: {str(e)}")
            return None
    
    def _find_source_file(self, source_name: str) -> Optional[str]:
        """
        Find the actual filename for a given source name.
        
        Args:
            source_name (str): Name of the source
            
        Returns:
            Optional[str]: Full filename if found, None otherwise
        """
        data_dir = Path(self.data_sources_dir)
        
        # Look for files with supported extensions
        for extension in SUPPORTED_FILE_TYPES:
            potential_file = f"{source_name}{extension}"
            if (data_dir / potential_file).exists():
                return potential_file
        
        return None
    
    def load_all_sources(self) -> Dict[str, pd.DataFrame]:
        """
        Load data from all available source files.
        
        Returns:
            Dict[str, pd.DataFrame]: Dictionary mapping source names to DataFrames
        """
        logger.info("Loading data from all available sources")
        
        all_data = {}
        data_dir = Path(self.data_sources_dir)
        
        # Scan for all supported files
        for file_path in data_dir.iterdir():
            if file_path.is_file() and file_path.suffix.lower() in SUPPORTED_FILE_TYPES:
                source_name = file_path.stem
                df = self.load_source_data(source_name)
                if df is not None:
                    all_data[source_name] = df
                else:
                    logger.warning(f"Failed to load data from: {source_name}")
        
        logger.info(f"Successfully loaded data from {len(all_data)} sources")
        return all_data
    
    def get_source_info(self, source_name: str) -> Optional[Dict]:
        """
        Get information about a specific data source.
        
        Args:
            source_name (str): Name of the source
            
        Returns:
            Optional[Dict]: Source information including schema and stats
        """
        df = self.load_source_data(source_name)
        if df is None:
            return None
        
        # Get basic statistics
        info = {
            'source_name': source_name,
            'row_count': len(df),
            'column_count': len(df.columns),
            'columns': df.columns.tolist(),
            'dtypes': df.dtypes.to_dict(),
            'memory_usage': df.memory_usage(deep=True).sum(),
            'has_nulls': df.isnull().any().to_dict(),
            'null_counts': df.isnull().sum().to_dict()
        }
        
        # Add sample data (first few rows)
        info['sample_data'] = df.head(3).to_dict('records')
        
        return info
    
    def apply_schema_mapping_to_data(self, source_name: str, schema_mapping: Dict) -> Optional[pd.DataFrame]:
        """
        Load source data and apply schema mapping transformation.
        
        Args:
            source_name (str): Name of the source
            schema_mapping (Dict): Schema mapping dictionary
            
        Returns:
            Optional[pd.DataFrame]: Transformed DataFrame with unified schema
        """
        # Load the source data
        df = self.load_source_data(source_name)
        if df is None:
            logger.error(f"Cannot apply mapping - failed to load data from: {source_name}")
            return None
        
        # Import here to avoid circular import
        from agents.schema_identification_agent import SchemaIdentificationAgent
        
        # Create agent instance and apply mapping
        agent = SchemaIdentificationAgent()
        mapped_df = agent.map_to_unified_schema(df, schema_mapping)
        
        logger.info(f"Applied schema mapping to {source_name}: {len(df)} rows transformed")
        return mapped_df
    
    def export_transformed_data(self, df: pd.DataFrame, output_name: str, 
                              output_format: str = 'csv', output_dir: str = 'output') -> bool:
        """
        Export transformed data to a file.
        
        Args:
            df (pd.DataFrame): DataFrame to export
            output_name (str): Name for the output file (without extension)
            output_format (str): Output format ('csv', 'xlsx', 'json')
            output_dir (str): Directory to save the output file
            
        Returns:
            bool: True if export successful, False otherwise
        """
        # Ensure output directory exists
        Path(output_dir).mkdir(parents=True, exist_ok=True)
        
        # Determine file extension and export method
        if output_format.lower() == 'csv':
            file_path = Path(output_dir) / f"{output_name}.csv"
            export_func = lambda: df.to_csv(file_path, index=False)
        elif output_format.lower() == 'xlsx':
            file_path = Path(output_dir) / f"{output_name}.xlsx"
            export_func = lambda: df.to_excel(file_path, index=False)
        elif output_format.lower() == 'json':
            file_path = Path(output_dir) / f"{output_name}.json"
            export_func = lambda: df.to_json(file_path, orient='records', indent=2)
        else:
            logger.error(f"Unsupported output format: {output_format}")
            return False
        
        try:
            export_func()
            logger.info(f"Exported transformed data to: {file_path}")
            return True
        except Exception as e:
            logger.error(f"Failed to export data: {str(e)}")
            return False
    
    def compare_schemas(self, source1: str, source2: str) -> Dict:
        """
        Compare schemas between two data sources.
        
        Args:
            source1 (str): First source name
            source2 (str): Second source name
            
        Returns:
            Dict: Comparison results
        """
        info1 = self.get_source_info(source1)
        info2 = self.get_source_info(source2)
        
        if not info1 or not info2:
            return {'error': 'Could not load one or both sources'}
        
        cols1 = set(info1['columns'])
        cols2 = set(info2['columns'])
        
        comparison = {
            'source1': source1,
            'source2': source2,
            'source1_columns': len(cols1),
            'source2_columns': len(cols2),
            'common_columns': list(cols1.intersection(cols2)),
            'source1_only': list(cols1 - cols2),
            'source2_only': list(cols2 - cols1),
            'similarity_ratio': len(cols1.intersection(cols2)) / len(cols1.union(cols2)) if cols1.union(cols2) else 0
        }
        
        return comparison 