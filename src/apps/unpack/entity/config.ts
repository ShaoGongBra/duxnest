import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class UnpackConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: true })
  status: boolean;
}
