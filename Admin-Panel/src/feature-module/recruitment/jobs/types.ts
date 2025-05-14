export interface Application {
  _id: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePicture: string;
  };
  jobId: {
    _id: string;
    title: string;
    companyId: {
      _id: string;
      name: string;
      logo: string;
    };
    location: string;
    salaryRange: string;
  };
  status: 'Pending' | 'Accepted' | 'Rejected';
  createdAt: string;
  coverLetter: string;
  resume?: {
    url: string;
    originalName: string;
  };
}
