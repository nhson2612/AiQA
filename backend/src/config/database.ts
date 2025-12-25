import { DataSource } from 'typeorm'
import { User, Pdf, Conversation, Message, Score } from '../entities'

const dbConfig = {
  type: 'sqlite' as const,
  database: 'database.sqlite',
  synchronize: true, // Always true for local SQLite dev simplicity
  logging: false,
  entities: [User, Pdf, Conversation, Message, Score],
  migrations: [],
  subscribers: [],
}

export const AppDataSource = new DataSource(dbConfig)
