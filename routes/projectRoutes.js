const express = require("express");
const { body, validationResult } = require("express-validator");

const { Project, Profile, Technology } = require("../models");

const router = express.Router();

const validateProject = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("O título do projeto é obrigatório.")
    .isLength({ min: 3 })
    .withMessage("O título deve ter pelo menos 3 caracteres."),

  body("description")
    .trim()
    .notEmpty()
    .withMessage("A descrição do projeto é obrigatória.")
    .isLength({ min: 10 })
    .withMessage("A descrição deve ter pelo menos 10 caracteres."),

  body("repositoryUrl")
    .trim()
    .notEmpty()
    .withMessage("A URL do repositório é obrigatória.")
    .isURL()
    .withMessage("A URL do repositório deve ser válida."),

  body("projectUrl")
    .optional({ checkFalsy: true })
    .trim()
    .isURL()
    .withMessage("A URL do projeto deve ser válida."),

  body("profileId")
    .isInt({ min: 1 })
    .withMessage("O ID do perfil deve ser um número válido."),

  body("technologyIds")
    .isArray({ min: 1 })
    .withMessage("Informe pelo menos uma tecnologia."),

  body("technologyIds.*")
    .isInt({ min: 1 })
    .withMessage("Os IDs das tecnologias devem ser números válidos.")
];

router.post("/", validateProject, async (req, res) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: "Dados inválidos.",
        errors: errors.array()
      });
    }

    const {
      title,
      description,
      repositoryUrl,
      projectUrl,
      profileId,
      technologyIds
    } = req.body;

    const profile = await Profile.findByPk(profileId);

    if (!profile) {
      return res.status(404).json({
        message: "Perfil não encontrado."
      });
    }

    const technologies = await Technology.findAll({
      where: {
        id: technologyIds
      }
    });

    if (technologies.length !== technologyIds.length) {
      return res.status(404).json({
        message: "Uma ou mais tecnologias não foram encontradas."
      });
    }

    const project = await Project.create({
      title: title.trim(),
      description: description.trim(),
      repositoryUrl: repositoryUrl.trim(),
      projectUrl: projectUrl?.trim() || null,
      profileId
    });

    await project.setTechnologies(technologyIds);

    const createdProject = await Project.findByPk(project.id, {
      include: [
        {
          model: Profile,
          as: "profile",
          attributes: ["id", "name", "email"]
        },
        {
          model: Technology,
          as: "technologies",
          through: { attributes: [] }
        }
      ]
    });

    return res.status(201).json(createdProject);
  } catch (error) {
    return res.status(500).json({
      message: "Erro interno ao cadastrar o projeto.",
      error: error.message
    });
  }
});

router.get("/", async (req, res) => {
  try {
    const projects = await Project.findAll({
      include: [
        {
          model: Profile,
          as: "profile",
          attributes: ["id", "name", "email"]
        },
        {
          model: Technology,
          as: "technologies",
          through: { attributes: [] }
        }
      ],
      order: [["id", "ASC"]]
    });

    return res.status(200).json(projects);
  } catch (error) {
    return res.status(500).json({
      message: "Erro interno ao listar os projetos.",
      error: error.message
    });
  }
});

module.exports = router;