const swaggerUi = require('swagger-ui-express');
const swaggereJsdoc = require('swagger-jsdoc');
const swaggerAutogen = require('swagger-autogen');

// const options = {
//     definition: {
//       openapi: "3.0.0",
//       info: {
//         title: "N빵 API",
//         version: "0.2.0",
//         description:
//           "This is a simple CRUD API application made with Express and documented with Swagger",
//       },
//       servers: [
//         {
//           url: "http://localhost:5005/",
//         },
//       ],
//     },
//     apis: ["swagger/test1.yml", "swagger/scheme.yml"]
//   };

const options = {
  info: {
    title: 'N빵 API',
    description: 'SWM-ChocoBread N빵 API 명세서',
  },
  host: 'localhost:5005',
  schemes: ['http'],
  tags: [        // by default: empty Array
  {
    name: 'Users',         // Tag name
    description: 'User에 대한 설명',  // Tag description
  },
  {
    name: 'Deals',         // Tag name
    description: 'Deals에 대한 설명',  // Tag description
  },
  {
    name: 'Comments',         // Tag name
    description: 'Comment에 대한 설명',  // Tag description
  },
  {
    name: 'Auth',         // Tag name
    description: 'Auth에 대한 설명',  // Tag description
  },
  ],
  securityDefinitions: {
    bearerAuth: {
      type: 'http',
      scheme: 'bearer',
      in: 'header',
      bearerFormat: 'JWT',
    },
  },
};

const outputFile = './swagger/swagger-test.json';
const endpointsFiles = ['./app.js'];

swaggerAutogen()(outputFile, endpointsFiles, options);

// const specs = swaggereJsdoc(options);

// module.exports = {
//     swaggerUi,
//     specs
// };