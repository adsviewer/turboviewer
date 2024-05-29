import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { prisma, type Prisma } from '@repo/database';
import { type SignUpInput } from '../schema/user/user-types';
import { type LoginProviderUserData } from './login-provider/login-provider-types';

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
  data: SignUpInput,
  query?: { include?: Prisma.UserInclude | undefined; select?: Prisma.UserSelect | undefined },
) => {
  const truthyQuery = query ?? {};
  const hashedPassword = await createPassword(data.password);

  // Create user with specified organization or default to creating a new organization
  return await prisma.user.create({
    ...truthyQuery,
    include: { roles: { select: { role: true } } },
    data: {
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      password: hashedPassword,
      organization: {
        create: {
          name: `${data.firstName} ${data.lastName}`,
        },
      },
    },
  });
};

export const createLoginProviderUser = async (data: LoginProviderUserData) => {
  return await prisma.user.create({
    include: { roles: { select: { role: true } } },
    data: {
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      photoUrl: data.photoUrl,
      loginProviders: {
        create: {
          externalId: data.providerId,
          provider: data.providerType,
        },
      },
      organization: {
        create: {
          name: `${data.firstName} ${data.lastName}`,
        },
      },
    },
  });
};
