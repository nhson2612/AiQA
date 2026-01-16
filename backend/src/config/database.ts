import { DataSource, DataSourceOptions } from 'typeorm'
import { User, Pdf, Conversation, Message, Score } from '../entities'
import 'dotenv/config'

const getDbConfig = (): DataSourceOptions => {
  if (process.env.DATABASE_URL) {
    return {
      type: 'postgres',
      url: process.env.DATABASE_URL,
      synchronize: true,
      logging: false,
      entities: [User, Pdf, Conversation, Message, Score],
      migrations: [],
      subscribers: [],
      ssl: {
        rejectUnauthorized: false,
      },
    }
  }

  if (process.env.DB_HOST) {
    return {
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      synchronize: true,
      logging: false,
      entities: [User, Pdf, Conversation, Message, Score],
      migrations: [],
      subscribers: [],
      // For Cloud Run (Unix socket) set ssl to false, otherwise (TCP) might need ssl
      ssl: process.env.DB_HOST.startsWith('/') ? false : { rejectUnauthorized: false }, 
    }
  }

  return {
    type: 'sqlite',
    database: 'database.sqlite',
    synchronize: true,
    logging: false,
    entities: [User, Pdf, Conversation, Message, Score],
    migrations: [],
    subscribers: [],
  }
}

export const AppDataSource = new DataSource(getDbConfig())
