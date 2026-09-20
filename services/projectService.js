const { Project, Feedback } = require("../models");

async function createFeedback(projectId, feedbackData) {
  const project = await Project.findByPk(projectId);

  if (!project) {
    const error = new Error("Projeto não encontrado.");
    error.statusCode = 404;
    throw error;
  }

  const feedback = await Feedback.create({
    authorName: feedbackData.authorName.trim(),
    rating: feedbackData.rating,
    message: feedbackData.message.trim(),
    projectId: project.id
  });

  const feedbacks = await Feedback.findAll({
    where: {
      projectId: project.id
    },
    attributes: ["rating"]
  });

  const totalRatings = feedbacks.reduce((total, feedbackItem) => {
    return total + feedbackItem.rating;
  }, 0);

  const averageRating = Number(
    (totalRatings / feedbacks.length).toFixed(2)
  );

  await project.update({
    averageRating
  });

  return {
    feedback,
    averageRating
  };
}

async function upvoteProject(projectId) {
  const project = await Project.findByPk(projectId);

  if (!project) {
    const error = new Error("Projeto não encontrado.");
    error.statusCode = 404;
    throw error;
  }

  await project.increment("upvotes");

  await project.reload();

  return project;
}

module.exports = {
  createFeedback,
  upvoteProject
};