# Schema Identification Agent - AI-Powered Customer Data Integration

A modular Python system using AI-assisted agents to handle fragmented customer data from multiple sources. This repository contains **Agent 1: Schema Identification Agent** that automatically detects and maps inconsistent schemas to a unified structure.

## System Overview

### Agent 1: Schema Identification Agent

**Responsibilities:**

- Inspect schemas (column names) from various data sources
- Map inconsistent or legacy field names to unified schema using Gemini LLM logic
- Save mappings per source for later use by other agents
- Transform data to match unified schema structure

**Unified Schema Fields:**

- `customer_id`, `full_name`, `email`, `phone`, `address`, `dob`, `created_at`, `updated_at`

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

3. **Run the system:**
   ```bash
   python main.py
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
