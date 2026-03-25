import cors, { CorsOptions } from 'cors';

const allowedOrigins = [
  'http://localhost:3001',
  'http://10.1.73.233:8081',
  'http://localhost:8081',
];

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // permite mobile, postman, etc
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true,
};

export const corsMiddleware = cors(corsOptions);
