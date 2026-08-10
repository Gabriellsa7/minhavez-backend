import cors, { CorsOptions } from 'cors';

const configuredOrigins = (process.env.CORS_ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const localDevelopmentOrigin =
  /^https?:\/\/(?:localhost|127(?:\.\d{1,3}){3}|10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?::\d{1,5})?$/;

const isAllowedOrigin = (origin: string) => {
  if (configuredOrigins.includes(origin)) return true;

  // Expo/Metro changes the host IP with the active local network. Keep this
  // convenience restricted to local development; production must configure
  // CORS_ALLOWED_ORIGINS explicitly.
  return (
    process.env.NODE_ENV !== 'production' && localDevelopmentOrigin.test(origin)
  );
};

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // permite mobile, postman, etc
    if (!origin) return callback(null, true);

    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true,
};

export const corsMiddleware = cors(corsOptions);
