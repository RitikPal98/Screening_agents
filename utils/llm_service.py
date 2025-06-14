"""
LLM Service module for AI-powered schema mapping using Google Gemini API.
"""

import json
import logging
import os
import re
from typing import Dict, List, Tuple, Optional
from utils.config import LLM_CONFIG, FIELD_VARIATIONS, CONFIDENCE_THRESHOLDS

# Import dependencies (optional - gracefully handle if not installed)
try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    genai = None

try:
    from dotenv import load_dotenv
    DOTENV_AVAILABLE = True
    # Load environment variables from .env file in utils directory
    import os
    from pathlib import Path
    env_path = Path(__file__).parent / '.env'
    load_dotenv(env_path)
    # Also try loading from project root as fallback
    load_dotenv()
except ImportError:
    DOTENV_AVAILABLE = False

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class LLMSchemaMapper:
    """
    LLM service for AI-powered schema mapping using Google Gemini API.
    """
    
    def __init__(self, mock_mode: bool = None):
        """
        Initialize the LLM Schema Mapper.
        
        Args:
            mock_mode (bool): If True, uses mock responses. If False, uses Gemini API. 
                            If None, uses config default.
        """
        self.mock_mode = mock_mode if mock_mode is not None else LLM_CONFIG['mock_mode']
        self.model = LLM_CONFIG['model']
        self.api_key = LLM_CONFIG['api_key'] or os.getenv('GOOGLE_API_KEY')
        self.temperature = LLM_CONFIG['temperature']
        self.max_tokens = LLM_CONFIG['max_tokens']
        self.timeout = LLM_CONFIG['timeout']
        
        # Initialize Gemini client if using live mode
        self.gemini_model = None
        if not self.mock_mode:
            self._initialize_gemini()
        
        logger.info(f"Initialized LLM Schema Mapper in {'mock' if self.mock_mode else 'live'} mode")
    
    def _initialize_gemini(self):
        """
        Initialize Google Gemini API client.
        """
        if not GEMINI_AVAILABLE:
            logger.error("Google GenerativeAI library not installed. Install with: pip install google-generativeai")
            raise ImportError("Missing google-generativeai dependency")
        
        if not self.api_key:
            logger.error("Gemini API key not found. Set GOOGLE_API_KEY environment variable.")
            raise ValueError("Missing Gemini API key")
        
        try:
            genai.configure(api_key=self.api_key)
            self.gemini_model = genai.GenerativeModel(
                model_name=self.model,
                generation_config=genai.types.GenerationConfig(
                    temperature=self.temperature,
                    max_output_tokens=self.max_tokens,
                )
            )
            logger.info(f"Successfully initialized Gemini model: {self.model}")
        except Exception as e:
            logger.error(f"Failed to initialize Gemini: {str(e)}")
            raise
    
    def map_field_to_unified_schema(self, source_field: str, source_context: List[str]) -> Tuple[Optional[str], float]:
        """
        Map a source field name to the unified schema using AI reasoning.
        
        Args:
            source_field (str): The field name from the source system
            source_context (List[str]): Other field names in the same source for context
            
        Returns:
            Tuple[Optional[str], float]: (mapped_field_name, confidence_score)
        """
        if self.mock_mode:
            return self._mock_field_mapping(source_field, source_context)
        else:
            return self._call_gemini_api(source_field, source_context)
    
    def _mock_field_mapping(self, source_field: str, source_context: List[str]) -> Tuple[Optional[str], float]:
        """
        Mock implementation that uses rule-based mapping with confidence scoring.
        
        Args:
            source_field (str): The field name to map
            source_context (List[str]): Context fields from the same source
            
        Returns:
            Tuple[Optional[str], float]: (unified_field_name, confidence_score)
        """
        source_field_lower = source_field.lower().strip()
        
        # Direct exact matches (highest confidence)
        for unified_field, variations in FIELD_VARIATIONS.items():
            if source_field_lower in [v.lower() for v in variations]:
                confidence = CONFIDENCE_THRESHOLDS['high']
                logger.info(f"Direct match: '{source_field}' -> '{unified_field}' (confidence: {confidence})")
                return unified_field, confidence
        
        # Fuzzy matching with substring analysis (medium confidence)
        for unified_field, variations in FIELD_VARIATIONS.items():
            for variation in variations:
                if variation.lower() in source_field_lower or source_field_lower in variation.lower():
                    confidence = CONFIDENCE_THRESHOLDS['medium']
                    logger.info(f"Fuzzy match: '{source_field}' -> '{unified_field}' (confidence: {confidence})")
                    return unified_field, confidence
        
        # Contextual reasoning (lower confidence)
        contextual_mapping = self._contextual_field_mapping(source_field_lower, source_context)
        if contextual_mapping:
            logger.info(f"Contextual match: '{source_field}' -> '{contextual_mapping[0]}' (confidence: {contextual_mapping[1]})")
            return contextual_mapping
        
        # No mapping found
        logger.warning(f"No mapping found for field: '{source_field}'")
        return None, 0.0
    
    def _contextual_field_mapping(self, source_field: str, source_context: List[str]) -> Optional[Tuple[str, float]]:
        """
        Use context from other fields to infer the mapping of ambiguous field names.
        
        Args:
            source_field (str): The field name to map
            source_context (List[str]): Other field names in the same source
            
        Returns:
            Optional[Tuple[str, float]]: (unified_field_name, confidence_score) or None
        """
        context_lower = [field.lower() for field in source_context]
        
        # Context-based rules for ambiguous fields
        contextual_rules = {
            # If we see 'id' and there are customer-related fields, map to customer_id
            'id': ('customer_id', 0.6) if any(term in ' '.join(context_lower) 
                                              for term in ['customer', 'client', 'user']) else None,
            
            # If we see 'name' without qualifiers, check context
            'name': ('full_name', 0.6) if not any(term in ' '.join(context_lower) 
                                                   for term in ['first', 'last', 'given', 'family']) else None,
            
            # Date fields - if we see generic 'date' and birth-related context
            'date': ('dob', 0.5) if any(term in ' '.join(context_lower) 
                                        for term in ['birth', 'born', 'dob']) else None,
        }
        
        return contextual_rules.get(source_field)
    
    def generate_schema_mapping(self, source_fields: List[str], source_name: str) -> Dict[str, Dict]:
        """
        Generate a complete schema mapping for all fields in a source.
        
        Args:
            source_fields (List[str]): List of field names from the source
            source_name (str): Name/identifier of the source system
            
        Returns:
            Dict[str, Dict]: Complete mapping with metadata
        """
        mapping_result = {
            'source_name': source_name,
            'source_fields': source_fields,
            'mappings': {},
            'unmapped_fields': [],
            'mapping_stats': {
                'total_fields': len(source_fields),
                'mapped_fields': 0,
                'high_confidence': 0,
                'medium_confidence': 0,
                'low_confidence': 0
            }
        }
        
        # Process each field
        for field in source_fields:
            unified_field, confidence = self.map_field_to_unified_schema(field, source_fields)
            
            if unified_field:
                mapping_result['mappings'][field] = {
                    'unified_field': unified_field,
                    'confidence': confidence,
                    'mapping_type': self._get_confidence_category(confidence)
                }
                mapping_result['mapping_stats']['mapped_fields'] += 1
                
                # Update confidence statistics
                if confidence >= CONFIDENCE_THRESHOLDS['high']:
                    mapping_result['mapping_stats']['high_confidence'] += 1
                elif confidence >= CONFIDENCE_THRESHOLDS['medium']:
                    mapping_result['mapping_stats']['medium_confidence'] += 1
                else:
                    mapping_result['mapping_stats']['low_confidence'] += 1
            else:
                mapping_result['unmapped_fields'].append(field)
        
        # Calculate mapping success rate
        total_fields = mapping_result['mapping_stats']['total_fields']
        mapped_fields = mapping_result['mapping_stats']['mapped_fields']
        mapping_result['mapping_stats']['success_rate'] = mapped_fields / total_fields if total_fields > 0 else 0
        
        logger.info(f"Generated mapping for {source_name}: {mapped_fields}/{total_fields} fields mapped "
                   f"(success rate: {mapping_result['mapping_stats']['success_rate']:.2%})")
        
        return mapping_result
    
    def _get_confidence_category(self, confidence: float) -> str:
        """
        Categorize confidence score into human-readable categories.
        
        Args:
            confidence (float): Numerical confidence score
            
        Returns:
            str: Confidence category ('high', 'medium', 'low')
        """
        if confidence >= CONFIDENCE_THRESHOLDS['high']:
            return 'high'
        elif confidence >= CONFIDENCE_THRESHOLDS['medium']:
            return 'medium'
        else:
            return 'low'
    
    def _call_gemini_api(self, source_field: str, source_context: List[str]) -> Tuple[Optional[str], float]:
        """
        Call Google Gemini API for schema mapping.
        
        Args:
            source_field (str): Field name to map
            source_context (List[str]): Context fields
            
        Returns:
            Tuple[Optional[str], float]: (unified_field_name, confidence_score)
        """
        if not self.gemini_model:
            raise ValueError("Gemini model not initialized")
        
        prompt = self._create_mapping_prompt(source_field, source_context)
        
        try:
            response = self.gemini_model.generate_content(prompt)
            return self._parse_llm_response(response.text)
        except Exception as e:
            logger.error(f"Gemini API call failed: {str(e)}")
            raise
    
    def _create_mapping_prompt(self, source_field: str, source_context: List[str]) -> str:
        """
        Create a prompt for LLM to map field names to unified schema.
        
        Args:
            source_field (str): Field name to map
            source_context (List[str]): Context fields
            
        Returns:
            str: Formatted prompt for LLM
        """
        from utils.config import UNIFIED_SCHEMA
        
        prompt = f"""
        You are an expert data engineer specializing in schema mapping and data integration.
        
        Given a field name from a source system, map it to the most appropriate field in our unified schema.
        
        Source field to map: "{source_field}"
        Other fields in the same source (context): {source_context}
        
        Unified schema fields available:
        {list(UNIFIED_SCHEMA.keys())}
        
        Please respond with:
        1. The best matching unified field name (or "None" if no good match)
        2. A confidence score from 0.0 to 1.0
        3. A brief explanation of your reasoning
        
        Format your response as JSON:
        {{"unified_field": "field_name", "confidence": 0.85, "reasoning": "explanation"}}
        """
        
        return prompt 
    
    def _parse_llm_response(self, response_text: str) -> Tuple[Optional[str], float]:
        """
        Parse LLM response to extract unified field name and confidence score.
        
        Args:
            response_text (str): Raw response from LLM
            
        Returns:
            Tuple[Optional[str], float]: (unified_field_name, confidence_score)
        """
        try:
            # Try to extract JSON from response
            json_match = re.search(r'\{[^}]*\}', response_text)
            if json_match:
                json_str = json_match.group()
                parsed = json.loads(json_str)
                
                unified_field = parsed.get('unified_field')
                confidence = float(parsed.get('confidence', 0.0))
                
                # Validate unified field name
                from utils.config import UNIFIED_SCHEMA
                if unified_field and unified_field not in UNIFIED_SCHEMA.keys() and unified_field.lower() != 'none':
                    logger.warning(f"LLM returned invalid unified field: {unified_field}")
                    return None, 0.0
                
                if unified_field and unified_field.lower() == 'none':
                    return None, 0.0
                
                # Ensure confidence is in valid range
                confidence = max(0.0, min(1.0, confidence))
                
                logger.info(f"LLM mapping: '{unified_field}' (confidence: {confidence})")
                return unified_field, confidence
            
            # If no JSON found, try to extract field name directly
            from utils.config import UNIFIED_SCHEMA
            for field in UNIFIED_SCHEMA.keys():
                if field.lower() in response_text.lower():
                    logger.info(f"LLM text-based mapping: '{field}' (confidence: 0.7)")
                    return field, 0.7  # Medium confidence for text-based extraction
            
            logger.warning(f"Could not parse LLM response: {response_text}")
            return None, 0.0
            
        except Exception as e:
            logger.error(f"Error parsing LLM response: {str(e)}")
            return None, 0.0 