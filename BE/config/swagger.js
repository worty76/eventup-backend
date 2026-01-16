const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Job & Event Platform API',
      version: '1.0.0',
      description: 'API Documentation cho nền tảng tìm việc và đăng tin tuyển dụng sự kiện',
      contact: {
        name: 'API Support',
        email: 'support@jobevent.com'
      },
      license: {
        name: 'ISC',
        url: 'https://opensource.org/licenses/ISC'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server'
      },
      {
        url: 'https://api.jobevent.com',
        description: 'Production server'
      }
    ],
    tags: [
      {
        name: 'Health',
        description: 'Health check endpoints'
      },
      {
        name: 'Auth',
        description: 'Authentication & Authorization'
      },
      {
        name: 'Users',
        description: 'User & Profile management'
      },
      {
        name: 'Events',
        description: 'Event/Job management'
      },
      {
        name: 'Applications',
        description: 'Job application management'
      },
      {
        name: 'Reviews',
        description: 'Review & Rating system'
      },
      {
        name: 'Notifications',
        description: 'Notification management'
      },
      {
        name: 'Subscriptions',
        description: 'Subscription plans'
      },
      {
        name: 'Payments',
        description: 'Payment processing'
      },
      {
        name: 'Files',
        description: 'File upload & management'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'Error message'
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string'
                  },
                  message: {
                    type: 'string'
                  }
                }
              }
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            _id: {
              type: 'string'
            },
            email: {
              type: 'string',
              format: 'email'
            },
            role: {
              type: 'string',
              enum: ['CTV', 'BTC', 'ADMIN']
            },
            phone: {
              type: 'string'
            },
            status: {
              type: 'string',
              enum: ['ACTIVE', 'BLOCKED', 'PENDING']
            },
            subscription: {
              type: 'object',
              properties: {
                plan: {
                  type: 'string',
                  enum: ['FREE', 'PREMIUM']
                },
                expiredAt: {
                  type: 'string',
                  format: 'date-time'
                }
              }
            }
          }
        },
        Event: {
          type: 'object',
          properties: {
            _id: {
              type: 'string'
            },
            title: {
              type: 'string'
            },
            description: {
              type: 'string'
            },
            location: {
              type: 'string'
            },
            eventType: {
              type: 'string',
              enum: ['Concert', 'Workshop', 'Festival', 'Conference', 'Sports', 'Exhibition', 'Other']
            },
            salary: {
              type: 'string'
            },
            startTime: {
              type: 'string',
              format: 'date-time'
            },
            endTime: {
              type: 'string',
              format: 'date-time'
            },
            deadline: {
              type: 'string',
              format: 'date-time'
            },
            quantity: {
              type: 'number'
            },
            urgent: {
              type: 'boolean'
            },
            status: {
              type: 'string',
              enum: ['PREPARING', 'RECRUITING', 'COMPLETED', 'CANCELLED']
            }
          }
        }
      }
    }
  },
  apis: ['./routes/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
