import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm'
import { User } from './User'
import { Conversation } from './Conversation'

@Entity('pdfs')
export class Pdf {
  @PrimaryColumn()
  id: string

  @Column()
  name: string

  @Column()
  userId: string

  @ManyToOne(() => User, (user) => user.pdfs)
  @JoinColumn({ name: 'userId' })
  user: User

  @OneToMany(() => Conversation, (conversation) => conversation.pdf)
  conversations: Conversation[]

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @Column({ type: 'simple-json', nullable: true })
  mindMapSummary: any

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      userId: this.userId,
      mindMapSummary: this.mindMapSummary,
    }
  }
}
