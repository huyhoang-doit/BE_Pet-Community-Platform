require('dotenv').config()

const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const connectDB = require('./utils/db.js')
const appRouter = require('./routes')
const { errorHandler } = require('./middlewares/error.middlewares.js')
const { app, server } = require('./socket/socket.js')
const path = require('path')
const PORT = process.env.PORT || 3000
const { swaggerUi, swaggerSetup } = require('./configs/swagger')
const { default: corsOptions } = require('./configs/cors.config.js')

//middlewares
app.use(express.json())
app.use(cookieParser())
app.use(express.urlencoded({ extended: true }))

// Lấy giá trị của NODE_ENV từ biến môi trường
const nodeEnv = process.env.NODE_ENV || 'development';


app.use(cors(corsOptions))
app.options('*', cors(corsOptions))

// Route để kiểm tra
app.get('/api/v1/test', (req, res) => {
  res.json({ message: 'CORS is working!', environment: nodeEnv });
});


app.use('/api/v1', appRouter)

app.use('/api-docs', swaggerUi.serve)
app.get('/api-docs', (req, res) => {
  res.send(swaggerSetup(req, res))
})

app.use(errorHandler)

app.use(express.static(path.join(__dirname, '/frontend/dist')))
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'frontend', 'dist', 'index.html'))
})

server.listen(PORT, () => {
  connectDB()
  console.log(`Server listen at port ${PORT}`)
})
