#!/usr/bin/env python
"""
TuniHire AI Recommendation Service Launcher

This script sets up and runs the TuniHire AI Recommendation Service.
It handles:
- Creating a virtual environment
- Installing dependencies
- Ensuring model directories exist
- Starting the Flask API server

Usage:
    python run_api.py [--install] [--data] [--recreate-venv] [port]
    
Options:
    --install        Install dependencies in a virtual environment first
    --data           Generate test data if database is empty
    --recreate-venv  Recreate the virtual environment
    port             Port to run the Flask app on (default: 5003)
"""

import os
import sys
import argparse
import subprocess
import datetime
import json
import venv
from pathlib import Path

# Base directory of the application
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def setup_virtual_env():
    """Create a virtual environment if it doesn't exist"""
    venv_dir = os.path.join(BASE_DIR, "venv")
    
    if not os.path.exists(venv_dir):
        print("Creating virtual environment...")
        venv.create(venv_dir, with_pip=True)
        print("Virtual environment created at", venv_dir)
    else:
        print("Virtual environment already exists at", venv_dir)
    
    return venv_dir

def get_python_executable(venv_dir):
    """Get the Python executable path for the virtual environment"""
    if os.name == 'nt':  # Windows
        return os.path.join(venv_dir, "Scripts", "python.exe")
    else:  # Unix/Linux/Mac
        return os.path.join(venv_dir, "bin", "python")

def install_dependencies(python_executable):
    """Install dependencies from requirements.txt"""
    req_file = os.path.join(BASE_DIR, "requirements.txt")
    
    if os.path.exists(req_file):
        print("Installing dependencies from requirements.txt...")
        subprocess.run([python_executable, "-m", "pip", "install", "-r", req_file])
        print("Dependencies installed successfully")
    else:
        print("Error: requirements.txt not found")
        sys.exit(1)

def ensure_folders_exist():
    """Ensure necessary folders exist"""
    # Create models directory if it doesn't exist
    models_dir = os.path.join(BASE_DIR, "app", "models")
    os.makedirs(models_dir, exist_ok=True)
    
    # Create training history directory if it doesn't exist
    history_dir = os.path.join(BASE_DIR, "training_history")
    os.makedirs(history_dir, exist_ok=True)
    
    print(f"Ensured required directories exist: {models_dir}, {history_dir}")

def generate_test_data(python_executable):
    """Generate test data if requested"""
    print("Generating test data...")
    data_generator = os.path.join(BASE_DIR, "test_data_generator.py")
    subprocess.run([python_executable, data_generator, "--count", "50"])

def log_training_run():
    """Log a training run in the training history folder"""
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    history_file = os.path.join(BASE_DIR, "training_history", f"training_run_{timestamp}.json")
    
    # Collect environment information
    info = {
        "timestamp": timestamp,
        "python_version": sys.version,
        "platform": sys.platform,
        "command_line": " ".join(sys.argv),
        "environment_variables": {
            key: value for key, value in os.environ.items() 
            if key.startswith(("FLASK", "MONGO", "PYTHONPATH"))
        }
    }
    
    # Save to training history folder
    with open(history_file, 'w') as f:
        json.dump(info, f, indent=2, default=str)
    
    print(f"Logged training run information to {history_file}")

def run_flask_app(python_executable, port=5003):
    """Run the Flask application"""
    print("\nStarting TuniHire AI Recommendation API...")
    run_script = os.path.join(BASE_DIR, "run.py")
    
    # Use current Python executable if the virtual environment's python doesn't exist
    if not os.path.exists(python_executable):
        python_executable = sys.executable
        print(f"Using system Python at: {python_executable}")
    
    # Set environment variable for port if specified
    env = os.environ.copy()
    env["FLASK_RUN_PORT"] = str(port)
    print(f"Running on port: {port}")
    
    # Use subprocess to run the Flask app
    subprocess.run([python_executable, run_script], env=env)

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="Run TuniHire AI Recommendation API")
    parser.add_argument("--install", action="store_true", help="Install dependencies in virtual environment")
    parser.add_argument("--data", action="store_true", help="Generate test data")
    parser.add_argument("--recreate-venv", action="store_true", help="Recreate the virtual environment")
    parser.add_argument("port", nargs="?", type=int, default=5003, help="Port to run the Flask app on (default: 5003)")
    
    args = parser.parse_args()
    
    # Recreate virtual environment if requested
    if args.recreate_venv:
        venv_dir = os.path.join(BASE_DIR, "venv")
        if os.path.exists(venv_dir):
            print(f"Removing existing virtual environment at {venv_dir}...")
            import shutil
            shutil.rmtree(venv_dir, ignore_errors=True)
            print("Virtual environment removed.")
    
    # Setup virtual environment
    venv_dir = setup_virtual_env()
    python_executable = get_python_executable(venv_dir)
    
    # Install dependencies if requested or if venv was recreated
    if args.install or args.recreate_venv:
        install_dependencies(python_executable)
    
    # Ensure required folders exist
    ensure_folders_exist()
    
    # Log this training/execution run
    log_training_run()
    
    # Generate test data if requested
    if args.data:
        generate_test_data(python_executable)
    
    # Run the Flask application with the specified port
    run_flask_app(python_executable, args.port)

if __name__ == "__main__":
    main()
