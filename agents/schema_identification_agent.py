"""
Enhanced Schema Identification Agent - Intelligent & Robust Version

This enhanced agent handles:
1. Structured datasets (with column headers)
2. Unstructured datasets (free-text data)
3. Dynamic schema evolution with unmapped field handling
4. Intelligent name handling (first_name, last_name, full_name)
5. LLM-powered field extraction from unstructured text
"""

import os
import json
import pandas as pd
import logging
import re
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
from functools import lru_cache
import hashlib
from tqdm import tqdm

# Import our utility modules
from utils.llm_service import LLMSchemaMapper

# Configuration constants
DATA_SOURCES_DIR = "data_sources"
PROCESSED_DATA_DIR = "processed_data"
SCHEMA_MAPPINGS_DIR = "schema_mappings"
UNIFIED_SCHEMA_FILE = "unified_schema.json"
UNMAPPED_FIELDS_FILE = "unmapped_fields.json"
SUPPORTED_FILE_TYPES = [".csv", ".xlsx", ".json"]
BATCH_SIZE = 1000  # Number of records to process at once
MAX_WORKERS = 4    # Number of parallel workers

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EnhancedSchemaIdentificationAgent:
    """
    Enhanced AI-powered agent that intelligently handles both structured and unstructured
    data sources, with dynamic schema evolution capabilities.
    """
    
    def __init__(self, 
                 data_sources_dir: str = DATA_SOURCES_DIR,
                 processed_data_dir: str = PROCESSED_DATA_DIR,
                 schema_mappings_dir: str = SCHEMA_MAPPINGS_DIR,
                 auto_extend_schema: bool = True,
                 max_workers: int = MAX_WORKERS,
                 batch_size: int = BATCH_SIZE):
        """
        Initialize the Enhanced Schema Identification Agent.
        
        Args:
            data_sources_dir (str): Directory containing source data files
            processed_data_dir (str): Directory to save processed data files
            schema_mappings_dir (str): Directory to save schema mapping files
            auto_extend_schema (bool): Whether to automatically extend unified schema
            max_workers (int): Maximum number of parallel workers
            batch_size (int): Number of records to process at once
        """
        self.data_sources_dir = data_sources_dir
        self.processed_data_dir = processed_data_dir
        self.schema_mappings_dir = schema_mappings_dir
        self.auto_extend_schema = auto_extend_schema
        self.max_workers = max_workers
        self.batch_size = batch_size
        self.llm_mapper = LLMSchemaMapper()
        
        # Ensure directories exist
        self._ensure_directories()
        
        # Load or create unified schema
        self.unified_schema = self._load_unified_schema()
        
        # Load or create unmapped fields log
        self.unmapped_fields = self._load_unmapped_fields()
        
        # Store discovered sources and their mappings
        self.discovered_sources = {}
        self.schema_mappings = {}
        
        # Initialize cache
        self._init_cache()
        
        logger.info(f"Enhanced Schema Identification Agent initialized")
        logger.info(f"Data sources directory: {self.data_sources_dir}")
        logger.info(f"Processed data directory: {self.processed_data_dir}")
        logger.info(f"Schema mappings directory: {self.schema_mappings_dir}")
        logger.info(f"Auto-extend schema: {self.auto_extend_schema}")
        logger.info(f"Unified schema fields: {list(self.unified_schema.keys())}")
        logger.info(f"Max workers: {self.max_workers}")
        logger.info(f"Batch size: {self.batch_size}")
    
    def _init_cache(self):
        """Initialize LRU cache for schema mappings."""
        self._get_cached_mapping = lru_cache(maxsize=100)(self._get_cached_mapping)
    
    def _load_unified_schema(self) -> Dict[str, str]:
        """
        Load unified schema from disk or create default if not exists.
        
        Returns:
            Dict[str, str]: Unified schema definition
        """
        schema_file = Path(UNIFIED_SCHEMA_FILE)
        
        if schema_file.exists():
            try:
                with open(schema_file, 'r') as f:
                    schema = json.load(f)
                logger.info(f"Loaded unified schema from {UNIFIED_SCHEMA_FILE}")
                return schema
            except Exception as e:
                logger.error(f"Error loading unified schema: {str(e)}")
        
        # Create default unified schema
        default_schema = {
            "customer_id": "",
            "first_name": "",
            "last_name": "",
            "full_name": "",
            "dob": "",
            "email": "",
            "phone": "",
            "address": "",
            "national_id": "",
            "country": "",
            "source_name": "",
            "raw_text": ""
        }
        
        self._save_unified_schema(default_schema)
        logger.info(f"Created default unified schema with {len(default_schema)} fields")
        return default_schema
    
    def _save_unified_schema(self, schema: Dict[str, str]):
        """
        Save unified schema to disk.
        
        Args:
            schema (Dict[str, str]): Schema to save
        """
        try:
            with open(UNIFIED_SCHEMA_FILE, 'w') as f:
                json.dump(schema, f, indent=2)
            logger.info(f"Saved unified schema to {UNIFIED_SCHEMA_FILE}")
        except Exception as e:
            logger.error(f"Error saving unified schema: {str(e)}")
    
    def _load_unmapped_fields(self) -> List[Dict]:
        """
        Load unmapped fields log from disk or create empty if not exists.
        
        Returns:
            List[Dict]: List of unmapped field entries
        """
        unmapped_file = Path(UNMAPPED_FIELDS_FILE)
        
        if unmapped_file.exists():
            try:
                with open(unmapped_file, 'r') as f:
                    unmapped = json.load(f)
                logger.info(f"Loaded {len(unmapped)} unmapped field entries")
                return unmapped
            except Exception as e:
                logger.error(f"Error loading unmapped fields: {str(e)}")
        
        return []
    
    def _save_unmapped_fields(self):
        """Save unmapped fields log to disk."""
        try:
            with open(UNMAPPED_FIELDS_FILE, 'w') as f:
                json.dump(self.unmapped_fields, f, indent=2)
            logger.info(f"Saved {len(self.unmapped_fields)} unmapped field entries")
        except Exception as e:
            logger.error(f"Error saving unmapped fields: {str(e)}")
    
    def detect_if_unstructured(self, df: pd.DataFrame) -> bool:
        """
        Determine if a dataset is unstructured (single text column) or structured.
        
        Args:
            df (pd.DataFrame): DataFrame to analyze
            
        Returns:
            bool: True if unstructured, False if structured
        """
        # Check number of columns
        if len(df.columns) <= 1:
            return True
        
        # Check if most columns contain text data that looks like free-form text
        text_columns = 0
        for col in df.columns:
            if df[col].dtype == 'object':
                # Sample some values to check if they look like free-form text
                sample_values = df[col].dropna().head(10)
                for value in sample_values:
                    if isinstance(value, str) and len(value.split()) > 5:  # More than 5 words
                        text_columns += 1
                        break
        
        # If most columns are text-heavy, consider it unstructured
        structured_threshold = max(2, len(df.columns) * 0.7)
        is_unstructured = text_columns >= structured_threshold
        
        logger.info(f"Dataset analysis: {len(df.columns)} columns, {text_columns} text columns, "
                   f"unstructured: {is_unstructured}")
        
        return is_unstructured
    
    def extract_fields_from_unstructured_text(self, text: str) -> Dict[str, str]:
        """
        Extract structured fields from unstructured text using LLM and regex patterns.
        
        Args:
            text (str): Unstructured text to parse
            
        Returns:
            Dict[str, str]: Extracted field values
        """
        extracted = {}
        
        # First try regex patterns for common fields
        patterns = {
            'email': r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
            'phone': r'[\+]?[1-9]?[0-9]{7,15}',
            'national_id': r'\b[A-Z]{2,3}[0-9]{3,10}\b',
            'dob': r'\b(19|20)\d{2}[-/](0[1-9]|1[0-2])[-/](0[1-9]|[12]\d|3[01])\b'
        }
        
        for field, pattern in patterns.items():
            matches = re.findall(pattern, text, re.IGNORECASE)
            if matches:
                extracted[field] = matches[0] if isinstance(matches[0], str) else matches[0][0]
        
        # Use LLM for more sophisticated extraction
        try:
            llm_extracted = self._extract_with_llm(text)
            extracted.update(llm_extracted)
        except Exception as e:
            logger.warning(f"LLM extraction failed: {str(e)}")
        
        return extracted
    
    def _extract_with_llm(self, text: str) -> Dict[str, str]:
        """
        Use LLM to extract structured fields from unstructured text.
        
        Args:
            text (str): Text to analyze
            
        Returns:
            Dict[str, str]: Extracted fields
        """
        prompt = f"""
        Extract structured customer information from the following text.
        Return a JSON object with any of these fields you can identify:
        - full_name (person's complete name)
        - first_name (given name)
        - last_name (family name/surname)
        - email (email address)
        - phone (phone number)
        - address (physical address)
        - dob (date of birth, format: YYYY-MM-DD)
        - national_id (ID number, SSN, etc.)
        - country (country name)
        
        Text to analyze:
        "{text}"
        
        Respond with only a valid JSON object:
        """
        
        try:
            response = self.llm_mapper.gemini_model.generate_content(prompt)
            # Parse JSON from response
            json_match = re.search(r'\{[^}]*\}', response.text)
            if json_match:
                return json.loads(json_match.group())
        except Exception as e:
            logger.warning(f"LLM text extraction failed: {str(e)}")
        
        return {}
    
    def process_structured_data(self, df: pd.DataFrame, source_name: str) -> Tuple[pd.DataFrame, Dict]:
        """
        Process structured data by mapping fields to unified schema.
        
        Args:
            df (pd.DataFrame): Structured data to process
            source_name (str): Name of the data source
            
        Returns:
            Tuple[pd.DataFrame, Dict]: (processed_df, mapping_info)
        """
        logger.info(f"Processing structured data from {source_name}")
        
        # Extract schema from dataframe
        source_fields = list(df.columns)
        
        # Generate field mappings
        field_mappings = {}
        unmapped_fields = []
        
        for field in source_fields:
            unified_field, confidence = self.llm_mapper.map_field_to_unified_schema(
                field, source_fields
            )
            
            if unified_field and confidence > 0.5:
                field_mappings[field] = {
                    'unified_field': unified_field,
                    'confidence': confidence,
                    'timestamp': datetime.now().isoformat()
                }
            else:
                # Log unmapped field
                unmapped_entry = {
                    'source_field': field,
                    'source_name': source_name,
                    'confidence': confidence,
                    'timestamp': datetime.now().isoformat(),
                    'context_fields': source_fields
                }
                unmapped_fields.append(unmapped_entry)
                self.unmapped_fields.append(unmapped_entry)
                
                # Ask LLM if we should extend schema
                if self.auto_extend_schema:
                    should_extend = self._should_extend_schema(field, source_fields)
                    if should_extend:
                        self._extend_unified_schema(field)
                        field_mappings[field] = {
                            'unified_field': field,
                            'confidence': 0.8,
                            'timestamp': datetime.now().isoformat(),
                            'auto_extended': True
                        }
        
        # Apply mappings to create unified dataframe
        unified_df = self._apply_field_mappings(df, field_mappings, source_name)
        
        # Handle name fields intelligently
        unified_df = self._handle_name_fields(unified_df)
        
        mapping_info = {
            'source_name': source_name,
            'field_mappings': field_mappings,
            'unmapped_fields': unmapped_fields,
            'total_fields': len(source_fields),
            'mapped_fields': len(field_mappings),
            'mapping_success_rate': len(field_mappings) / len(source_fields) if source_fields else 0
        }
        
        return unified_df, mapping_info
    
    def process_unstructured_data(self, df: pd.DataFrame, source_name: str) -> Tuple[pd.DataFrame, Dict]:
        """
        Process unstructured data by extracting fields and mapping to unified schema.
        
        Args:
            df (pd.DataFrame): Unstructured data to process
            source_name (str): Name of the data source
            
        Returns:
            Tuple[pd.DataFrame, Dict]: (processed_df, mapping_info)
        """
        logger.info(f"Processing unstructured data from {source_name}")
        
        # Identify the text column (usually the first or only column)
        text_column = df.columns[0]
        
        # Process each row to extract structured fields
        extracted_records = []
        for idx, row in df.iterrows():
            text = str(row[text_column])
            extracted_fields = self.extract_fields_from_unstructured_text(text)
            
            # Add metadata
            extracted_fields['source_name'] = source_name
            extracted_fields['raw_text'] = text
            
            extracted_records.append(extracted_fields)
        
        # Create dataframe from extracted records
        if extracted_records:
            extracted_df = pd.DataFrame(extracted_records)
        else:
            # Create empty dataframe with unified schema
            extracted_df = pd.DataFrame(columns=list(self.unified_schema.keys()))
        
        # Now process as structured data
        return self.process_structured_data(extracted_df, source_name)
    
    def _should_extend_schema(self, field_name: str, context_fields: List[str]) -> bool:
        """
        Use LLM to determine if a field should be added to unified schema.
        
        Args:
            field_name (str): Field name to evaluate
            context_fields (List[str]): Context fields from same source
            
        Returns:
            bool: True if field should be added to schema
        """
        prompt = f"""
        Should the field "{field_name}" be added to our unified customer schema?
        
        Context fields from same source: {context_fields}
        Current unified schema: {list(self.unified_schema.keys())}
        
        Consider:
        1. Is this field relevant to customer data?
        2. Would it be valuable across multiple data sources?
        3. Does it represent a distinct data point not covered by existing fields?
        
        Respond with only "YES" or "NO":
        """
        
        try:
            response = self.llm_mapper.gemini_model.generate_content(prompt)
            return "YES" in response.text.upper()
        except Exception as e:
            logger.warning(f"Schema extension evaluation failed: {str(e)}")
            return False
    
    def _extend_unified_schema(self, field_name: str):
        """
        Add a new field to the unified schema.
        
        Args:
            field_name (str): Field name to add
        """
        if field_name not in self.unified_schema:
            self.unified_schema[field_name] = ""
            self._save_unified_schema(self.unified_schema)
            logger.info(f"Extended unified schema with new field: {field_name}")
    
    def _apply_field_mappings(self, df: pd.DataFrame, mappings: Dict, source_name: str) -> pd.DataFrame:
        """
        Apply field mappings to transform dataframe to unified schema.
        
        Args:
            df (pd.DataFrame): Source dataframe
            mappings (Dict): Field mappings
            source_name (str): Source name
            
        Returns:
            pd.DataFrame: Transformed dataframe
        """
        # Create new dataframe with unified schema
        unified_df = pd.DataFrame(columns=list(self.unified_schema.keys()))
        
        # Apply mappings
        for source_field, mapping_info in mappings.items():
            unified_field = mapping_info['unified_field']
            if source_field in df.columns and unified_field in unified_df.columns:
                unified_df[unified_field] = df[source_field]
        
        # Add metadata
        unified_df['source_name'] = source_name
        
        # Fill missing values
        for col in unified_df.columns:
            if unified_df[col].isna().all():
                unified_df[col] = ""
        
        return unified_df
    
    def _handle_name_fields(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Intelligently handle name fields (first_name, last_name, full_name).
        
        Args:
            df (pd.DataFrame): DataFrame to process
            
        Returns:
            pd.DataFrame: DataFrame with properly handled name fields
        """
        # If we have first_name and last_name but no full_name, derive it
        if 'first_name' in df.columns and 'last_name' in df.columns and 'full_name' in df.columns:
            mask = (df['full_name'].isna() | (df['full_name'] == "")) & \
                   (df['first_name'].notna() & (df['first_name'] != "")) & \
                   (df['last_name'].notna() & (df['last_name'] != ""))
            
            df.loc[mask, 'full_name'] = df.loc[mask, 'first_name'] + ' ' + df.loc[mask, 'last_name']
            
            logger.info(f"Derived {mask.sum()} full_name values from first_name + last_name")
        
        # If we have full_name but missing first_name/last_name, try to split
        if 'full_name' in df.columns and 'first_name' in df.columns and 'last_name' in df.columns:
            mask = (df['full_name'].notna() & (df['full_name'] != "")) & \
                   ((df['first_name'].isna() | (df['first_name'] == "")) | \
                    (df['last_name'].isna() | (df['last_name'] == "")))
            
            for idx in df[mask].index:
                full_name = str(df.loc[idx, 'full_name']).strip()
                name_parts = full_name.split()
                if len(name_parts) >= 2:
                    if df.loc[idx, 'first_name'] == "" or pd.isna(df.loc[idx, 'first_name']):
                        df.loc[idx, 'first_name'] = name_parts[0]
                    if df.loc[idx, 'last_name'] == "" or pd.isna(df.loc[idx, 'last_name']):
                        df.loc[idx, 'last_name'] = ' '.join(name_parts[1:])
            
            logger.info(f"Split {mask.sum()} full_name values into first_name + last_name")
        
        return df
    
    def discover_and_process_all_sources(self) -> Dict[str, Dict]:
        """
        Discover all data sources and process them intelligently.
        
        Returns:
            Dict[str, Dict]: Processing results for each source
        """
        # Discover sources
        self.discover_data_sources()
        
        results = {}
        
        for source_name, source_info in self.discovered_sources.items():
            try:
                logger.info(f"Processing source: {source_name}")
                
                # Load data
                df = self._load_source_data(source_info)
                
                if df is None or df.empty:
                    logger.warning(f"Skipping empty source: {source_name}")
                    continue
                
                # Detect if structured or unstructured
                is_unstructured = self.detect_if_unstructured(df)
                
                # Process accordingly
                if is_unstructured:
                    processed_df, mapping_info = self.process_unstructured_data(df, source_name)
                else:
                    processed_df, mapping_info = self.process_structured_data(df, source_name)
                
                # Save results
                self._save_processed_data(processed_df, source_name)
                self._save_mapping_info(mapping_info, source_name)
                
                results[source_name] = {
                    'status': 'success',
                    'is_unstructured': is_unstructured,
                    'records_processed': len(processed_df),
                    'mapping_info': mapping_info
                }
                
                logger.info(f"Successfully processed {source_name}: {len(processed_df)} records")
                
            except Exception as e:
                logger.error(f"Error processing {source_name}: {str(e)}")
                results[source_name] = {
                    'status': 'error',
                    'error': str(e)
                }
        
        # Save unmapped fields log
        self._save_unmapped_fields()
        
        return results
    
    def _load_source_data(self, source_info: Dict) -> Optional[pd.DataFrame]:
        """
        Load data from a source file.
        
        Args:
            source_info (Dict): Source metadata
            
        Returns:
            Optional[pd.DataFrame]: Loaded data or None if failed
        """
        file_path = source_info['file_path']
        file_type = source_info['file_type']
        
        try:
            if file_type == '.csv':
                df = pd.read_csv(file_path)
            elif file_type == '.xlsx':
                df = pd.read_excel(file_path)
            elif file_type == '.json':
                df = pd.read_json(file_path, lines=True)
            else:
                logger.error(f"Unsupported file type: {file_type}")
                return None
            
            logger.info(f"Loaded {len(df)} records from {file_path}")
            return df
            
        except Exception as e:
            logger.error(f"Error loading {file_path}: {str(e)}")
            return None
    
    def _save_processed_data(self, df: pd.DataFrame, source_name: str):
        """
        Save processed data to CSV file.
        
        Args:
            df (pd.DataFrame): Processed data
            source_name (str): Source name
        """
        output_file = Path(self.processed_data_dir) / f"{source_name}.csv"
        try:
            df.to_csv(output_file, index=False)
            logger.info(f"Saved processed data to {output_file}")
        except Exception as e:
            logger.error(f"Error saving processed data: {str(e)}")
    
    def _save_mapping_info(self, mapping_info: Dict, source_name: str):
        """
        Save mapping information to JSON file.
        
        Args:
            mapping_info (Dict): Mapping information
            source_name (str): Source name
        """
        mapping_file = Path(self.schema_mappings_dir) / f"{source_name}_map.json"
        try:
            with open(mapping_file, 'w') as f:
                json.dump(mapping_info, f, indent=2)
            logger.info(f"Saved mapping info to {mapping_file}")
        except Exception as e:
            logger.error(f"Error saving mapping info: {str(e)}")
    
    def get_processing_summary(self) -> Dict[str, Any]:
        """
        Get summary of processing results.
        
        Returns:
            Dict[str, Any]: Processing summary
        """
        return {
            'unified_schema_fields': len(self.unified_schema),
            'unified_schema': list(self.unified_schema.keys()),
            'sources_discovered': len(self.discovered_sources),
            'unmapped_fields_count': len(self.unmapped_fields),
            'auto_extend_schema': self.auto_extend_schema
        }
    
    def _get_schema_hash(self, schema: List[str]) -> str:
        """
        Generate a hash for a schema to use as cache key.
        
        Args:
            schema (List[str]): List of field names
            
        Returns:
            str: MD5 hash of the sorted schema fields
        """
        # Sort and join the schema fields to ensure consistent hashing
        schema_str = '|'.join(sorted(schema))
        return hashlib.md5(schema_str.encode()).hexdigest()
    
    def _get_cached_mapping(self, schema_hash: str) -> Optional[Dict]:
        """
        Get cached mapping for a schema hash.
        
        Args:
            schema_hash (str): Hash of the schema
            
        Returns:
            Optional[Dict]: Cached mapping if found, None otherwise
        """
        cache_file = Path(self.schema_mappings_dir) / f"cache_{schema_hash}.json"
        if cache_file.exists():
            try:
                with open(cache_file, 'r') as f:
                    return json.load(f)
            except Exception as e:
                logger.warning(f"Failed to read cache file {cache_file}: {str(e)}")
                return None
        return None
    
    def _save_to_cache(self, schema_hash: str, mapping: Dict):
        """
        Save mapping to cache.
        
        Args:
            schema_hash (str): Hash of the schema
            mapping (Dict): Mapping to cache
        """
        cache_file = Path(self.schema_mappings_dir) / f"cache_{schema_hash}.json"
        try:
            with open(cache_file, 'w') as f:
                json.dump(mapping, f)
        except Exception as e:
            logger.warning(f"Failed to write cache file {cache_file}: {str(e)}")
    
    def _ensure_directories(self):
        """Ensure that required directories exist, create them if they don't."""
        Path(self.data_sources_dir).mkdir(parents=True, exist_ok=True)
        Path(self.processed_data_dir).mkdir(parents=True, exist_ok=True)
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
    
    def _process_field_mapping(self, field: str, source_fields: List[str]) -> Tuple[str, Dict]:
        """
        Process a single field mapping.
        
        Args:
            field (str): Field name to map
            source_fields (List[str]): List of all source fields
            
        Returns:
            Tuple[str, Dict]: Field name and its mapping information
        """
        try:
            unified_field, confidence = self.llm_mapper.map_field_to_unified_schema(field, source_fields)
            if unified_field:
                return field, {
                    "unified_field": unified_field,
                    "confidence": confidence,
                    "mapping_type": "high" if confidence >= 0.9 else "medium" if confidence >= 0.7 else "low"
                }
            return field, None
        except Exception as e:
            logger.error(f"Error mapping field {field}: {str(e)}")
            return field, None
    
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
        
        try:
            # Check cache first
            schema_hash = self._get_schema_hash(source_fields)
            cached_mapping = self._get_cached_mapping(schema_hash)
            if cached_mapping:
                logger.info(f"Using cached mapping for {source_name}")
                return cached_mapping
            
            # Process fields in parallel
            mappings = {}
            unmapped_fields = []
            high_confidence = 0
            medium_confidence = 0
            low_confidence = 0
            
            with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
                future_to_field = {
                    executor.submit(self._process_field_mapping, field, source_fields): field 
                    for field in source_fields
                }
                
                for future in tqdm(as_completed(future_to_field), total=len(source_fields), desc="Mapping fields"):
                    field = future_to_field[future]
                    try:
                        field, mapping = future.result()
                        if mapping:
                            mappings[field] = mapping
                            if mapping["mapping_type"] == "high":
                                high_confidence += 1
                            elif mapping["mapping_type"] == "medium":
                                medium_confidence += 1
                            else:
                                low_confidence += 1
                        else:
                            unmapped_fields.append(field)
                    except Exception as e:
                        logger.error(f"Error processing field {field}: {str(e)}")
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
            
            # Store in memory and cache
            self.schema_mappings[source_name] = mapping_result
            self._save_to_cache(schema_hash, mapping_result)
            
            logger.info(f"Generated mapping for {source_name}: "
                       f"{mapping_result['mapping_stats']['mapped_fields']}/{mapping_result['mapping_stats']['total_fields']} "
                       f"fields mapped ({mapping_result['mapping_stats']['success_rate']:.1%} success rate)")
            
            return mapping_result
            
        except Exception as e:
            logger.error(f"Failed to generate mapping for {source_name}: {str(e)}")
            return None
    
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
        for unified_field in self.unified_schema.keys():
            if unified_field not in mapped_df.columns:
                mapped_df[unified_field] = None
                logger.debug(f"Added missing unified field: {unified_field}")
        
        # Reorder columns to match unified schema order
        unified_columns = list(self.unified_schema.keys())
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
        
        # Process sources in parallel
        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            future_to_source = {
                executor.submit(self._process_single_source, source_name): source_name 
                for source_name in discovered.keys()
            }
            
            for future in tqdm(as_completed(future_to_source), total=len(discovered), desc="Processing sources"):
                source_name = future_to_source[future]
                try:
                    results[source_name] = future.result()
                except Exception as e:
                    logger.error(f"Failed to process source {source_name}: {str(e)}")
                    results[source_name] = False
        
        # Log summary
        successful = sum(1 for success in results.values() if success)
        total = len(results)
        logger.info(f"Processing complete: {successful}/{total} sources processed successfully")
        
        return results
    
    def _process_single_source(self, source_name: str) -> bool:
        """
        Process a single source file.
        
        Args:
            source_name (str): Name of the source to process
            
        Returns:
            bool: True if processing successful, False otherwise
        """
        try:
            # Generate mapping
            mapping = self.generate_schema_mapping(source_name)
            if mapping:
                # Save mapping
                return self.save_schema_mapping(source_name, mapping)
            return False
        except Exception as e:
            logger.error(f"Failed to process source {source_name}: {str(e)}")
            return False
    
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
        valid_unified_fields = set(self.unified_schema.keys())
        
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