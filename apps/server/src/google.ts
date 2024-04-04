import process from 'node:process';
import { OAuth2Client } from 'google-auth-library';
import { prisma, type Prisma } from '@repo/database';
import { logger } from '@repo/logger';
import { isMError, type MError } from '@repo/utils';
import { createJwts } from './auth';
import { createUser, type UserData } from './contexts/user';

interface PeopleData {
  resourceName: string;
  etag: string;
  names: Name[];
  photos: Photo[];
  emailAddresses: EmailAddress[];
}

interface Name {
  metadata: NameMetadata;
  displayName: string;
  familyName: string;
  givenName: string;
  displayNameLastFirst: string;
  unstructuredName: string;
}

interface NameMetadata {
  primary: boolean;
  source: NameSource;
  sourcePrimary: boolean;
}

interface NameSource {
  type: string;
  id: string;
}

interface Photo {
  metadata: PhotoMetadata;
  url: string;
}

interface PhotoMetadata {
  primary: boolean;
  source: PhotoSource;
}

interface PhotoSource {
  type: string;
  id: string;
}

interface EmailAddress {
  metadata: EmailMetadata;
  value: string;
}

interface EmailMetadata {
  primary?: boolean;
  verified: boolean;
  source: EmailSource;
  sourcePrimary?: boolean;
}

interface EmailSource {
  type: string;
  id: string;
}

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI,
);

export const generateAuthUrl = (state: string): string =>
  client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/userinfo.email'],
    state,
  });

const getUserdata = async (code: string): Promise<UserData | { error: true; message: string }> => {
  try {
    const getTokenResponse = await client.getToken(code);
    // Make sure to set the credentials on the OAuth2 client.
    client.setCredentials(getTokenResponse.tokens);
    const url = 'https://people.googleapis.com/v1/people/me?personFields=names,emailAddresses,photos';
    const { data } = await client.request<PeopleData>({ url });
    return {
      googleId: data.resourceName.replace('people/', ''),
      // name: data.names.find((name) => name.metadata.primary)?.displayName,
      firstName: data.names.find((name) => name.metadata.primary)?.givenName,
      lastName: data.names.find((name) => name.metadata.primary)?.familyName,
      email: data.emailAddresses.find((email) => email.metadata.primary)?.value,
      photo: data.photos.find((photo) => photo.metadata.primary)?.url,
    } as UserData;
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : JSON.stringify(e);
    logger.error(`Error retrieving user data: ${errorMessage}`);
    return {
      error: true,
      message: errorMessage,
    } satisfies MError;
  }
};

export const googleLogin = async (
  code: string,
  query: {
    include?: Prisma.UserInclude | undefined;
    select?: Prisma.UserSelect | undefined;
  },
) => {
  const userdata = await getUserdata(code);
  if (isMError(userdata)) {
    return userdata;
  }

  const googleUser = await prisma.user.findUnique({
    ...query,
    include: { roles: { select: { role: true } } },
    where: { googleId: userdata.googleId },
  });

  if (googleUser) {
    const { token, refreshToken } = createJwts(
      googleUser.id,
      googleUser.organizationId,
      googleUser.roles.map((r) => r.role.name),
    );
    return {
      token,
      refreshToken,
      user: googleUser,
    };
  }

  const emailUser = await prisma.user.findUnique({
    ...query,
    include: { roles: { select: { role: true } } },
    where: { email: userdata.email },
  });

  if (emailUser) {
    const { token, refreshToken } = createJwts(
      emailUser.id,
      emailUser.organizationId,
      emailUser.roles.map((r) => r.role.name),
    );
    return {
      token,
      refreshToken,
      user: emailUser,
    };
  }

  const user = await createUser(userdata, query);

  const { token, refreshToken } = createJwts(
    user.id,
    user.organizationId,
    user.roles.map((r) => r.role.name),
  );
  return {
    token,
    refreshToken,
    user,
  };
};
