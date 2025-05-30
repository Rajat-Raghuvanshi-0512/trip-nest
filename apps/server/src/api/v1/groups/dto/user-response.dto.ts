import { User } from '../../../../models/user/entities/user.entity';

export class UserResponseDto {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  fullName: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(user: User) {
    this.id = user.id;
    this.email = user.email;
    this.username = user.username;
    this.firstName = user.firstName;
    this.lastName = user.lastName;
    this.fullName = user.fullName;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
  }

  static fromUser(user: User): UserResponseDto {
    return new UserResponseDto(user);
  }

  static fromUsers(users: User[]): UserResponseDto[] {
    return users.map((user) => new UserResponseDto(user));
  }
}
