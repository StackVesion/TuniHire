# TuniHire Admin Panel

## Overview

The Admin Panel provides a comprehensive control center for platform administrators to manage and monitor all aspects of the TuniHire recruitment platform. It enables oversight of users, companies, jobs, and system configuration.

## Technology Stack

- **React**: Frontend library
- **Redux**: State management
- **Material UI**: Component library for consistent design
- **Axios**: HTTP client for API communication
- **Chart.js**: Data visualization
- **React Router**: Navigation management

## Key Features

- **User Management**: Manage candidate and company accounts
- **Content Moderation**: Review and approve job listings and company profiles
- **System Monitoring**: Track platform usage and performance
- **Analytics Dashboard**: View key performance metrics
- **Configuration**: Manage system settings and parameters
- **AI Service Control**: Monitor and configure AI services
- **Audit Logs**: View system and user activities

## Integration Points

- **Back-end API**: Core business logic (port 5000)
- **AI-Service**: AI system monitoring (port 5001)
- **Recommendation-AI**: Recommendation system management (port 5003)

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm start
   ```

3. Access the application at [http://localhost:3002](http://localhost:3002)

## Environment Configuration

Create a `.env` file with the following variables:

```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_AI_SERVICE_URL=http://localhost:5001/api
REACT_APP_RECOMMENDATION_SERVICE_URL=http://localhost:5003/api
```

## Architecture

The Admin Panel follows a modular architecture:

- **src/components/**: Reusable UI components
- **src/pages/**: Main application pages
- **src/redux/**: State management with actions and reducers
- **src/services/**: API service connections
- **src/utils/**: Helper functions and utilities
- **src/hooks/**: Custom React hooks

## Security

The Admin Panel implements several security measures:

- **Role-based Access Control**: Different admin roles with varying permissions
- **Secure Authentication**: JWT-based authentication with refresh tokens
- **Activity Logging**: All admin actions are logged for accountability
- **Session Management**: Automatic session timeout after inactivity

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
