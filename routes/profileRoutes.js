 const express = require("express");
const { validationResult, body } = require("express-validator");

const { Profile, Project, Technology } = require("../models");

const router = express.Router();

const validateProfile = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("O nome é obrigatório."),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("O e-mail é obrigatório.")
    .isEmail()
    .withMessage("Informe um e-mail válido."),

  body("bio")
    .trim()
    .notEmpty()
    .withMessage("A bio é obrigatória."),

  body("githubUrl")
    .trim()
    .notEmpty()
    .withMessage("A URL do GitHub é obrigatória.")
    .isURL({ require_protocol: true })
    .withMessage("Informe uma URL válida.")
];

router.post("/", validateProfile, async (req, res) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: "Dados inválidos.",
        errors: errors.array()
      });
    }

    const { name, email, bio, githubUrl } = req.body;

    const existingProfile = await Profile.findOne({
      where: { email }
    });

    if (existingProfile) {
      return res.status(409).json({
        message: "Já existe um perfil cadastrado com este e-mail."
      });
    }

    const profile = await Profile.create({
      name,
      email,
      bio,
      githubUrl
    });

    return res.status(201).json({
      id: profile.id,
      name: profile.name,
      email: profile.email,
      bio: profile.bio,
      githubUrl: profile.githubUrl
    });
  } catch (error) {
    return res.status(500).json({
      message: "Erro interno ao cadastrar o perfil.",
      error: error.message
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({
        message: "O id deve ser um número inteiro positivo."
      });
    }

    const profile = await Profile.findByPk(id, {
      attributes: {
        exclude: ["createdAt", "updatedAt"]
      },
      include: [
        {
          model: Project,
          as: "projects",
          attributes: {
            exclude: ["createdAt", "updatedAt", "profileId"]
          },
          include: [
            {
              model: Technology,
              as: "technologies",
              attributes: ["id", "name"],
              through: {
                attributes: []
              }
            }
          ]
        }
      ]
    });

    if (!profile) {
      return res.status(404).json({
        message: "Perfil não encontrado."
      });
    }

    return res.status(200).json(profile);
  } catch (error) {
    return res.status(500).json({
      message: "Erro interno ao buscar o perfil.",
      error: error.message
    });
  }
});

module.exports = router;