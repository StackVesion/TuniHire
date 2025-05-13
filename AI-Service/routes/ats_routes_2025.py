"""
Routes for the Advanced ATS (Applicant Tracking System) Service 2025
Enhanced resume analysis capabilities with AI-powered insights
"""
import os
import io
import logging
import json
from typing import Dict, List, Optional, Any
from datetime import datetime
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename

from services.ats_service_2025 import ATSService2025
import utils
from utils import token_required, format_api_response, safe_execute, allowed_file

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Blueprint for ATS 2025 routes
ats_2025_bp = Blueprint('ats_2025', __name__)

# Initialize ATS service
ats_service = ATSService2025()

@ats_2025_bp.route('/analyze', methods=['POST'])
@token_required
@safe_execute()
def analyze_resume():
    """
    Analyze resume text against job description with advanced AI techniques
    
    Request should include:
    - resumeText: Text content of the resume
    - jobDescription: Text content of the job posting
    - Optional: requiredSkills, jobMetadata, requiredLanguages, analysisLevel
    
    Returns detailed analysis with match score and insights
    """
    data = request.json
    
    if not data:
        return jsonify(format_api_response(
            "No data provided", success=False
        )), 400
        
    resume_text = data.get('resumeText')
    job_description = data.get('jobDescription')
    
    if not resume_text:
        return jsonify(format_api_response(
            "Resume text is required", success=False
        )), 400
        
    if not job_description:
        return jsonify(format_api_response(
            "Job description is required", success=False
        )), 400
    
    # Optional parameters
    required_skills = data.get('requiredSkills', [])
    job_metadata = data.get('jobMetadata', {})
    required_languages = data.get('requiredLanguages', [])
    analysis_level = data.get('analysisLevel', 'standard')
    
    # Check valid analysis level
    valid_levels = ['basic', 'standard', 'comprehensive']
    if analysis_level not in valid_levels:
        return jsonify(format_api_response(
            f"Invalid analysis level. Must be one of: {', '.join(valid_levels)}", 
            success=False
        )), 400
    
    # Process IDs for tracking and logging
    candidate_id = data.get('candidateId', 'manual')
    job_id = data.get('jobId', 'manual')
    application_id = data.get('applicationId', 'manual')
    
    # Log the analysis request
    logger.info(f"Analyzing resume for application_id={application_id}, job_id={job_id}")
    
    # Call the ATS service for analysis
    analysis_result = ats_service.analyze_resume(
        resume_text=resume_text,
        job_description=job_description,
        required_skills=required_skills,
        job_metadata=job_metadata,
        required_languages=required_languages,
        analysis_level=analysis_level
    )
    
    # Add request metadata to response
    analysis_result['metadata'] = {
        'candidateId': candidate_id,
        'jobId': job_id,
        'applicationId': application_id,
        'timestamp': datetime.now().isoformat(),
        'analysisLevel': analysis_level
    }
    
    # Return successful response
    return jsonify(format_api_response(
        message="Resume analysis completed successfully",
        data=analysis_result
    )), 200

