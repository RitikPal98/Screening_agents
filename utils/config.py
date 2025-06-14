"""
Configuration module for the customer data integration system.
Contains unified schema definitions and system settings.
"""

# Unified schema definition - target schema that all sources will be mapped to
UNIFIED_SCHEMA = {
    'customer_id': 'str',      # Unique customer identifier
    'first_name': 'str',       # Customer's first name
    'last_name': 'str',        # Customer's last name  
    'full_name': 'str',        # Customer's complete name
    'dob': 'str',              # Date of birth (YYYY-MM-DD format)
    'gender': 'str',           # Gender (standardized values)
    'national_id': 'str',      # National ID/SSN/Tax ID
    'email': 'str',            # Email address
    'phone': 'str',            # Phone number
    'address': 'str',          # Physical address
    'country': 'str',          # Country
    'updated_at': 'str'        # Last update timestamp
}

# Directory paths
DATA_SOURCES_DIR = 'data_sources'
SCHEMA_MAPPINGS_DIR = 'schema_mappings'
OUTPUT_DIR = 'output'

# File extensions to process
SUPPORTED_FILE_TYPES = ['.csv', '.xlsx', '.json']

# LLM Configuration for Gemini API
LLM_CONFIG = {
    'model': 'gemini-1.5-flash',  # Gemini model to use
    'api_key': None,  # Set via environment variable GOOGLE_API_KEY
    'mock_mode': False,  # Set to True to use mock implementation
    'temperature': 0.1,  # Low temperature for consistent schema mapping
    'max_tokens': 1000,  # Maximum tokens for response
    'timeout': 30  # API timeout in seconds
}

# Schema mapping confidence thresholds
CONFIDENCE_THRESHOLDS = {
    'high': 0.9,     # Direct match or very confident mapping
    'medium': 0.7,   # Probable match but may need review
    'low': 0.5       # Uncertain mapping, requires manual review
}

# Common field name variations for fuzzy matching
FIELD_VARIATIONS = {
    'customer_id': ['cust_id', 'client_id', 'user_id', 'emp_id', 'id', 'customer_number'],
    'first_name': ['fname', 'f_name', 'given_name', 'firstname'],
    'last_name': ['lname', 'l_name', 'family_name', 'surname', 'lastname'],
    'full_name': ['full_nm', 'complete_name', 'customer_name', 'employee_name'],
    'dob': ['birth_dt', 'date_of_birth', 'birthdate', 'birth_date'],
    'gender': ['sex', 'gender_code'],
    'national_id': ['id_no', 'ssn', 'tax_id', 'social_security', 'national_identification'],
    'email': ['email_addr', 'email_address', 'contact_email', 'work_email'],
    'phone': ['phone_num', 'telephone', 'mobile_phone', 'cell_number', 'phone_number'],
    'address': ['street_address', 'mailing_address', 'shipping_address', 'home_address', 'residential_address'],
    'country': ['country_code', 'nation', 'country_name', 'citizenship'],
    'updated_at': ['last_update', 'modified_date', 'last_modified', 'timestamp', 'record_updated']
} 