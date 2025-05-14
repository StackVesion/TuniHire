# TuniHire Front-End

## Overview

The Front-End component serves as the candidate-facing interface for the TuniHire platform. It is built using Next.js, a React framework, and provides a modern, responsive user experience for job seekers. 

## Technology Stack

- **Next.js/React**: Frontend framework
- **CSS/SASS**: Styling
- **Axios**: HTTP client for API requests
- **JWT**: Authentication token handling
- **SweetAlert2**: User notifications
- **React Icons**: Icon library

## Key Features

- **User Registration & Authentication**: Account creation and login for job seekers
- **Profile Management**: Create and edit professional profiles
- **Job Search**: Browse and filter available job listings
- **Application Tracking**: Monitor status of submitted applications
- **Video Interviews**: Join and participate in virtual interviews
- **Profile Verification**: Face recognition verification 
- **AI Preparation**: Access to interview preparation bot
- **Resume Generation**: Automatic CV creation from profile data

## Integration Points

- **Back-end API**: Core business logic and data (port 5000)
- **AI-Service**: Face verification features (port 5001)
- **Bot Service**: Interview preparation services (port 8080)

## Getting Started

First, install dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Environment Configuration

Create a `.env.local` file with the following variables:

```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_AI_SERVICE_URL=http://localhost:5001/api
NEXT_PUBLIC_BOT_SERVICE_URL=http://localhost:8080
```

## Architecture

The application follows a component-based architecture:

- **pages/**: Next.js pages and routes
- **components/**: Reusable React components
- **public/**: Static assets
- **styles/**: CSS and SASS styles
- **utils/**: Utility functions and helpers
- **context/**: React context for state management

## Deployment

The front-end can be built for production using:

```bash
npm run build
npm start
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
