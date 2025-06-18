# Enhanced Schema Identification Agent - AI-Powered Customer Data Integration 🤖

A robust AI-powered system for handling **both structured and unstructured** customer data from multiple sources (2000+). The enhanced system intelligently processes diverse data types, evolves schemas dynamically, and builds complete customer profiles through AI-powered field extraction and profile matching.

## System Overview

### Agent 1: Enhanced Schema Identification Agent 🔥

**Purpose**: Intelligently process structured & unstructured data with dynamic schema evolution

**Input Types:**

- **Structured**: CSV/Excel/JSON files with column headers
- **Unstructured**: Free-text data (customer notes, descriptions, etc.)

**Key Features:**

- ✅ **Intelligent Data Type Detection**: Auto-detects structured vs unstructured data
- ✅ **Dynamic Schema Evolution**: Extends schema when new relevant fields discovered
- ✅ **LLM-Powered Text Extraction**: Extracts structured fields from free-text
- ✅ **Smart Name Handling**: Manages `first_name`, `last_name`, `full_name` intelligently
- ✅ **Comprehensive Logging**: Tracks unmapped fields with confidence scores

**Output Files:**

- `processed_data/*.csv` - Unified data format
- `schema_mappings/*_map.json` - Field mapping details
- `unified_schema.json` - Dynamic schema definition
- `unmapped_fields.json` - Unmapped fields log

### Agent 2: Customer Profile Integration Agent

**Purpose**: Query and stitch related customer data using anchor attributes
**Input**: Unified data from Enhanced Agent 1 + customer query
**Output**: Complete customer profiles with all related data

## Quick Start

### Prerequisites

- Python 3.7+
- pip package manager

### Installation

1. **Clone/Download the project:**

   ```bash
   # Extract or navigate to the project directory
   cd Agent1
   ```

2. **Install dependencies:**

   ```bash
   pip install -r requirements.txt
   ```

3. **Set up Gemini API Key:**

   ```bash
   cd utils
   echo "GOOGLE_API_KEY=your_gemini_api_key_here" > .env
   ```

4. **Add your data sources** to the `data_sources/` directory:

   **Structured Data** (CSV/Excel/JSON with columns):

   ```
   data_sources/
   ├── crm_system.csv           # fname, lname, email, etc.
   ├── ecommerce_platform.csv   # given_name, family_name, contact, etc.
   └── legacy_database.csv      # first_nm, last_nm, email_addr, etc.
   ```

   **Unstructured Data** (Single text column):

   ```
   data_sources/
   └── customer_notes.csv       # Free-text customer information
   ```

5. **Run Enhanced Agent 1** (Schema Identification):

   ```bash
   python main.py
   ```

6. **Run Agent 2** (Profile Matching):
   ```bash
   python profile_matcher.py
   ```

## Project Structure

```
Agent1/
├── agents/
│   ├── __init__.py
│   └── schema_identification_agent.py    # Main Agent 1 implementation
├── utils/
│   ├── __init__.py
│   ├── config.py                         # Configuration & unified schema
│   ├── llm_service.py                    # LLM service for AI mapping
│   └── data_loader.py                    # Data loading utilities
├── data_sources/                         # Sample data with inconsistent schemas
├── schema_mappings/                      # Generated mapping files
├── output/                               # Transformed data output
├── main.py                               # Main implementation
├── requirements.txt                      # Python dependencies
└── README.md                             # This file
```

## Core Components

### SchemaIdentificationAgent

Main agent class with key methods:

- `discover_data_sources()` - Find and catalog source files
- `extract_schema_from_source(source_name)` - Extract column names
- `generate_schema_mapping(source_name)` - Create AI-powered mappings
- `save_schema_mapping(source_name)` - Persist mappings to JSON
- `map_to_unified_schema(df, schema_map)` - Transform data

### LLMSchemaMapper

AI service for intelligent field mapping using Google Gemini API.

### DataLoader

Utility for loading and working with data:

- Supports CSV, Excel, and JSON formats
- Schema comparison between sources
- Data export in multiple formats
- Source metadata extraction

## Using Google Gemini API

The system supports AI-powered schema mapping using Google Gemini API only.

### Setup Gemini API

1. **Get API Key:**
   Visit: https://aistudio.google.com/app/apikey

2. **Set Environment Variable:**

   ```bash
   # Windows
   set GOOGLE_API_KEY=your_api_key_here

   # Linux/Mac
   export GOOGLE_API_KEY=your_api_key_here
   ```

3. **Install Gemini Library:**

   ```bash
   pip install google-generativeai
   ```

## Technical Details

### AI-Powered Mapping Logic

- The system uses the Gemini LLM to map source fields to the unified schema. All mapping is performed by the LLM, leveraging context and schema definitions.

## License

This project is for demonstration purposes. Extend and modify as needed for your use case.

## Contributing

This is Agent 1 of a larger system. Future agents will handle:

- **Agent 2:** Customer profile integration and deduplication
- **Agent 3:** Data quality assessment and cleansing
- **Agent 4:** Real-time data synchronization
