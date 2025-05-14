# TuniHire - AI-Powered Recruitment Platform

## Overview

TuniHire is a comprehensive recruitment platform that leverages artificial intelligence to streamline and enhance the hiring process. The platform connects job seekers with employers, facilitates virtual interviews, provides AI-powered job matching, and offers preparation tools for candidates.

## Architecture

TuniHire follows a microservices architecture with the following components:

1. **Front-End** - React-based user interface for job seekers
2. **Company-Panel** - React-based dashboard for companies/employers
3. **Admin-Panel** - Administration dashboard for platform management
4. **Back-end** - Node.js/Express API server handling core business logic
5. **AI-Service** - Python Flask service for AI features like face verification
6. **Recommendation-AI** - Python service for job matching algorithms

## Key Features

- **AI-Powered Job Matching**: Intelligent algorithms match candidates with suitable job positions
- **Virtual Interviews**: Real-time video interviews with AI interview bots
- **Profile Verification**: Face recognition for candidate verification
- **Preparation Bots**: AI assistants to help candidates prepare for interviews
- **CV Generation**: Automatic resume creation from user profiles

## Services & Ports

| Service | Technology | Default Port |
|---------|------------|---------------|
| Back-end | Node.js/Express | 5000 |
| Front-End | React | 3000 |
| Company-Panel | React | 3001 |
| Admin-Panel | React | 3002 |
| AI-Service | Python/Flask | 5001 |
| Recommendation-AI | Python/Flask | 5003 |

## Getting Started

Each component has its own README with specific setup instructions. See the following directories for more details:

- [Back-end](./Back-end/README.md)
- [Front-End](./Front-End/README.md)
- [Company-Panel](./Company-Panel/README.md)
- [Admin-Panel](./Admin-Panel/README.md)
- [AI-Service](./AI-Service/README.md)
- [Recommendation-AI](./Recommendation-Ai/README.md)

## License

All Rights Reserved. © 2025 TuniHire