@ats_2025_bp.route('/analyze-file', methods=['POST'])
@token_required
@safe_execute()
def analyze_resume_file():
    """
    Extract text from and analyze a resume file
    
    Supports PDF, DOCX, and other document formats
    
    Form data should include:
    - resumeFile: The file to analyze
    - jobDescription: Text of the job posting
    - Optional: other parameters as in /analyze
    
    Returns extracted text and detailed analysis
    """
    # Check if the post request has the file part
    if 'resumeFile' not in request.files:
        return jsonify(format_api_response(
            "No file part in the request", success=False
        )), 400
        
    file = request.files['resumeFile']
    
    # If user does not select file, browser also
    # submit an empty file without filename
    if file.filename == '':
        return jsonify(format_api_response(
            "No selected file", success=False
        )), 400
        
    # Check for valid file type
    if not allowed_file(file.filename, ['pdf', 'docx', 'doc', 'txt', 'rtf']):
        return jsonify(format_api_response(
            "File type not allowed. Supported types: PDF, DOCX, DOC, TXT, RTF", 
            success=False
        )), 400
        
    # Get form data
    job_description = request.form.get('jobDescription', '')
    analysis_level = request.form.get('analysisLevel', 'standard')
    
    # Obtain other parameters if provided
    try:
        required_skills = json.loads(request.form.get('requiredSkills', '[]'))
    except json.JSONDecodeError:
        required_skills = []
        
    try:
        job_metadata = json.loads(request.form.get('jobMetadata', '{}'))
    except json.JSONDecodeError:
        job_metadata = {}
        
    try:
        required_languages = json.loads(request.form.get('requiredLanguages', '[]'))
    except json.JSONDecodeError:
        required_languages = []
    
    # Save the file temporarily
    filename = secure_filename(file.filename)
    filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)
    
    try:
        # Extract text from the file
        extracted_text = extract_text_from_file(filepath)
        
        if not extracted_text or len(extracted_text.strip()) < 100:
            return jsonify(format_api_response(
                "Could not extract sufficient text from the file", 
                success=False
            )), 400
            
        # Call the analyze endpoint with the extracted text
        analysis_result = ats_service.analyze_resume(
            resume_text=extracted_text,
            job_description=job_description,
            required_skills=required_skills,
            job_metadata=job_metadata,
            required_languages=required_languages,
            analysis_level=analysis_level
        )
        
        # Add the extracted text to the result
        analysis_result['extractedText'] = extracted_text
        
        return jsonify(format_api_response(
            message="Resume file analyzed successfully",
            data=analysis_result
        )), 200
    
    finally:
        # Clean up the temporary file
        try:
            os.remove(filepath)
        except Exception as e:
            logger.warning(f"Could not remove temporary file {filepath}: {str(e)}")

@ats_2025_bp.route('/benchmarks', methods=['POST'])
@token_required
@safe_execute()
def get_industry_benchmarks():
    """
    Get industry-specific benchmarks for skills, experience, and education
    
    Request should include:
    - industry: Industry name or category
    - jobTitle: Specific job title to benchmark
    - Optional: location, companySize, experienceLevel
    
    Returns benchmark data for the specified parameters
    """
    data = request.json
    
    if not data:
        return jsonify(format_api_response(
            "No data provided", success=False
        )), 400
        
    industry = data.get('industry')
    job_title = data.get('jobTitle')
    
    if not industry:
        return jsonify(format_api_response(
            "Industry is required", success=False
        )), 400
        
    if not job_title:
        return jsonify(format_api_response(
            "Job title is required", success=False
        )), 400
    
    # Optional parameters
    location = data.get('location')
    company_size = data.get('companySize')
    experience_level = data.get('experienceLevel')
    
    # Get benchmarks for the specified parameters
    # This would be implemented in the ATS service
    benchmark_data = {
        'industry': industry,
        'jobTitle': job_title,
        'skills': {
            'essential': ['skill1', 'skill2', 'skill3'],
            'preferred': ['skill4', 'skill5'],
            'emerging': ['emerging_skill1', 'emerging_skill2']
        },
        'experience': {
            'averageYears': 3.5,
            'minimumYears': 2,
            'recommendedYears': 3
        },
        'education': {
            'minimumLevel': 'bachelor',
            'preferredLevel': 'master',
            'relevantFields': ['field1', 'field2']
        },
        'compensation': {
            'medianSalary': 75000,
            'salaryRange': {
                'min': 65000,
                'max': 95000
            }
        }
    }
    
    return jsonify(format_api_response(
        message="Industry benchmarks retrieved successfully",
        data=benchmark_data
    )), 200

@ats_2025_bp.route('/job-requirements', methods=['POST'])
@token_required
@safe_execute()
def extract_job_requirements():
    """
    Extract structured job requirements from a job description
    
    Request should include:
    - jobDescription: Full text of the job posting
    
    Returns structured data with required skills, experience, education, etc.
    """
    data = request.json
    
    if not data:
        return jsonify(format_api_response(
            "No data provided", success=False
        )), 400
        
    job_description = data.get('jobDescription')
    
    if not job_description:
        return jsonify(format_api_response(
            "Job description is required", success=False
        )), 400
    
    # Extract structured requirements from the job description
    # This would be implemented in the ATS service
    extracted_requirements = {
        'requiredSkills': ['skill1', 'skill2', 'skill3'],
        'preferredSkills': ['skill4', 'skill5'],
        'requiredExperience': {
            'years': 3,
            'description': 'At least 3 years of experience in...'
        },
        'requiredEducation': {
            'level': 'bachelor',
            'fields': ['Computer Science', 'related field']
        },
        'requiredLanguages': [
            {'language': 'en', 'level': 'C1'}
        ],
        'jobLevel': 'mid-level',
        'jobLocation': 'New York',
        'workArrangement': 'hybrid'
    }
    
    return jsonify(format_api_response(
        message="Job requirements extracted successfully",
        data=extracted_requirements
    )), 200

