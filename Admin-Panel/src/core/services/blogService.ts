import api from '../utils/api';

// Interface for blog data
export interface Blog {
  _id: string;
  title: string;
  content: string;
  summary: string;
  category: string;
  tags: string[];
  image: string;
  author: {
    _id: string;
    firstName: string;
    lastName: string;
    profilePicture: string;
  };
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  likes: { _id: string }[];
  comments: any[];
  reviews: any[];
  shares: any[];
  published: boolean;
}

// Interface for blog response
export interface BlogsResponse {
  blogs: Blog[];
  totalPages: number;
  currentPage: number;
  totalBlogs: number;
}

// Fetch all blogs with pagination
export const fetchBlogs = async (page = 1, limit = 10): Promise<BlogsResponse> => {
  try {
    const response = await api.get('/blogs', {
      params: { page, limit }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching blogs:', error);
    throw error;
  }
};

// Fetch a single blog by ID
export const fetchBlogById = async (id: string): Promise<Blog> => {
  try {
    const response = await api.get(`/blogs/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching blog with ID ${id}:`, error);
    throw error;
  }
};

// Create a new blog
export const createBlog = async (blogData: Partial<Blog>): Promise<Blog> => {
  try {
    const response = await api.post('/blogs', blogData);
    return response.data;
  } catch (error) {
    console.error('Error creating blog:', error);
    throw error;
  }
};

// Update an existing blog
export const updateBlog = async (id: string, blogData: Partial<Blog>): Promise<Blog> => {
  try {
    const response = await api.put(`/blogs/${id}`, blogData);
    return response.data;
  } catch (error) {
    console.error(`Error updating blog with ID ${id}:`, error);
    throw error;
  }
};

// Delete a blog
export const deleteBlog = async (id: string): Promise<void> => {
  try {
    await api.delete(`/blogs/${id}`);
  } catch (error) {
    console.error(`Error deleting blog with ID ${id}:`, error);
    throw error;
  }
}; 