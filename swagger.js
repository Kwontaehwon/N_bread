const swaggerUi = require('swagger-ui-express');
const swaggereJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
      openapi: "3.0.0",
      info: {
        title: "N빵 API",
        version: "0.1.0",
        description:
          "This is a simple CRUD API application made with Express and documented with Swagger",
      },
      servers: [
        {
          url: "http://localhost:5005/",
        },
      ],
    },
    apis: ["./test1.yml", "./scheme.yml"]
  };
  

const specs = swaggereJsdoc(options);

module.exports = {
    swaggerUi,
    specs
};