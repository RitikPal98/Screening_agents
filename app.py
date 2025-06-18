"""
Flask API for Profile Matching System
Integrates with Agent 1 (Schema Identification) and Agent 2 (Profile Matching)
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
import os
from pathlib import Path
import json
from datetime import datetime
import numpy as np
import pandas as pd

class CustomJSONEncoder(json.JSONEncoder):
    """Custom JSON encoder to handle NaN values"""
    def default(self, obj):
        if isinstance(obj, (np.integer, np.floating)):
            return obj.item()
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        elif pd.isna(obj):
            return None
        return super().default(obj)

# Import our agents
from agents.profile_matching_agent import ProfileMatchingAgent
from agents.schema_identification_agent import EnhancedSchemaIdentificationAgent
from utils.data_loader import DataLoader

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
app.json_encoder = CustomJSONEncoder  # Use custom JSON encoder
CORS(app)  # Enable CORS for React frontend

# Initialize agents
profile_agent = ProfileMatchingAgent()
schema_agent = EnhancedSchemaIdentificationAgent()
data_loader = DataLoader()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'agents': {
            'profile_matching': 'initialized',
            'schema_identification': 'initialized'
        }
    })

@app.route('/match-profile', methods=['POST'])
def match_profile():
    """
    Match customer profile across data sources
    
    Expected input:
    {
        "full_name": "Mohammad Ali Khan",
        "dob": "1985-06-12",
        "national_id": "IND123456"
    }
    
    Returns:
    {
        "success": true,
        "profile": { ... merged profile ... },
        "metadata": { ... matching metadata ... }
    }
    """
    try:
        # Get request data
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        # Validate required fields
        required_fields = ['full_name']
        missing_fields = [field for field in required_fields if not data.get(field)]
        
        if missing_fields:
            return jsonify({
                'success': False,
                'error': f'Missing required fields: {", ".join(missing_fields)}'
            }), 400
        
        # Prepare query for Agent 2
        query = {
            'full_name': data.get('full_name', '').strip(),
            'dob': data.get('dob', '').strip(),
            'national_id': data.get('national_id', '').strip()
        }
        
        # Remove empty fields
        query = {k: v for k, v in query.items() if v}
        
        logger.info(f"Searching for profile with query: {query}")
        
        # Use Agent 2 enhanced method to find all matches
        search_result = profile_agent.find_and_return_all_matches(query)
        
        if not search_result:
            return jsonify({
                'success': True,
                'profile': None,
                'individual_matches': [],
                'match_summary': {
                    'total_matches': 0,
                    'sources_matched': 0,
                    'source_breakdown': {},
                    'has_strong_matches': False,
                    'highest_score': 0
                },
                'message': 'No matching profile found',
                'query': query
            })
        
        # Extract components from search result
        merged_profile = search_result['merged_profile']
        individual_matches = search_result['individual_matches']
        match_summary = search_result['match_summary']
        
        # Enhance the response with comprehensive match data
        response_data = {
            'success': True,
            'profile': merged_profile,
            'individual_matches': individual_matches,
            'match_summary': match_summary,
            'query': query,
            'metadata': {
                'search_timestamp': search_result['search_timestamp'],
                'sources_searched': len(profile_agent.load_processed_data()),
                'match_quality': merged_profile.get('match_quality', {}),
                'sources': merged_profile.get('sources', []),
                'match_count': merged_profile.get('match_count', 0)
            }
        }
        
        logger.info(f"Found {match_summary['total_matches']} individual matches from {match_summary['sources_matched']} sources")
        return jsonify(response_data)
        
    except Exception as e:
        logger.error(f"Error in match_profile: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/data-sources', methods=['GET'])
def get_data_sources():
    """Get information about available data sources"""
    try:
        # Load processed data to get source information
        data = profile_agent.load_processed_data()
        
        sources_info = []
        for source_name, df in data.items():
            sources_info.append({
                'name': source_name,
                'record_count': len(df),
                'columns': list(df.columns),
                'last_updated': datetime.now().isoformat()  # In real app, get actual timestamp
            })
        
        return jsonify({
            'success': True,
            'sources': sources_info,
            'total_sources': len(sources_info)
        })
        
    except Exception as e:
        logger.error(f"Error getting data sources: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/schema-mappings', methods=['GET'])
def get_schema_mappings():
    """Get schema mapping information"""
    try:
        mappings_info = []
        
        for source_name, mapping in profile_agent.schema_mappings.items():
            mappings_info.append({
                'source': source_name,
                'unified_fields': list(set([
                    field_info['unified_field'] 
                    for field_info in mapping.get('mappings', {}).values()
                ])),
                'field_count': len(mapping.get('mappings', {})),
                'confidence_avg': sum([
                    field_info.get('confidence', 0) 
                    for field_info in mapping.get('mappings', {}).values()
                ]) / len(mapping.get('mappings', {})) if mapping.get('mappings') else 0
            })
        
        return jsonify({
            'success': True,
            'mappings': mappings_info,
            'total_mappings': len(mappings_info)
        })
        
    except Exception as e:
        logger.error(f"Error getting schema mappings: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/test-data', methods=['GET'])
def get_test_data():
    """Get sample test data for UI testing"""
    test_cases = [
        {
            "full_name": "Leonardo DiCaprio",
            "dob": "1974-11-11",
            "national_id": "BANK001"
        },
        {
            "full_name": "John Doe",
            "dob": "1985-03-15",
            "national_id": "CRM001"
        },
        {
            "full_name": "Kate Winslet",
            "dob": "1975-10-05",
            "national_id": "BANK002"
        }
    ]
    
    return jsonify({
        'success': True,
        'test_cases': test_cases
    })

if __name__ == '__main__':
    # Ensure required directories exist
    os.makedirs('output', exist_ok=True)
    os.makedirs('profiles_found', exist_ok=True)
    os.makedirs('schema_mappings', exist_ok=True)
    
    logger.info("Starting Profile Matching API server...")
    app.run(debug=True, host='0.0.0.0', port=5000) 