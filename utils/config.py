"""
Configuration settings for the Schema Identification Agent.
"""

import os
from typing import Dict, List

# LLM Configuration
LLM_CONFIG = {
    'model': 'gemini-1.5-pro',  # Updated model name for Gemini API
    'api_key': os.getenv('GOOGLE_API_KEY'),  # API key from environment variable
    'temperature': 0.3,  # Lower temperature for more consistent outputs
    'max_tokens': 1024,  # Maximum tokens in response
    'timeout': 30,  # API call timeout in seconds
}

# Unified Schema Definition
UNIFIED_SCHEMA = {
    'customer_id': {
        'type': 'string',
        'description': 'Unique identifier for the customer',
        'required': True
    },
    'full_name': {
        'type': 'string',
        'description': 'Customer\'s full name',
        'required': True
    },
    'email': {
        'type': 'string',
        'description': 'Customer\'s email address',
        'required': True
    },
    'phone': {
        'type': 'string',
        'description': 'Customer\'s phone number',
        'required': False
    },
    'address': {
        'type': 'string',
        'description': 'Customer\'s full address',
        'required': False
    },
    'dob': {
        'type': 'date',
        'description': 'Customer\'s date of birth',
        'required': False
    },
    'created_at': {
        'type': 'datetime',
        'description': 'Record creation timestamp',
        'required': True
    },
    'updated_at': {
        'type': 'datetime',
        'description': 'Record last update timestamp',
        'required': True
    }
}

# Data Source Configuration
DATA_SOURCES = {
    'csv': {
        'extensions': ['.csv'],
        'delimiter': ',',
        'encoding': 'utf-8'
    },
    'json': {
        'extensions': ['.json'],
        'encoding': 'utf-8'
    },
    'excel': {
        'extensions': ['.xlsx', '.xls'],
        'sheet_name': 0
    }
}

# Logging Configuration
LOGGING_CONFIG = {
    'level': 'INFO',
    'format': '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    'datefmt': '%Y-%m-%d %H:%M:%S'
} 