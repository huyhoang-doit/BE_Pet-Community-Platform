const swaggerAutogen = require('swagger-autogen')()

const doc = {
  info: {
    title: 'Pet Love Community API',
    description: 'API documentation for Pet Love Community Platform'
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    }
  },
  security: [
    {
      bearerAuth: []
    }
  ]
}

const outputFile = './src/swagger-output.json'
const endpointsFiles = [
  './routes/admin.route.js',
  './routes/adoptionForm.route.js',
  './routes/adoptionPost.route.js',
  './routes/auth.route.js',
  './routes/blog.route.js',
  './routes/breed.route.js',
  './routes/campaign.route.js',
  './routes/chatbot.route.js',
  './routes/clientSetting.route.js',
  './routes/donation.route.js',
  './routes/expense.route.js',
  './routes/expenseType.route.js',
  './routes/message.route.js',
  './routes/notification.route.js',
  './routes/payment.route.js',
  './routes/pet.route.js',
  './routes/post.route.js',
  './routes/user.route.js'
]

swaggerAutogen(outputFile, endpointsFiles, doc).then(() => {
  require('./routes/admin.route.js')
  require('./routes/adoptionForm.route.js')
  require('./routes/adoptionPost.route.js')
  require('./routes/auth.route.js')
  require('./routes/blog.route.js')
  require('./routes/breed.route.js')
  require('./routes/campaign.route.js')
  require('./routes/chatbot.route.js')
  require('./routes/clientSetting.route.js')
  require('./routes/donation.route.js')
  require('./routes/expense.route.js')
  require('./routes/expenseType.route.js')
  require('./routes/message.route.js')
  require('./routes/notification.route.js')
  require('./routes/payment.route.js')
  require('./routes/pet.route.js')
  require('./routes/post.route.js')
  require('./routes/user.route.js')
})
