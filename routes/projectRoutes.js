const express = require("express");
const { body, param, validationResult } = require("express-validator");

const { Project, Profile, Technology } = require("../models");
const projectService = require("../services/projectService");

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

router.post("/", validateProject, async (req, res, next) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const error = new Error("Dados inválidos.");
      error.statusCode = 400;
      error.details = errors.array();
      throw error;
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
      const error = new Error("Perfil não encontrado.");
      error.statusCode = 404;
      throw error;
    }

    const technologies = await Technology.findAll({
      where: {
        id: technologyIds
      }
    });

    if (technologies.length !== technologyIds.length) {
      const error = new Error("Uma ou mais tecnologias não foram encontradas.");
      error.statusCode = 404;
      throw error;
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
    next(error);
  }
});


/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: Lista projetos com paginação e filtro por tecnologia
 *     tags: [Projects]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Quantidade de itens por página
 *       - in: query
 *         name: technologyId
 *         schema:
 *           type: integer
 *         description: Filtrar projetos por ID da tecnologia
 *     responses:
 *       200:
 *         description: Lista de projetos com paginação
 *       400:
 *         description: Parâmetros inválidos
 */
// LISTAR PROJETOS COM PAGINAÇÃO E FILTRO POR TECNOLOGIA
router.get("/", async (req, res, next) => {
  try {
    const { page = 1, limit = 10, technologyId } = req.query;

    const pageNum = Number(page);
    const limitNum = Number(limit);

    if (pageNum < 1 || limitNum < 1) {
      const error = new Error("Parâmetros de paginação inválidos.");
      error.statusCode = 400;
      throw error;
    }

    const offset = (pageNum - 1) * limitNum;

    const include = [
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
    ];

    if (technologyId) {
      const techIdNum = Number(technologyId);
      if (Number.isNaN(techIdNum) || techIdNum < 1) {
        const error = new Error("technologyId inválido.");
        error.statusCode = 400;
        throw error;
      }
      include[1].where = { id: techIdNum };
    }

    const { count, rows } = await Project.findAndCountAll({
      include,
      order: [["id", "ASC"]],
      limit: limitNum,
      offset
    });

    return res.status(200).json({
      data: rows,
      pagination: {
        total: count,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(count / limitNum)
      }
    });
  } catch (error) {
    next(error);
  }
});
/**
 * @swagger
 * /api/projects/{id}/feedbacks:
 *   post:
 *     summary: Cadastra um feedback (nota + comentário) em um projeto
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do projeto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - authorName
 *               - rating
 *               - message
 *             properties:
 *               authorName:
 *                 type: string
 *                 example: "Maria Silva"
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 5
 *               message:
 *                 type: string
 *                 example: "Projeto muito bem organizado."
 *     responses:
 *       201:
 *         description: Feedback cadastrado com sucesso
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Projeto não encontrado
 */
// CADASTRAR FEEDBACK
router.post(
  "/:id/feedbacks",
  [
    param("id")
      .isInt({ min: 1 })
      .withMessage("O ID do projeto deve ser um número válido."),

    body("authorName")
      .trim()
      .notEmpty()
      .withMessage("O nome do autor é obrigatório."),

    body("rating")
      .isInt({ min: 1, max: 5 })
      .withMessage("A nota deve ser um número inteiro entre 1 e 5."),

    body("message")
      .trim()
      .notEmpty()
      .withMessage("O comentário é obrigatório.")
      .isLength({ min: 3 })
      .withMessage("O comentário deve ter pelo menos 3 caracteres.")
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        const error = new Error("Dados inválidos.");
        error.statusCode = 400;
        error.details = errors.array();
        throw error;
      }

      const result = await projectService.createFeedback(
        Number(req.params.id),
        req.body
      );

      return res.status(201).json({
        message: "Feedback cadastrado com sucesso.",
        feedback: result.feedback,
        averageRating: result.averageRating
      });
    } catch (error) {
      next(error);
    }
  }
);
/**
 * @swagger
 * /api/projects/{id}/upvote:
 *   put:
 *     summary: Incrementa o número de upvotes de um projeto
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do projeto
 *     responses:
 *       200:
 *         description: Upvote registrado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 title:
 *                   type: string
 *                 upvotes:
 *                   type: integer
 *       400:
 *         description: ID inválido
 *       404:
 *         description: Projeto não encontrado
 */
// UPVOTE
router.put(
  "/:id/upvote",
  [
    param("id")
      .isInt({ min: 1 })
      .withMessage("O ID do projeto deve ser um número válido.")
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        const error = new Error("Dados inválidos.");
        error.statusCode = 400;
        error.details = errors.array();
        throw error;
      }

      const project = await projectService.upvoteProject(
        Number(req.params.id)
      );

      return res.status(200).json({
        id: project.id,
        title: project.title,
        upvotes: project.upvotes
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;