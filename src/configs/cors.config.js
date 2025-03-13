// Lấy giá trị của NODE_ENV từ biến môi trường
const nodeEnv = process.env.NODE_ENV || 'development';
console.log('NODE_ENV:', nodeEnv); // Để kiểm tra giá trị của NODE_ENV

const allowedOrigins = nodeEnv === 'development'
    ? [
        'http://localhost:5173',
        'http://localhost:4173',
        'http://localhost:4175',
    ]
    : ['https://petlove.io.vn',
        'http://localhost:5173',
        'http://localhost:4173',
        'http://localhost:4175',];

// Cấu hình CORS
const corsOptions = {
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true, // Nếu cần gửi cookie hoặc header xác thực
};

export default corsOptions;