@ats_2025_bp.route('/batch-analyze', methods=['POST'])
@token_required
@safe_execute()
def batch_analyze_resumes():
    """
    Analyze multiple resumes against a job description
    
    Request should include:
    - resumes: Array of resume texts or objects with ID and text
    - jobDescription: Text of the job posting
    - Optional: analysisLevel, etc.
    
    Returns analysis results for all resumes with ranking
    """
    data = request.json
    
    if not data:
        return jsonify(format_api_response(
            "No data provided", success=False
        )), 400
        
    resumes = data.get('resumes')
    job_description = data.get('jobDescription')
    
    if not resumes or not isinstance(resumes, list) or len(resumes) == 0:
        return jsonify(format_api_response(
            "Resumes array is required and must not be empty", success=False
        )), 400
        
    if not job_description:
        return jsonify(format_api_response(
            "Job description is required", success=False
        )), 400
    
    # Optional parameters
    analysis_level = data.get('analysisLevel', 'standard')
    
    # Process each resume
    results = []
    
    for resume in resumes:
        # Handle different resume input formats
        if isinstance(resume, str):
            resume_text = resume
            resume_id = None
        elif isinstance(resume, dict):
            resume_text = resume.get('text', '')
            resume_id = resume.get('id')
        else:
            continue
            
        if not resume_text:
            continue
            
        # Analyze the resume
        analysis_result = ats_service.analyze_resume(
            resume_text=resume_text,
            job_description=job_description,
            analysis_level=analysis_level
        )
        
        # Add the resume ID to the result
        analysis_result['resumeId'] = resume_id
        
        results.append(analysis_result)
    
    # Sort results by match score (descending)
    results.sort(key=lambda x: x.get('matchScore', 0), reverse=True)
    
    # Add rankings
    for i, result in enumerate(results):
        result['rank'] = i + 1
    
    return jsonify(format_api_response(
        message=f"Batch analysis completed for {len(results)} resumes",
        data={
            'results': results,
            'count': len(results),
            'timestamp': datetime.now().isoformat()
        }
    )), 200

def extract_text_from_file(file_path):
    """
    Extract text from a document file (PDF, DOCX, etc.)
    
    Args:
        file_path: Path to the document file
        
    Returns:
        Extracted text as a string
    """
    import os
    import logging
    
    logger = logging.getLogger(__name__)
    file_extension = os.path.splitext(file_path)[1].lower()
    
    try:
        # Extract text from PDF
        if file_extension == '.pdf':
            return extract_text_from_pdf(file_path)
            
        # Extract text from DOCX
        elif file_extension == '.docx':
            return extract_text_from_docx(file_path)
            
        # Extract text from DOC
        elif file_extension == '.doc':
            return extract_text_from_doc(file_path)
            
        # Extract text from TXT
        elif file_extension == '.txt':
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as file:
                return file.read()
                
        # Extract text from RTF
        elif file_extension == '.rtf':
            return extract_text_from_rtf(file_path)
            
        else:
            logger.warning(f"Unsupported file type: {file_extension}")
            return ""
            
    except Exception as e:
        logger.error(f"Error extracting text from file: {str(e)}")
        return ""

