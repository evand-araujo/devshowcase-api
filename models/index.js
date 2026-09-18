 const { DataTypes } = require("sequelize");
const sequelize = require("../database/connection");

const Profile = sequelize.define("Profile", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  githubUrl: {
    type: DataTypes.STRING,
    allowNull: false
  },
  linkedinUrl: {
    type: DataTypes.STRING,
    allowNull: true
  }
});

const Technology = sequelize.define("Technology", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  }
});

const Project = sequelize.define("Project", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  repositoryUrl: {
    type: DataTypes.STRING,
    allowNull: false
  },
  projectUrl: {
    type: DataTypes.STRING,
    allowNull: true
  }
});

const Feedback = sequelize.define("Feedback", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  authorName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
});

Profile.hasMany(Project, {
  foreignKey: "profileId",
  as: "projects",
  onDelete: "CASCADE"
});

Project.belongsTo(Profile, {
  foreignKey: "profileId",
  as: "profile"
});

Project.belongsToMany(Technology, {
  through: "project_technologies",
  as: "technologies"
});

Technology.belongsToMany(Project, {
  through: "project_technologies",
  as: "projects"
});

Project.hasMany(Feedback, {
  foreignKey: "projectId",
  as: "feedbacks",
  onDelete: "CASCADE"
});

Feedback.belongsTo(Project, {
  foreignKey: "projectId",
  as: "project"
});

module.exports = {
  sequelize,
  Profile,
  Project,
  Technology,
  Feedback
};