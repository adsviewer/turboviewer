import { scrypt, randomBytes, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { prisma, type Prisma } from '@repo/database';

export interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  photo?: string;
  googleId?: string;
  organizationId?: string;
}

const scryptAsync = promisify(scrypt);

const hashPassword = async (password: string) => {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
};

const comparePassword = async (suppliedPassword: string, storedPassword: string) => {
  // split() returns array
  const [hashedPassword, salt] = storedPassword.split('.');
  // we need to pass buffer values to timingSafeEqual
  const hashedPasswordBuf = Buffer.from(hashedPassword, 'hex');
  // we hash the new sign-in password
  const suppliedPasswordBuf = (await scryptAsync(suppliedPassword, salt, 64)) as Buffer;
  // compare the new supplied password with the stored hashed password
  return timingSafeEqual(hashedPasswordBuf, suppliedPasswordBuf);
};

export const createPassword = async (password: string) => await hashPassword(password);

export const passwordsMatch = async (password: string, hashedPassword: string | null) => {
  if (!hashedPassword) {
    return false;
  }
  return await comparePassword(password, hashedPassword);
};

export const createUser = async (
  data: UserData,
  query?: { include?: Prisma.UserInclude | undefined; select?: Prisma.UserSelect | undefined },
) => {
  const truthyQuery = query ?? {};
  const hashedPassword = data.password ? await createPassword(data.password) : undefined;

  // Create user with specified organization or default to creating a new organization
  const user = await prisma.user.create({
    ...truthyQuery,
    include: { roles: { select: { role: true } } },
    data: {
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      password: hashedPassword,
      photo: data.photo,
      googleId: data.googleId,
      organization: data.organizationId
        ? { connect: { id: data.organizationId } }
        : {
            create: {
              name: `${data.firstName} ${data.lastName}`,
            },
          },
    },
  });
  return user;
};