def extract_text_from_pdf(file_path):
    """Extract text from a PDF file"""
    logger = logging.getLogger(__name__)
    
    try:
        # Try to import PyPDF2
        try:
            from PyPDF2 import PdfReader
            reader = PdfReader(file_path)
            text = ""
            for page in reader.pages:
                text += page.extract_text() + "\n"
            return text
        except ImportError:
            logger.warning("PyPDF2 not available, trying pdfplumber")
            
            # Try pdfplumber as an alternative
            try:
                import pdfplumber
                with pdfplumber.open(file_path) as pdf:
                    text = ""
                    for page in pdf.pages:
                        text += page.extract_text() or ""
                    return text
            except ImportError:
                logger.warning("pdfplumber not available, falling back to basic extraction")
                
                # Last resort, try basic binary extraction
                with open(file_path, 'rb') as file:
                    content = file.read()
                    # Simple text extraction from PDF binary content
                    # This is a very basic approach and won't work well with many PDFs
                    text = ""
                    start = 0
                    while True:
                        start = content.find(b'(', start)
                        if start == -1:
                            break
                        end = content.find(b')', start)
                        if end == -1:
                            break
                        # Extract text between parentheses
                        chunk = content[start+1:end]
                        if all(32 <= byte <= 126 or byte in (9, 10, 13) for byte in chunk):
                            text += chunk.decode('latin-1', errors='ignore') + " "
                        start = end
                    return text
    except Exception as e:
        logger.error(f"Error extracting text from PDF: {str(e)}")
        return ""

def extract_text_from_docx(file_path):
    """Extract text from a DOCX file"""
    logger = logging.getLogger(__name__)
    
    try:
        try:
            # Try python-docx
            import docx
            doc = docx.Document(file_path)
            text = ""
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
            return text
        except ImportError:
            logger.warning("python-docx not available, using fallback")
            
            # Fallback using a zipfile approach (docx files are ZIP archives)
            import zipfile
            import xml.etree.ElementTree as ET
            
            try:
                with zipfile.ZipFile(file_path) as docx_zip:
                    content = docx_zip.read('word/document.xml')
                    tree = ET.fromstring(content)
                    
                    # Define XML namespace
                    ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
                    
                    # Extract text from paragraphs
                    text = ""
                    for paragraph in tree.findall('.//w:p', ns):
                        for text_element in paragraph.findall('.//w:t', ns):
                            text += text_element.text or ""
                        text += "\n"
                    
                    return text
            except Exception:
                logger.warning("XML parsing failed, falling back to basic extraction")
                return ""
    except Exception as e:
        logger.error(f"Error extracting text from DOCX: {str(e)}")
        return ""

def extract_text_from_doc(file_path):
    """Extract text from a DOC file"""
    logger = logging.getLogger(__name__)
    
    try:
        # Try with antiword if available
        import subprocess
        try:
            result = subprocess.run(['antiword', file_path], stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
            return result.stdout.decode('utf-8', errors='ignore')
        except (FileNotFoundError, subprocess.SubprocessError):
            logger.warning("antiword not available or failed, trying textract")
            
            # Try with textract if available
            try:
                import textract
                text = textract.process(file_path).decode('utf-8', errors='ignore')
                return text
            except ImportError:
                logger.warning("textract not available, falling back to basic extraction")
                
                # Try with binary reading as last resort
                with open(file_path, 'rb') as file:
                    content = file.read()
                    # Very basic text extraction from DOC binary
                    # This is extremely limited and unreliable
                    return ''.join(chr(b) for b in content if 32 <= b <= 126 or b in (9, 10, 13))
    except Exception as e:
        logger.error(f"Error extracting text from DOC: {str(e)}")
        return ""

def extract_text_from_rtf(file_path):
    """Extract text from an RTF file"""
    logger = logging.getLogger(__name__)
    
    try:
        # Try with striprtf if available
        try:
            from striprtf.striprtf import rtf_to_text
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as file:
                rtf_text = file.read()
                return rtf_to_text(rtf_text)
        except ImportError:
            logger.warning("striprtf not available, trying unrtf")
            
            # Try with unrtf command-line tool
            import subprocess
            try:
                result = subprocess.run(['unrtf', '--text', file_path], stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
                return result.stdout.decode('utf-8', errors='ignore')
            except (FileNotFoundError, subprocess.SubprocessError):
                logger.warning("unrtf not available or failed, using basic extraction")
                
                # Basic approach - read and strip rtf control sequences
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as file:
                    rtf_text = file.read()
                    
                    # Very basic RTF control sequence removal
                    # Remove control words
                    import re
                    text = re.sub(r'\\[a-z]+(-?[0-9]+)?[ ]?', ' ', rtf_text)
                    # Remove curly braces
                    text = re.sub(r'[{}]', '', text)
                    # Remove control symbols
                    text = re.sub(r'\\[^a-z]', '', text)
                    
                    return text
    except Exception as e:
        logger.error(f"Error extracting text from RTF: {str(e)}")
        return "" 