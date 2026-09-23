const swaggerJsdoc = require("swagger-jsdoc");

const swaggerUi = require("swagger-ui-express");

const options = {
  definition: {
    openapi: "3.0.0",

    info: {
      title: "DevShowcase API",
      version: "1.0.0",
      description: "API para portfólio de projetos com feedbacks e upvotes."
    },

    servers: [
      {
        url: "/",
        description: "Servidor local"
      }
    ]
  },

  apis: ["./routes/*.js"]
};


const specs = swaggerJsdoc(options);


function setupSwagger(app) {

  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(specs, {
      customCss: ".swagger-ui .topbar { display: none }"
    })
  );

}


module.exports = setupSwagger;