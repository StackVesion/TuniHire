const JobPost = require('../models/JobPost');
const mongoose = require('mongoose');

// Get all job posts
exports.getAllJobPosts = async (req, res) => {
  try {
    console.log("Starting getAllJobPosts");
    
    let jobPosts = await JobPost.find().lean();
    console.log(`Found ${jobPosts?.length || 0} jobs initially`);

    // Si aucun emploi trouvé, ajoutez des exemples
    if (!jobPosts || jobPosts.length === 0) {
      console.log("No jobs found, adding sample data");
      
      const sampleJobs = [
        {
          title: "Développeur Full Stack",
          description: "Nous recherchons un développeur Full Stack expérimenté pour rejoindre notre équipe en pleine croissance. Vous travaillerez sur des projets passionnants en utilisant les dernières technologies.",
          requirements: ["React", "Node.js", "MongoDB", "3+ ans d'expérience"],
          salaryRange: "45-65K",
          location: "Paris, France",
          workplaceType: "Hybrid"
        },
        {
          title: "UX Designer",
          description: "Rejoignez notre équipe de design en tant que UX Designer pour créer des interfaces intuitives pour nos produits. Vous travaillerez en étroite collaboration avec nos équipes de développement et de produit.",
          requirements: ["Figma", "Adobe XD", "Recherche utilisateur", "Prototypage"],
          salaryRange: "40-55K",
          location: "Lyon, France",
          workplaceType: "Remote"
        },
        {
          title: "Ingénieur DevOps",
          description: "Nous cherchons un ingénieur DevOps pour améliorer notre infrastructure et nos processus de déploiement. Vous serez responsable de la mise en place et de la maintenance de notre pipeline CI/CD.",
          requirements: ["Docker", "Kubernetes", "AWS", "Jenkins"],
          salaryRange: "50-70K",
          location: "Marseille, France",
          workplaceType: "Office"
        }
      ];

      // Insérer les exemples
      jobPosts = await JobPost.insertMany(sampleJobs);
      console.log(`Added ${jobPosts.length} sample jobs`);
    }

    // Renvoyer les emplois
    console.log(`Returning ${jobPosts.length} jobs`);
    return res.status(200).json(jobPosts);
  } catch (error) {
    console.error("Error in getAllJobPosts:", error);
    return res.status(500).json({ error: error.message });
  }
};
// Get job post by ID
exports.getJobPostById = async (req, res) => {
  try {
    console.log(`Getting job with ID: ${req.params.id}`);
    
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid job ID format' });
    }
    
    const jobPost = await JobPost.findById(req.params.id);
    
    if (!jobPost) {
      return res.status(404).json({ message: 'Job post not found' });
    }
    
    console.log(`Found job: ${jobPost.title}`);
    res.status(200).json(jobPost);
  } catch (error) {
    console.error(`Error getting job by ID: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

// Create new job post
exports.createJobPost = async (req, res) => {
  try {
    console.log("Creating new job post with data:", req.body);
    const newJobPost = new JobPost(req.body);
    const savedJobPost = await newJobPost.save();
    console.log(`Created new job post: ${savedJobPost.title} with ID: ${savedJobPost._id}`);
    res.status(201).json(savedJobPost);
  } catch (error) {
    console.error(`Error creating job post: ${error.message}`);
    res.status(400).json({ error: error.message });
  }
};

// Update job post
exports.updateJobPost = async (req, res) => {
  try {
    console.log(`Updating job post with ID: ${req.params.id}`);
    
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid job ID format' });
    }
    
    const updatedJobPost = await JobPost.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!updatedJobPost) {
      return res.status(404).json({ message: 'Job post not found' });
    }
    
    console.log(`Updated job post: ${updatedJobPost.title}`);
    res.status(200).json(updatedJobPost);
  } catch (error) {
    console.error(`Error updating job post: ${error.message}`);
    res.status(400).json({ error: error.message });
  }
};

// Delete job post
exports.deleteJobPost = async (req, res) => {
  try {
    console.log(`Deleting job post with ID: ${req.params.id}`);
    
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid job ID format' });
    }
    
    const deletedJobPost = await JobPost.findByIdAndDelete(req.params.id);
    
    if (!deletedJobPost) {
      return res.status(404).json({ message: 'Job post not found' });
    }
    
    console.log(`Deleted job post: ${deletedJobPost.title}`);
    res.status(200).json({ message: 'Job post deleted successfully' });
  } catch (error) {
    console.error(`Error deleting job post: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

// Get job posts by company
exports.getJobPostsByCompany = async (req, res) => {
  try {
    console.log(`Getting jobs for company ID: ${req.params.companyId}`);
    
    if (!mongoose.Types.ObjectId.isValid(req.params.companyId)) {
      return res.status(400).json({ message: 'Invalid company ID format' });
    }
    
    const jobPosts = await JobPost.find({ 
      companyId: req.params.companyId,
      status: 'active'
    }).sort({ createdAt: -1 });
    
    console.log(`Found ${jobPosts.length} jobs for company`);
    res.status(200).json(jobPosts);
  } catch (error) {
    console.error(`Error getting jobs by company: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};