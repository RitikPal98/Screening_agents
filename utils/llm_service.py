"""
LLM Service module for AI-powered schema mapping using Google Gemini API.
"""

import json
import logging
import os
import re
from typing import Dict, List, Tuple, Optional
from utils.config import LLM_CONFIG, UNIFIED_SCHEMA

# Import dependencies
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
    
    def __init__(self):
        """
        Initialize the LLM Schema Mapper with Gemini API.
        """
        self.model = LLM_CONFIG['model']
        self.api_key = LLM_CONFIG['api_key'] or os.getenv('GOOGLE_API_KEY')
        self.temperature = LLM_CONFIG['temperature']
        self.max_tokens = LLM_CONFIG['max_tokens']
        self.timeout = LLM_CONFIG['timeout']
        
        # Initialize Gemini client
        self.gemini_model = None
        self._initialize_gemini()
        
        logger.info("Initialized LLM Schema Mapper with Gemini API")
    
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
        return self._call_gemini_api(source_field, source_context)
    
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
            for field in UNIFIED_SCHEMA.keys():
                if field.lower() in response_text.lower():
                    logger.info(f"LLM text-based mapping: '{field}' (confidence: 0.7)")
                    return field, 0.7  # Medium confidence for text-based extraction
            
            logger.warning(f"Could not parse LLM response: {response_text}")
            return None, 0.0
            
        except Exception as e:
            logger.error(f"Error parsing LLM response: {str(e)}")
            return None, 0.0 