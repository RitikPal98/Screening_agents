"""
Profile Matching Agent for finding and merging customer profiles across multiple data sources.
"""

import os
import json
import logging
import pandas as pd
from typing import Dict, List, Optional, Union, Tuple
from pathlib import Path
from rapidfuzz import fuzz, process
from datetime import datetime
import re
from dateutil import parser
from difflib import SequenceMatcher
import phonenumbers
from email_validator import validate_email, EmailNotValidError

# Import unified schema from config
from utils.config import UNIFIED_SCHEMA

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ProfileMatchingAgent:
    """
    Agent for matching and merging customer profiles across multiple data sources.
    Uses both exact and fuzzy matching to find related records.
    """
    
    def __init__(self, processed_data_dir: str = "output", 
                 profiles_dir: str = "profiles_found",
                 schema_mappings_dir: str = "schema_mappings"):
        """
        Initialize the Profile Matching Agent.
        
        Args:
            processed_data_dir (str): Directory containing processed data files from Agent 1
            profiles_dir (str): Directory to save found profiles
            schema_mappings_dir (str): Directory containing schema mapping files
        """
        self.processed_data_dir = processed_data_dir
        self.profiles_dir = profiles_dir
        self.schema_mappings_dir = schema_mappings_dir
        self.schema_mappings = {}
        
        # Matching configuration with adjusted weights
        self.MATCH_WEIGHTS = {
            'national_id': 0.15,   # Slightly higher weight for IDs
            'full_name': 0.45,     # High weight for names
            'dob': 0.25,          # Medium weight for dates
            'email': 0.10,        # Medium weight for email
            'phone': 0.05         # Lower weight for phone
        }
        
        # Adjusted thresholds for different matching scenarios
        self.FUZZY_THRESHOLDS = {
            'national_id': 60.0,   # Medium threshold for IDs
            'full_name': 70.0,     # Lower threshold for names
            'dob': 80.0,          # Medium threshold for dates
            'email': 85.0,        # High threshold for email
            'phone': 75.0         # Medium threshold for phone
        }
        
        # Minimum scores for different match types
        self.MIN_SCORES = {
            'exact_id': 100.0,     # Perfect ID match
            'strong_match': 70.0,   # Strong match on multiple fields
            'good_match': 60.0,     # Good match on key fields
            'weak_match': 50.0      # Weak match (might be false positive)
        }
        
        # Name variations and common patterns
        self.NAME_PATTERNS = {
            'suffixes': ['jr', 'sr', 'ii', 'iii', 'iv', 'v'],
            'prefixes': ['mr', 'mrs', 'ms', 'miss', 'dr', 'prof'],
            'separators': [' ', '-', '.', "'"]
        }
        
        self._ensure_directories()
        self._load_schema_mappings()
        logger.info("Profile Matching Agent initialized")
    
    def _ensure_directories(self):
        """Ensure required directories exist."""
        Path(self.processed_data_dir).mkdir(parents=True, exist_ok=True)
        Path(self.profiles_dir).mkdir(parents=True, exist_ok=True)
        Path(self.schema_mappings_dir).mkdir(parents=True, exist_ok=True)
    
    def _load_schema_mappings(self):
        """Load all schema mapping files from the schema_mappings directory."""
        logger.info(f"Loading schema mappings from: {self.schema_mappings_dir}")
        
        mapping_dir = Path(self.schema_mappings_dir)
        for mapping_file in mapping_dir.glob("*_schema_map.json"):
            try:
                with open(mapping_file, 'r') as f:
                    mapping = json.load(f)
                source_name = mapping['source_name']
                self.schema_mappings[source_name] = mapping
                logger.info(f"Loaded schema mapping for {source_name}")
            except Exception as e:
                logger.error(f"Failed to load schema mapping from {mapping_file}: {str(e)}")
    
    def _get_field_mapping(self, source_name: str, unified_field: str) -> List[str]:
        """
        Get all source fields that map to a unified field.
        
        Args:
            source_name (str): Name of the source
            unified_field (str): Unified schema field name
            
        Returns:
            List[str]: List of source field names that map to the unified field
        """
        mapping = self.schema_mappings.get(source_name, {})
        mappings = mapping.get('mappings', {})
        
        source_fields = []
        for source_field, mapping_info in mappings.items():
            if mapping_info['unified_field'] == unified_field:
                source_fields.append(source_field)
        
        return source_fields
    
    def _normalize_name(self, name: str) -> str:
        """
        Normalize name string for better matching.
        
        Args:
            name (str): Name string
            
        Returns:
            str: Normalized name string
        """
        if not name:
            return ""
            
        # Convert to lowercase and remove extra spaces
        name = ' '.join(name.lower().split())
        
        # Remove special characters but keep spaces and hyphens
        name = re.sub(r'[^a-z0-9\s\-]', '', name)
        
        # Remove common suffixes and prefixes
        words = name.split()
        filtered_words = []
        for word in words:
            if word not in self.NAME_PATTERNS['suffixes'] and word not in self.NAME_PATTERNS['prefixes']:
                filtered_words.append(word)
        
        return ' '.join(filtered_words)
    
    def _normalize_date(self, date_str: str) -> Optional[str]:
        """
        Normalize date string to YYYY-MM-DD format.
        
        Args:
            date_str (str): Date string in any format
            
        Returns:
            Optional[str]: Normalized date string or None if invalid
        """
        if not date_str:
            return None
            
        try:
            # Try to parse the date
            date_obj = parser.parse(date_str)
            return date_obj.strftime('%Y-%m-%d')
        except:
            return None
    
    def _normalize_phone(self, phone: str) -> Optional[str]:
        """
        Normalize phone number to E.164 format.
        
        Args:
            phone (str): Phone number string
            
        Returns:
            Optional[str]: Normalized phone number or None if invalid
        """
        if not phone:
            return None
            
        try:
            # Remove all non-digit characters
            digits = re.sub(r'\D', '', phone)
            
            # Try to parse with different country codes if needed
            for country_code in ['1', '44', '91']:  # US, UK, India
                try:
                    number = phonenumbers.parse(f"+{country_code}{digits}")
                    if phonenumbers.is_valid_number(number):
                        return phonenumbers.format_number(number, phonenumbers.PhoneNumberFormat.E164)
                except:
                    continue
            
            return None
        except:
            return None
    
    def _normalize_email(self, email: str) -> Optional[str]:
        """
        Normalize email address.
        
        Args:
            email (str): Email address
            
        Returns:
            Optional[str]: Normalized email or None if invalid
        """
        if not email:
            return None
            
        try:
            # Validate and normalize email
            validated = validate_email(email)
            return validated.normalized
        except EmailNotValidError:
            return None
    
    def _normalize_id(self, id_str: str) -> str:
        """
        Normalize ID string for better matching.
        
        Args:
            id_str (str): ID string
            
        Returns:
            str: Normalized ID string
        """
        if not id_str:
            return ""
            
        # Remove spaces and special characters
        return re.sub(r'[^a-zA-Z0-9]', '', id_str.lower())
    
    def _calculate_name_score(self, query_name: str, record_name: str) -> float:
        """
        Calculate similarity score between two names.
        
        Args:
            query_name (str): Query name
            record_name (str): Record name
            
        Returns:
            float: Similarity score (0-100)
        """
        # Normalize names
        query_name = self._normalize_name(query_name)
        record_name = self._normalize_name(record_name)
        
        if not query_name or not record_name:
            return 0.0
        
        # Try different matching strategies
        scores = []
        
        # Full string ratio
        scores.append(fuzz.ratio(query_name, record_name))
        
        # Token sort ratio (handles word order differences)
        scores.append(fuzz.token_sort_ratio(query_name, record_name))
        
        # Token set ratio (handles missing/extra words)
        scores.append(fuzz.token_set_ratio(query_name, record_name))
        
        # Partial ratio (handles substring matches)
        scores.append(fuzz.partial_ratio(query_name, record_name))
        
        # Sequence matcher ratio (handles character-level differences)
        scores.append(SequenceMatcher(None, query_name, record_name).ratio() * 100)
        
        # Return the highest score
        return max(scores)
    
    def _calculate_date_score(self, query_date: str, record_date: str) -> float:
        """
        Calculate similarity score between two dates.
        
        Args:
            query_date (str): Query date
            record_date (str): Record date
            
        Returns:
            float: Similarity score (0-100)
        """
        # Normalize dates
        query_date = self._normalize_date(query_date)
        record_date = self._normalize_date(record_date)
        
        if not query_date or not record_date:
            return 0.0
        
        # Exact match
        if query_date == record_date:
            return 100.0
        
        # Parse dates for comparison
        try:
            query_dt = datetime.strptime(query_date, '%Y-%m-%d')
            record_dt = datetime.strptime(record_date, '%Y-%m-%d')
            
            # Calculate date difference in days
            date_diff = abs((query_dt - record_dt).days)
            
            # Score based on date difference
            if date_diff == 0:
                return 100.0
            elif date_diff <= 1:
                return 90.0
            elif date_diff <= 7:
                return 80.0
            elif date_diff <= 30:
                return 60.0
            elif date_diff <= 365:
                return 40.0
            else:
                return 0.0
        except:
            return 0.0
    
    def _calculate_id_score(self, query_id: str, record_id: str) -> float:
        """
        Calculate similarity score between two IDs.
        
        Args:
            query_id (str): Query ID
            record_id (str): Record ID
            
        Returns:
            float: Similarity score (0-100)
        """
        # Normalize IDs
        query_id = self._normalize_id(query_id)
        record_id = self._normalize_id(record_id)
        
        if not query_id or not record_id:
            return 0.0
        
        # Exact match
        if query_id == record_id:
            return 100.0
        
        # Try different matching strategies
        scores = []
        
        # Full string ratio
        scores.append(fuzz.ratio(query_id, record_id))
        
        # Partial ratio (for cases where ID might be embedded in a longer string)
        scores.append(fuzz.partial_ratio(query_id, record_id))
        
        # Token sort ratio (for cases where ID parts might be in different order)
        scores.append(fuzz.token_sort_ratio(query_id, record_id))
        
        # Check for common ID patterns
        if len(query_id) == len(record_id):
            # If same length, give higher weight to character-level similarity
            scores.append(SequenceMatcher(None, query_id, record_id).ratio() * 100)
        
        return max(scores)
    
    def _calculate_email_score(self, query_email: str, record_email: str) -> float:
        """
        Calculate similarity score between two email addresses.
        
        Args:
            query_email (str): Query email
            record_email (str): Record email
            
        Returns:
            float: Similarity score (0-100)
        """
        # Normalize emails
        query_email = self._normalize_email(query_email)
        record_email = self._normalize_email(record_email)
        
        if not query_email or not record_email:
            return 0.0
        
        # Exact match
        if query_email == record_email:
            return 100.0
        
        # Split into local and domain parts
        query_local, query_domain = query_email.split('@')
        record_local, record_domain = record_email.split('@')
        
        # Calculate scores for local and domain parts
        local_score = fuzz.ratio(query_local, record_local)
        domain_score = fuzz.ratio(query_domain, record_domain)
        
        # Weight domain match more heavily
        return (local_score * 0.4 + domain_score * 0.6)
    
    def _calculate_phone_score(self, query_phone: str, record_phone: str) -> float:
        """
        Calculate similarity score between two phone numbers.
        
        Args:
            query_phone (str): Query phone
            record_phone (str): Record phone
            
        Returns:
            float: Similarity score (0-100)
        """
        # Normalize phone numbers
        query_phone = self._normalize_phone(query_phone)
        record_phone = self._normalize_phone(record_phone)
        
        if not query_phone or not record_phone:
            return 0.0
        
        # Exact match
        if query_phone == record_phone:
            return 100.0
        
        # Try different matching strategies
        scores = []
        
        # Full string ratio
        scores.append(fuzz.ratio(query_phone, record_phone))
        
        # Partial ratio (for cases where number might be embedded in a longer string)
        scores.append(fuzz.partial_ratio(query_phone, record_phone))
        
        # Check last 7 digits (most important part of phone number)
        if len(query_phone) >= 7 and len(record_phone) >= 7:
            query_last7 = query_phone[-7:]
            record_last7 = record_phone[-7:]
            if query_last7 == record_last7:
                scores.append(90.0)
        
        return max(scores)
    
    def _calculate_match_score(self, query: Dict[str, str], 
                             record: Dict[str, str],
                             source_name: str) -> Tuple[float, Dict[str, float]]:
        """
        Calculate overall match score between query and record.
        
        Args:
            query (Dict[str, str]): Search query
            record (Dict[str, str]): Record to compare against
            source_name (str): Name of the source for schema mapping lookup
            
        Returns:
            Tuple[float, Dict[str, float]]: Overall match score and individual field scores
        """
        field_scores = {}
        
        # Get schema mapping for this source
        mapping = self.schema_mappings.get(source_name, {})
        mappings = mapping.get('mappings', {})
        
        logger.debug(f"Calculating match score for {source_name}")
        logger.debug(f"Query: {query}")
        logger.debug(f"Record: {record}")
        logger.debug(f"Available mappings: {list(mappings.keys()) if mappings else 'None'}")
        
        # Calculate scores for each query field
        for field, value in query.items():
            if field not in self.MATCH_WEIGHTS:
                logger.debug(f"Skipping field {field} - not in MATCH_WEIGHTS")
                continue
                
            # Get all source fields that map to this unified field
            source_fields = self._get_field_mapping(source_name, field)
            
            # If no schema mapping found, try direct field matching
            if not source_fields:
                logger.debug(f"No schema mapping found for {field}, trying direct match")
                if field in record:
                    source_fields = [field]
                elif field == 'full_name':
                    # For full_name, check all name-related columns
                    name_columns = [col for col in record.keys() if 'full_name' in col.lower() or 'name' in col.lower()]
                    if name_columns:
                        source_fields = name_columns
                        logger.debug(f"Found name columns: {name_columns}")
                elif field == 'national_id':
                    # For national_id, check customer_id and id-related columns
                    id_columns = [col for col in record.keys() if any(id_term in col.lower() for id_term in ['id', 'customer_id', 'national_id'])]
                    if id_columns:
                        source_fields = id_columns
                        logger.debug(f"Found ID columns: {id_columns}")
                
                if not source_fields:
                    logger.debug(f"Field {field} not found in record columns: {list(record.keys())}")
                    continue
            
            logger.debug(f"Matching field {field} using source fields: {source_fields}")
            
            # Calculate score for each source field
            field_score = 0.0
            for source_field in source_fields:
                if source_field not in record:
                    logger.debug(f"Source field {source_field} not in record")
                    continue
                
                record_value = str(record[source_field]) if record[source_field] is not None else ""
                logger.debug(f"Comparing {field}: '{value}' vs '{record_value}'")
                
                # Calculate field-specific score
                if field == 'national_id':
                    score = self._calculate_id_score(value, record_value)
                elif field == 'full_name':
                    # For names, also try combining multiple name fields if this is a partial name
                    if 'full_name' in source_field and len(source_fields) > 1:
                        # Try to construct full name from multiple columns
                        name_parts = []
                        for name_col in source_fields:
                            if name_col in record and record[name_col]:
                                name_part = str(record[name_col]).strip()
                                if name_part and name_part not in name_parts:
                                    name_parts.append(name_part)
                        
                        if len(name_parts) > 1:
                            combined_name = ' '.join(name_parts)
                            combined_score = self._calculate_name_score(value, combined_name)
                            logger.debug(f"Combined name '{combined_name}' score: {combined_score}")
                            score = max(score, combined_score) if 'score' in locals() else combined_score
                    
                    individual_score = self._calculate_name_score(value, record_value)
                    score = max(score, individual_score) if 'score' in locals() else individual_score
                elif field == 'dob':
                    score = self._calculate_date_score(value, record_value)
                elif field == 'email':
                    score = self._calculate_email_score(value, record_value)
                elif field == 'phone':
                    score = self._calculate_phone_score(value, record_value)
                else:
                    score = fuzz.ratio(value.lower(), record_value.lower())
                
                logger.debug(f"Score for {field} ({source_field}): {score}")
                
                # Update field score if better
                field_score = max(field_score, score)
            
            # Store the best score for this field
            if field_score > 0:
                field_scores[field] = field_score
                logger.debug(f"Final score for {field}: {field_score}")
        
        # Calculate weighted average score
        if not field_scores:
            logger.debug("No field scores calculated")
            return 0.0, field_scores
        
        total_weight = 0.0
        weighted_sum = 0.0
        
        for field, score in field_scores.items():
            weight = self.MATCH_WEIGHTS.get(field, 0)
            total_weight += weight
            weighted_sum += score * weight
            logger.debug(f"Field {field}: score={score}, weight={weight}, contribution={score * weight}")
        
        overall_score = weighted_sum / total_weight if total_weight > 0 else 0.0
        logger.debug(f"Overall score: {overall_score} (weighted_sum={weighted_sum}, total_weight={total_weight})")
        
        return overall_score, field_scores
    
    def _is_strong_match(self, field_scores: Dict[str, float]) -> bool:
        """
        Determine if the match is strong based on field scores.
        
        Args:
            field_scores (Dict[str, float]): Individual field scores
            
        Returns:
            bool: True if the match is considered strong
        """
        # Check if we have both name and date scores
        if 'full_name' in field_scores and 'dob' in field_scores:
            name_score = field_scores['full_name']
            date_score = field_scores['dob']
            
            # Strong match if both name and date are good
            if name_score >= 70.0 and date_score >= 80.0:
                return True
            
            # Good match if name is very good and date is good
            if name_score >= 80.0 and date_score >= 70.0:
                return True
            
            # Good match if date is excellent and name is acceptable
            if date_score >= 90.0 and name_score >= 60.0:
                return True
            
            # Strong match if we have high confidence in other fields
            if 'email' in field_scores and field_scores['email'] >= 90.0:
                return True
            
            if 'phone' in field_scores and field_scores['phone'] >= 90.0:
                return True
        
        return False
    
    def load_processed_data(self) -> Dict[str, pd.DataFrame]:
        """
        Load all processed data files from the output directory.
        
        Returns:
            Dict[str, pd.DataFrame]: Dictionary mapping source names to DataFrames
        """
        logger.info(f"Loading processed data from: {self.processed_data_dir}")
        
        data = {}
        data_dir = Path(self.processed_data_dir)
        
        # Look for files with _unified suffix
        for file_path in data_dir.glob("*_unified.csv"):
            source_name = file_path.stem.replace("_unified", "")
            try:
                df = pd.read_csv(file_path)
                logger.info(f"Found file {file_path} with columns: {list(df.columns)}")
                
                # Clean up duplicate column names by keeping only the first occurrence
                df = df.loc[:, ~df.columns.duplicated()]
                logger.info(f"After removing duplicates, columns: {list(df.columns)}")
                
                # Check for essential columns (more lenient validation)
                essential_columns = ['full_name']  # Only require full_name as essential
                missing_essential = [col for col in essential_columns if col not in df.columns]
                
                if missing_essential:
                    logger.warning(f"Source {source_name} is missing essential columns: {missing_essential}")
                    continue
                
                # Log available columns for debugging
                available_unified_cols = [col for col in UNIFIED_SCHEMA.keys() if col in df.columns]
                logger.info(f"Source {source_name} has unified columns: {available_unified_cols}")
                
                data[source_name] = df
                logger.info(f"Successfully loaded {len(df)} records from {source_name}")
                
                # Log a sample record for debugging
                if len(df) > 0:
                    sample_record = df.iloc[0].fillna('').to_dict()
                    logger.debug(f"Sample record from {source_name}: {sample_record}")
                    
            except Exception as e:
                logger.error(f"Failed to load {source_name}: {str(e)}")
        
        if not data:
            logger.error("No valid processed data files found. Please run Agent 1 first.")
        else:
            logger.info(f"Successfully loaded data from {len(data)} sources: {list(data.keys())}")
        
        return data
    
    def find_matches(self, query: Dict[str, str], 
                    data: Dict[str, pd.DataFrame],
                    fuzzy_threshold: float = 60.0) -> Dict[str, List[Dict]]:
        """
        Find matching records across all data sources.
        
        Args:
            query (Dict[str, str]): Search query with anchor attributes
            data (Dict[str, pd.DataFrame]): Dictionary of source DataFrames
            fuzzy_threshold (float): Minimum similarity score for fuzzy matches
            
        Returns:
            Dict[str, List[Dict]]: Dictionary mapping source names to lists of matching records
        """
        logger.info("Searching for matching profiles...")
        matches = {}
        
        for source_name, df in data.items():
            source_matches = []
            
            # Convert DataFrame to list of dictionaries for easier processing
            # Replace NaN values with None for JSON serialization
            df_clean = df.fillna('')  # Replace NaN with empty string
            records = df_clean.to_dict('records')
            
            for record in records:
                match_score, field_scores = self._calculate_match_score(query, record, source_name)
                
                # Log the scores for debugging
                logger.debug(f"Record in {source_name}:")
                logger.debug(f"  Record: {record}")
                logger.debug(f"  Match score: {match_score}")
                logger.debug(f"  Field scores: {field_scores}")
                
                # Check if this is a strong match based on field scores
                is_strong_match = self._is_strong_match(field_scores)
                
                # Accept the match if:
                # 1. It's a strong match (high field scores)
                # 2. It has a good overall score
                # 3. It has an exact ID match
                if (is_strong_match or 
                    match_score >= fuzzy_threshold or 
                    ('national_id' in field_scores and field_scores['national_id'] == 100.0)):
                    
                    record['match_score'] = match_score
                    record['field_scores'] = field_scores
                    record['is_strong_match'] = is_strong_match
                    source_matches.append(record)
                    logger.info(f"Found match in {source_name} with score {match_score}")
            
            if source_matches:
                # Sort matches by score and strong match status
                source_matches.sort(key=lambda x: (x['is_strong_match'], x['match_score']), reverse=True)
                matches[source_name] = source_matches
                logger.info(f"Found {len(source_matches)} matches in {source_name}")
        
        return matches
    
    def merge_matches(self, matches: Dict[str, List[Dict]]) -> Dict:
        """
        Merge matching records into a single enriched profile.
        
        Args:
            matches (Dict[str, List[Dict]]): Dictionary of matching records by source
            
        Returns:
            Dict: Merged profile with all available information
        """
        logger.info("Merging matching profiles...")
        
        # Start with the record that has the highest match score
        all_records = []
        for source_matches in matches.values():
            all_records.extend(source_matches)
        
        if not all_records:
            return {}
        
        # Sort by strong match status and match score
        all_records.sort(key=lambda x: (x.get('is_strong_match', False), 
                                      x.get('match_score', 0)), reverse=True)
        
        # Use the best match as base
        merged_profile = all_records[0].copy()
        
        # Remove internal fields
        merged_profile.pop('match_score', None)
        merged_profile.pop('field_scores', None)
        merged_profile.pop('is_strong_match', None)
        
        # Add source information
        merged_profile['sources'] = list(matches.keys())
        merged_profile['match_count'] = len(all_records)
        
        # Add match quality information
        merged_profile['match_quality'] = {
            'is_strong_match': all_records[0].get('is_strong_match', False),
            'overall_score': all_records[0].get('match_score', 0),
            'field_scores': all_records[0].get('field_scores', {})
        }
        
        # Add timestamp
        merged_profile['merged_at'] = datetime.now().isoformat()
        
        return merged_profile
    
    def save_profile(self, profile: Dict, query: Dict[str, str]):
        """
        Save the merged profile to a JSON file.
        
        Args:
            profile (Dict): Merged profile to save
            query (Dict[str, str]): Original search query
        """
        if not profile:
            logger.warning("No profile to save")
            return
        
        # Create filename based on query attributes
        filename_parts = []
        if 'national_id' in query:
            filename_parts.append(query['national_id'])
        elif 'full_name' in query:
            filename_parts.append(query['full_name'].replace(' ', '_'))
        else:
            filename_parts.append('unknown')
        
        filename = f"profile_{'_'.join(filename_parts)}.json"
        file_path = Path(self.profiles_dir) / filename
        
        try:
            with open(file_path, 'w') as f:
                json.dump(profile, f, indent=2)
            logger.info(f"Saved profile to: {file_path}")
        except Exception as e:
            logger.error(f"Failed to save profile: {str(e)}")
    
    def find_and_merge_profile(self, query: Dict[str, str]) -> Optional[Dict]:
        """
        Main method to find and merge matching profiles.
        
        Args:
            query (Dict[str, str]): Search query with anchor attributes
            
        Returns:
            Optional[Dict]: Merged profile if found, None otherwise
        """
        # Load processed data
        data = self.load_processed_data()
        if not data:
            logger.error("No processed data found")
            return None
        
        # Find matches
        matches = self.find_matches(query, data)
        if not matches:
            logger.info("No matching profiles found")
            return None
        
        # Merge matches
        merged_profile = self.merge_matches(matches)
        
        # Save profile
        self.save_profile(merged_profile, query)
        
        return merged_profile 