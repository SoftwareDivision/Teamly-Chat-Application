const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Teamly API Documentation',
      version: '1.0.0',
      description: 'WhatsApp-style chat application with media upload support',
      contact: {
        name: 'Teamly Team',
        email: 'heymanish30@gmail.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
      {
        url: 'http://192.168.10.112:5000',
        description: 'Local network server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              example: 'Error message',
            },
          },
        },
        Document: {
          type: 'object',
          properties: {
            documentId: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            fileName: {
              type: 'string',
              example: 'image.jpg',
            },
            fileType: {
              type: 'string',
              enum: ['image', 'video', 'audio', 'document'],
              example: 'image',
            },
            fileSize: {
              type: 'integer',
              example: 458209,
              description: 'File size in bytes',
            },
            url: {
              type: 'string',
              format: 'uri',
              example: 'https://storage.googleapis.com/teamly-503a7.appspot.com/images/1/1732276800000_photo.jpg',
            },
            thumbnailUrl: {
              type: 'string',
              format: 'uri',
              nullable: true,
            },
            uploadDate: {
              type: 'string',
              format: 'date-time',
              example: '2025-11-22T10:30:00Z',
            },
          },
        },
        Message: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: '123',
            },
            text: {
              type: 'string',
              example: 'Hello, world!',
            },
            type: {
              type: 'string',
              enum: ['text', 'image', 'video', 'audio', 'document'],
              example: 'text',
            },
            fileUrl: {
              type: 'string',
              format: 'uri',
              nullable: true,
            },
            fileName: {
              type: 'string',
              nullable: true,
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
            },
            isSent: {
              type: 'boolean',
            },
            status: {
              type: 'string',
              enum: ['pending', 'sent', 'delivered', 'read'],
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
