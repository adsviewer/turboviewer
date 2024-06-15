import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { EmailType, OrganizationRoleEnum, prisma, Prisma, UserOrganizationStatus } from '@repo/database';
import { AError, isAError } from '@repo/utils';
import * as changeCase from 'change-case';
import { logger } from '@repo/logger';
import { createId } from '@paralleldrive/cuid2';
import lodash from 'lodash';
import { validateEmail } from '../schema/user/emailable-helper';
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
  const validData = await validateEmailProcess(data.firstName, data.email);
  if (isAError(validData)) {
    return validData;
  }
  const hashedPassword = await createPassword(data.password);

  // Create user with specified organization or default to creating a new organization
  return await prisma.user.create({
    include: lodash.merge({}, query?.include, userWithRoles.include),
    data: {
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      emailType: validData.emailType,
      password: hashedPassword,
      organizations: {
        create: {
          status: UserOrganizationStatus.ACTIVE,
          role: OrganizationRoleEnum.ORG_ADMIN,
          organizationId: validData.orgId,
        },
      },
      defaultOrganizationId: validData.orgId,
    },
  });
};

export const createLoginProviderUser = async (data: LoginProviderUserData) => {
  const validData = await validateEmailProcess(data.firstName, data.email);
  if (isAError(validData)) {
    return validData;
  }
  return await prisma.user.create({
    ...userWithRoles,
    data: {
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      emailType: validData.emailType,
      photoUrl: data.photoUrl,
      loginProviders: {
        create: {
          externalId: data.providerId,
          provider: data.providerType,
        },
      },
      organizations: {
        create: {
          status: UserOrganizationStatus.ACTIVE,
          role: OrganizationRoleEnum.ORG_ADMIN,
          organizationId: validData.orgId,
        },
      },
      defaultOrganizationId: validData.orgId,
    },
  });
};

const validateEmailProcess = async (
  firstName: string,
  email: string,
): Promise<AError | { orgId: string; emailType: EmailType }> => {
  const nonWorkName = `${firstName}'${firstName.endsWith('s') ? '' : 's'} organization`;
  const orgId = createId();
  const emailValidation = await validateEmail(email).catch((e: unknown) => {
    logger.error(e);
    return new AError(e instanceof Error ? e.message : 'Unknown error during emailValidation');
  });
  if (isAError(emailValidation)) {
    await prisma.organization.create({
      data: { id: orgId, name: nonWorkName },
    });
    return { orgId, emailType: EmailType.PERSONAL };
  }
  if (emailValidation.disposable || emailValidation.state === 'undeliverable' || emailValidation.state === 'unknown') {
    return new AError('Please provide a valid email address.');
  }
  if (!emailValidation.free) {
    const organization = await prisma.organization.findUnique({
      where: { domain: emailValidation.domain },
    });
    if (organization) {
      await prisma.organization.create({
        data: { id: orgId, name: nonWorkName },
      });
    } else {
      const domainName = emailValidation.domain.replace(/\.[^/.]+$/, '');
      await prisma.organization.create({
        data: { id: orgId, name: changeCase.capitalCase(domainName), domain: emailValidation.domain },
      });
    }
    return { orgId, emailType: EmailType.WORK };
  }
  await prisma.organization.create({
    data: { id: orgId, name: nonWorkName },
  });
  return { orgId, emailType: EmailType.PERSONAL };
};

export const userWithRoles = Prisma.validator<Prisma.UserDefaultArgs>()({
  include: {
    roles: { select: { role: true } },
  },
});

export type UserWithOrganizationAndRoles = Prisma.UserGetPayload<typeof userWithRoles>;
