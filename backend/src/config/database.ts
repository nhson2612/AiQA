import { DataSource, DataSourceOptions } from 'typeorm'
import { User, Pdf, Conversation, Message, Score } from '../entities'
import 'dotenv/config'

const dbConfig: DataSourceOptions = process.env.DATABASE_URL
  ? {
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
  : {
    type: 'sqlite',
    database: 'database.sqlite',
    synchronize: true,
    logging: false,
    entities: [User, Pdf, Conversation, Message, Score],
    migrations: [],
    subscribers: [],
  }

export const AppDataSource = new DataSource(dbConfig)
