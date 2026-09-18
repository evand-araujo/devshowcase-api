const express = require("express");
const { body, validationResult } = require("express-validator");

const { Technology } = require("../models");

const router = express.Router();

const validateTechnology = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("O nome da tecnologia é obrigatório.")
    .isLength({ min: 2 })
    .withMessage("O nome deve ter pelo menos 2 caracteres.")
];

router.post("/", validateTechnology, async (req, res) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: "Dados inválidos.",
        errors: errors.array()
      });
    }

    const name = req.body.name.trim();

    const technologyAlreadyExists = await Technology.findOne({
      where: { name }
    });

    if (technologyAlreadyExists) {
      return res.status(409).json({
        message: "Esta tecnologia já está cadastrada."
      });
    }

    const technology = await Technology.create({ name });

    return res.status(201).json({
      id: technology.id,
      name: technology.name
    });
  } catch (error) {
    return res.status(500).json({
      message: "Erro interno ao cadastrar a tecnologia.",
      error: error.message
    });
  }
});

router.get("/", async (req, res) => {
  try {
    const technologies = await Technology.findAll({
      attributes: {
        exclude: ["createdAt", "updatedAt"]
      },
      order: [["name", "ASC"]]
    });

    return res.status(200).json(technologies);
  } catch (error) {
    return res.status(500).json({
      message: "Erro interno ao listar as tecnologias.",
      error: error.message
    });
  }
});

module.exports = router;