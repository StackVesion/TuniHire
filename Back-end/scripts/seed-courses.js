const mongoose = require('mongoose');
require('dotenv').config();
const Course = require('../models/Course');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/tunihire', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
  seedCourses();
}).catch(err => {
  console.error('Failed to connect to MongoDB', err);
});

// Sample courses data
const coursesData = [
  {
    title: 'Web Development Fundamentals',
    description: 'Learn the core fundamentals of web development including HTML, CSS, and JavaScript. This course provides a solid foundation for anyone looking to start a career in web development or enhance their existing skills. You will build several practical projects along the way.',
    shortDescription: 'Master the basics of HTML, CSS and JavaScript',
    thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085',
    coverImage: 'https://images.unsplash.com/photo-1517180102446-f3ece451e9d8',
    instructor: {
      name: 'John Smith',
      bio: 'Senior Developer with 10+ years of experience',
      avatar: 'https://randomuser.me/api/portraits/men/1.jpg'
    },
    category: 'Web Development',
    tags: ['HTML', 'CSS', 'JavaScript', 'Frontend'],
    skills: ['HTML5', 'CSS3', 'JavaScript ES6', 'Responsive Design'],
    difficulty: 'beginner',
    duration: 600, // 10 hours
    subscriptionRequired: 'Free',
    isPublished: true,
    steps: [
      {
        title: 'Introduction to Web Development',
        description: 'Overview of what you\'ll learn in this course and how the web works',
        type: 'video',
        content: {
          videoUrl: 'https://www.youtube.com/embed/3JluqTojuME',
          duration: 15
        },
        order: 1
      },
      {
        title: 'HTML Basics',
        description: 'Learn the core HTML elements and document structure',
        type: 'video',
        content: {
          videoUrl: 'https://www.youtube.com/embed/UB1O30fR-EE',
          duration: 25
        },
        order: 2
      },
      {
        title: 'Quiz: HTML Fundamentals',
        description: 'Test your knowledge of HTML basics',
        type: 'quiz',
        content: {
          questions: [
            {
              question: 'What does HTML stand for?',
              options: [
                'Hyper Text Markup Language',
                'Hyper Transfer Markup Language',
                'High Tech Modern Language',
                'Home Tool Markup Language'
              ],
              correctAnswer: 'Hyper Text Markup Language',
              explanation: 'HTML is the standard markup language for Web pages.'
            },
            {
              question: 'Which HTML tag is used for the largest heading?',
              options: ['<h6>', '<heading>', '<h1>', '<head>'],
              correctAnswer: '<h1>',
              explanation: 'The <h1> element defines the most important heading on a page.'
            },
            {
              question: 'Which attribute specifies an alternate text for an image?',
              options: ['alt', 'title', 'src', 'link'],
              correctAnswer: 'alt',
              explanation: 'The alt attribute provides alternative information for an image if a user cannot view it.'
            }
          ],
          passingScore: 70
        },
        order: 3
      },
      {
        title: 'CSS Fundamentals',
        description: 'Learn how to style web pages with CSS',
        type: 'video',
        content: {
          videoUrl: 'https://www.youtube.com/embed/1PnVor36_40',
          duration: 30
        },
        order: 4
      },
      {
        title: 'JavaScript Basics',
        description: 'Introduction to JavaScript programming',
        type: 'video',
        content: {
          videoUrl: 'https://www.youtube.com/embed/W6NZfCO5SIk',
          duration: 35
        },
        order: 5
      },
      {
        title: 'Final Assessment',
        description: 'Comprehensive test covering HTML, CSS, and JavaScript basics',
        type: 'test',
        content: {
          questions: [
            {
              question: 'Which CSS property is used to change the text color?',
              options: ['text-color', 'color', 'font-color', 'text-style'],
              correctAnswer: 'color',
              explanation: 'The color property is used to set the color of the text.'
            },
            {
              question: 'What is the correct JavaScript syntax to change the content of an HTML element?',
              options: [
                'document.getElementById("demo").innerHTML = "Hello World!";',
                'document.getElement("demo").innerHTML = "Hello World!";',
                '#demo.innerHTML = "Hello World!";',
                'document.getElementByName("demo").innerHTML = "Hello World!";'
              ],
              correctAnswer: 'document.getElementById("demo").innerHTML = "Hello World!";',
              explanation: 'The getElementById method accesses an HTML element with a specific id.'
            },
            {
              question: 'Which CSS property is used to make text bold?',
              options: ['weight: bold', 'font-weight: bold', 'style: bold', 'text-weight: bold'],
              correctAnswer: 'font-weight: bold',
              explanation: 'The font-weight property sets how thick or thin characters in text should be displayed.'
            },
            {
              question: 'Which HTML tag is used to define an unordered list?',
              options: ['<ol>', '<list>', '<ul>', '<dl>'],
              correctAnswer: '<ul>',
              explanation: 'The <ul> tag defines an unordered (bulleted) list.'
            }
          ],
          passingScore: 75
        },
        order: 6
      }
    ]
  },
  {
    title: 'Advanced React Development',
    description: 'Take your React skills to the next level with advanced patterns, hooks, and state management. Learn how to build complex applications with React and related libraries. This course covers Context API, Redux, performance optimization, and testing.',
    shortDescription: 'Master advanced React concepts and state management',
    thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee',
    coverImage: 'https://images.unsplash.com/photo-1587620962725-abab7fe55159',
    instructor: {
      name: 'Sarah Johnson',
      bio: 'React Specialist and Frontend Architect',
      avatar: 'https://randomuser.me/api/portraits/women/2.jpg'
    },
    category: 'Web Development',
    tags: ['React', 'JavaScript', 'Frontend', 'State Management'],
    skills: ['React Hooks', 'Context API', 'Redux', 'Performance Optimization'],
    difficulty: 'intermediate',
    duration: 720, // 12 hours
    subscriptionRequired: 'Golden',
    isPublished: true,
    steps: [
      {
        title: 'Advanced React Overview',
        description: 'Introduction to advanced React concepts and patterns',
        type: 'video',
        content: {
          videoUrl: 'https://www.youtube.com/embed/w7ejDZ8SWv8',
          duration: 20
        },
        order: 1
      },
      {
        title: 'React Hooks Deep Dive',
        description: 'Master the full power of React Hooks',
        type: 'video',
        content: {
          videoUrl: 'https://www.youtube.com/embed/TNhaISOUy6Q',
          duration: 40
        },
        order: 2
      },
      {
        title: 'Context API and State Management',
        description: 'Learn how to manage application state effectively',
        type: 'video',
        content: {
          videoUrl: 'https://www.youtube.com/embed/35lXWvCuM8o',
          duration: 35
        },
        order: 3
      },
      {
        title: 'Quiz: React Concepts',
        description: 'Test your understanding of advanced React concepts',
        type: 'quiz',
        content: {
          questions: [
            {
              question: 'What Hook would you use to run side effects in your component?',
              options: ['useEffect', 'useState', 'useContext', 'useReducer'],
              correctAnswer: 'useEffect',
              explanation: 'useEffect is used for performing side effects in function components.'
            },
            {
              question: 'What is the purpose of the key prop in React lists?',
              options: [
                'It\'s required for all React elements',
                'It helps React identify which items have changed, are added, or are removed',
                'It defines the CSS styles for the list items',
                'It sets the DOM ID for each element'
              ],
              correctAnswer: 'It helps React identify which items have changed, are added, or are removed',
              explanation: 'Keys help React identify which items have changed, are added, or are removed, which improves performance and stability.'
            }
          ],
          passingScore: 70
        },
        order: 4
      },
      {
        title: 'Performance Optimization',
        description: 'Techniques to optimize React application performance',
        type: 'video',
        content: {
          videoUrl: 'https://www.youtube.com/embed/IYikhsDVvic',
          duration: 30
        },
        order: 5
      },
      {
        title: 'Final Project Assessment',
        description: 'Build a complete React application applying all learned concepts',
        type: 'test',
        content: {
          questions: [
            {
              question: 'Which method would you use to prevent unnecessary re-renders in a functional component?',
              options: ['useEffect', 'React.memo', 'useState', 'useContext'],
              correctAnswer: 'React.memo',
              explanation: 'React.memo is a higher order component that memoizes your component to prevent unnecessary re-renders.'
            },
            {
              question: 'What is Redux primarily used for?',
              options: [
                'DOM manipulation',
                'State management',
                'Styling components',
                'Server-side rendering'
              ],
              correctAnswer: 'State management',
              explanation: 'Redux is a predictable state container designed to help you write JavaScript apps that behave consistently across different environments.'
            },
            {
              question: 'Which hook replaces componentDidMount, componentDidUpdate, and componentWillUnmount combined?',
              options: ['useReducer', 'useState', 'useEffect', 'useRef'],
              correctAnswer: 'useEffect',
              explanation: 'useEffect handles all three lifecycle methods (componentDidMount, componentDidUpdate, and componentWillUnmount) depending on how you use it.'
            }
          ],
          passingScore: 80
        },
        order: 6
      }
    ]
  },
  {
    title: 'Machine Learning Fundamentals',
    description: 'Introduction to machine learning concepts, algorithms, and practical applications. This course covers supervised and unsupervised learning, model evaluation, and Python libraries for ML. By the end, you\'ll be able to build and evaluate your own machine learning models.',
    shortDescription: 'Learn the basics of Machine Learning with Python',
    thumbnail: 'https://images.unsplash.com/photo-1527474305487-b87b222841cc',
    coverImage: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4',
    instructor: {
      name: 'Michael Chen',
      bio: 'Data Scientist and ML Engineer',
      avatar: 'https://randomuser.me/api/portraits/men/3.jpg'
    },
    category: 'Data Science',
    tags: ['Machine Learning', 'Python', 'Data Science', 'AI'],
    skills: ['Python', 'Scikit-learn', 'Data Analysis', 'Model Evaluation'],
    difficulty: 'intermediate',
    duration: 900, // 15 hours
    subscriptionRequired: 'Platinum',
    isPublished: true,
    steps: [
      {
        title: 'Introduction to Machine Learning',
        description: 'Overview of machine learning concepts and applications',
        type: 'video',
        content: {
          videoUrl: 'https://www.youtube.com/embed/ukzFI9rgwfU',
          duration: 25
        },
        order: 1
      },
      {
        title: 'Python for Machine Learning',
        description: 'Essential Python libraries and tools for ML',
        type: 'video',
        content: {
          videoUrl: 'https://www.youtube.com/embed/7eh4d6sabA0',
          duration: 35
        },
        order: 2
      },
      {
        title: 'Supervised Learning',
        description: 'Learn about classification and regression algorithms',
        type: 'video',
        content: {
          videoUrl: 'https://www.youtube.com/embed/cfj6yaYE86U',
          duration: 45
        },
        order: 3
      },
      {
        title: 'Quiz: ML Basics',
        description: 'Test your understanding of machine learning concepts',
        type: 'quiz',
        content: {
          questions: [
            {
              question: 'Which of the following is a supervised learning algorithm?',
              options: ['K-means', 'Linear Regression', 'Principal Component Analysis', 'Apriori'],
              correctAnswer: 'Linear Regression',
              explanation: 'Linear regression is a supervised learning algorithm used for predicting continuous values.'
            },
            {
              question: 'What is the main difference between supervised and unsupervised learning?',
              options: [
                'Supervised learning is faster than unsupervised learning',
                'Supervised learning requires labeled data, while unsupervised learning doesn\'t',
                'Supervised learning only works with images',
                'Unsupervised learning always provides better results'
              ],
              correctAnswer: 'Supervised learning requires labeled data, while unsupervised learning doesn\'t',
              explanation: 'Supervised learning algorithms learn from labeled training data, while unsupervised learning algorithms discover patterns from unlabeled data.'
            }
          ],
          passingScore: 70
        },
        order: 4
      },
      {
        title: 'Unsupervised Learning',
        description: 'Clustering and dimensionality reduction techniques',
        type: 'video',
        content: {
          videoUrl: 'https://www.youtube.com/embed/V3Z-XMfVRLI',
          duration: 40
        },
        order: 5
      },
      {
        title: 'Model Evaluation',
        description: 'Methods to evaluate and improve machine learning models',
        type: 'video',
        content: {
          videoUrl: 'https://www.youtube.com/embed/RmajweUFKvM',
          duration: 30
        },
        order: 6
      },
      {
        title: 'Final Assessment',
        description: 'Comprehensive test on machine learning concepts',
        type: 'test',
        content: {
          questions: [
            {
              question: 'Which metric is most appropriate for evaluating a classification model with imbalanced classes?',
              options: ['Accuracy', 'F1 Score', 'Mean Squared Error', 'R-squared'],
              correctAnswer: 'F1 Score',
              explanation: 'F1 Score is a good metric for imbalanced datasets as it combines precision and recall.'
            },
            {
              question: 'Which algorithm is best suited for dimensionality reduction?',
              options: ['Random Forest', 'Principal Component Analysis (PCA)', 'Logistic Regression', 'Gradient Boosting'],
              correctAnswer: 'Principal Component Analysis (PCA)',
              explanation: 'PCA is a technique used to reduce the dimensionality of large data sets, by transforming a large set of variables into a smaller one.'
            },
            {
              question: 'What is the purpose of cross-validation in machine learning?',
              options: [
                'To preprocess the data',
                'To validate the model\'s performance on unseen data',
                'To clean the dataset',
                'To increase model complexity'
              ],
              correctAnswer: 'To validate the model\'s performance on unseen data',
              explanation: 'Cross-validation helps assess how the results of a statistical analysis will generalize to an independent data set.'
            },
            {
              question: 'Which Python library is primarily used for machine learning?',
              options: ['Pandas', 'NumPy', 'Scikit-learn', 'Matplotlib'],
              correctAnswer: 'Scikit-learn',
              explanation: 'Scikit-learn is a free software machine learning library for Python that features various classification, regression and clustering algorithms.'
            }
          ],
          passingScore: 75
        },
        order: 7
      }
    ]
  },
  {
    title: 'UI/UX Design Principles',
    description: 'Learn the fundamental principles of user interface and user experience design. This course covers design thinking, wireframing, prototyping, and user testing. Create beautiful, user-friendly designs that solve real problems for users.',
    shortDescription: 'Master UI/UX design principles and tools',
    thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5',
    coverImage: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e',
    instructor: {
      name: 'Emily Davis',
      bio: 'Senior UI/UX Designer at Design Agency',
      avatar: 'https://randomuser.me/api/portraits/women/4.jpg'
    },
    category: 'Design',
    tags: ['UI', 'UX', 'Design', 'Wireframing'],
    skills: ['User Research', 'Wireframing', 'Prototyping', 'Usability Testing'],
    difficulty: 'beginner',
    duration: 600, // 10 hours
    subscriptionRequired: 'Free',
    isPublished: true,
    steps: [
      {
        title: 'Introduction to UI/UX Design',
        description: 'Understanding the difference between UI and UX',
        type: 'video',
        content: {
          videoUrl: 'https://www.youtube.com/embed/5CxXhyhT6Fc',
          duration: 20
        },
        order: 1
      },
      {
        title: 'Design Thinking Process',
        description: 'Learn the design thinking methodology',
        type: 'video',
        content: {
          videoUrl: 'https://www.youtube.com/embed/6lmvCqvmjfE',
          duration: 25
        },
        order: 2
      },
      {
        title: 'Quiz: Design Fundamentals',
        description: 'Test your knowledge of design principles',
        type: 'quiz',
        content: {
          questions: [
            {
              question: 'What is the difference between UI and UX?',
              options: [
                'UI is about how it looks, UX is about how it works',
                'UI is for web, UX is for mobile',
                'UI is cheaper to implement than UX',
                'There is no difference'
              ],
              correctAnswer: 'UI is about how it looks, UX is about how it works',
              explanation: 'UI (User Interface) focuses on the visual elements, while UX (User Experience) concerns the overall experience and how users interact with the product.'
            },
            {
              question: 'Which of these is NOT a stage in the Design Thinking process?',
              options: ['Empathize', 'Define', 'Develop', 'Test'],
              correctAnswer: 'Develop',
              explanation: 'The five stages of Design Thinking are: Empathize, Define, Ideate, Prototype, and Test.'
            }
          ],
          passingScore: 70
        },
        order: 3
      },
      {
        title: 'Wireframing and Prototyping',
        description: 'Tools and techniques for wireframing and prototyping',
        type: 'video',
        content: {
          videoUrl: 'https://www.youtube.com/embed/qpH7-KFWZRI',
          duration: 35
        },
        order: 4
      },
      {
        title: 'User Testing and Iteration',
        description: 'How to test your designs with users and iterate based on feedback',
        type: 'video',
        content: {
          videoUrl: 'https://www.youtube.com/embed/0YL0xoSmyZI',
          duration: 30
        },
        order: 5
      },
      {
        title: 'Final Design Project',
        description: 'Apply all the concepts to create a complete design',
        type: 'test',
        content: {
          questions: [
            {
              question: 'Which layout principle states that related items should be grouped together?',
              options: ['Proximity', 'Alignment', 'Repetition', 'Contrast'],
              correctAnswer: 'Proximity',
              explanation: 'The principle of proximity states that related items should be grouped together to create a relationship between them.'
            },
            {
              question: 'What is the purpose of a user persona?',
              options: [
                'To create fictional characters for marketing',
                'To represent the goals and behavior patterns of your users',
                'To document the technical requirements',
                'To establish the company brand identity'
              ],
              correctAnswer: 'To represent the goals and behavior patterns of your users',
              explanation: 'User personas are fictional characters created to represent different user types that might use your service, product, or site in a similar way.'
            },
            {
              question: 'What does the term "affordance" refer to in UI/UX design?',
              options: [
                'The cost of implementing a design',
                'The visual appearance of elements',
                'The properties that show users how to use something',
                'The performance speed of the interface'
              ],
              correctAnswer: 'The properties that show users how to use something',
              explanation: 'Affordance refers to the properties of an object that show users the actions they can take. For example, buttons are designed to look "pushable".'
            }
          ],
          passingScore: 70
        },
        order: 6
      }
    ]
  }
];

// Function to seed courses to database
async function seedCourses() {
  try {
    // Delete existing courses (optional)
    await Course.deleteMany({});
    console.log('Deleted existing courses');
    
    // Insert new courses
    const insertedCourses = await Course.insertMany(coursesData);
    console.log(`Successfully inserted ${insertedCourses.length} courses`);
    
    // Print the IDs of the inserted courses
    insertedCourses.forEach((course, index) => {
      console.log(`${index + 1}. ${course.title} - ID: ${course._id}`);
    });
    
    mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error seeding courses:', error);
    mongoose.connection.close();
  }
}
