import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import type {
  AuthenticationResponseJSON,
  AuthenticatorTransportFuture,
  RegistrationResponseJSON,
} from "@simplewebauthn/server";
import { query, queryOne } from "./db";

const rpName = process.env.WEBAUTHN_RP_NAME || "BioAccess";
const rpID = process.env.WEBAUTHN_RP_ID || "localhost";
const origin = process.env.WEBAUTHN_ORIGIN || "http://localhost:3000";

// Temporary challenge store (use Redis in production)
const challenges = new Map<string, { challenge: string; userId: number; expires: number }>();

function storeChallenge(key: string, challenge: string, userId: number) {
  challenges.set(key, { challenge, userId, expires: Date.now() + 5 * 60 * 1000 });
}

function consumeChallenge(key: string, userId: number): string | null {
  const entry = challenges.get(key);
  challenges.delete(key);
  if (!entry || entry.userId !== userId || entry.expires < Date.now()) return null;
  return entry.challenge;
}

export async function getRegistrationOptions(userId: number) {
  const user = await queryOne<{
    id: number;
    employee_id: string;
    full_name: string;
    email: string;
  }>("SELECT id, employee_id, full_name, email FROM users WHERE id = $1", [userId]);

  if (!user) throw new Error("User not found");

  const existingCreds = await query<{
    credential_id: string;
    transports: string[] | null;
  }>("SELECT credential_id, transports FROM webauthn_credentials WHERE user_id = $1", [userId]);

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userName: user.email,
    userDisplayName: user.full_name,
    userID: new TextEncoder().encode(String(user.id)),
    attestationType: "none",
    authenticatorSelection: {
      authenticatorAttachment: "platform",
      userVerification: "required",
      residentKey: "preferred",
    },
    excludeCredentials: existingCreds.map((c) => ({
      id: c.credential_id,
      transports: (c.transports as AuthenticatorTransportFuture[]) ?? undefined,
    })),
  });

  storeChallenge(`reg:${userId}`, options.challenge, userId);
  return options;
}

export async function verifyRegistration(
  userId: number,
  response: RegistrationResponseJSON
) {
  const expectedChallenge = consumeChallenge(`reg:${userId}`, userId);
  if (!expectedChallenge) throw new Error("Registration challenge expired");

  const verification = await verifyRegistrationResponse({
    response,
    expectedChallenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
  });

  if (!verification.verified || !verification.registrationInfo) {
    throw new Error("Fingerprint registration failed");
  }

  const { credential, credentialDeviceType, credentialBackedUp } =
    verification.registrationInfo;

  await query(
    `INSERT INTO webauthn_credentials (user_id, credential_id, public_key, counter, transports)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      userId,
      credential.id,
      Buffer.from(credential.publicKey),
      credential.counter,
      response.response.transports ?? [],
    ]
  );

  await query("UPDATE users SET fingerprint_registered = TRUE WHERE id = $1", [userId]);

  return { verified: true, deviceType: credentialDeviceType, backedUp: credentialBackedUp };
}

export async function getAuthenticationOptions(employeeId: string) {
  const user = await queryOne<{
    id: number;
    employee_id: string;
    full_name: string;
    fingerprint_registered: boolean;
  }>(
    "SELECT id, employee_id, full_name, fingerprint_registered FROM users WHERE employee_id = $1",
    [employeeId.trim().toUpperCase()]
  );

  if (!user) throw new Error("Employee not found");
  if (!user.fingerprint_registered) {
    throw new Error("Fingerprint not registered for this employee. Register first.");
  }

  const creds = await query<{
    credential_id: string;
    transports: string[] | null;
  }>("SELECT credential_id, transports FROM webauthn_credentials WHERE user_id = $1", [
    user.id,
  ]);

  if (creds.length === 0) {
    throw new Error("No fingerprint credential found for this employee");
  }

  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: "required",
    allowCredentials: creds.map((c) => ({
      id: c.credential_id,
      transports: (c.transports as AuthenticatorTransportFuture[]) ?? undefined,
    })),
  });

  storeChallenge(`auth:${user.id}`, options.challenge, user.id);
  return { options, userId: user.id, fullName: user.full_name };
}

export async function verifyAuthentication(
  userId: number,
  response: AuthenticationResponseJSON
) {
  const expectedChallenge = consumeChallenge(`auth:${userId}`, userId);
  if (!expectedChallenge) throw new Error("Authentication challenge expired");

  const cred = await queryOne<{
    credential_id: string;
    public_key: Buffer;
    counter: string;
    transports: string[] | null;
  }>(
    `SELECT credential_id, public_key, counter, transports FROM webauthn_credentials
     WHERE user_id = $1 AND credential_id = $2`,
    [userId, response.id]
  );

  if (!cred) {
    throw new Error("Fingerprint does not match this employee. Check-in denied.");
  }

  const verification = await verifyAuthenticationResponse({
    response,
    expectedChallenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    credential: {
      id: cred.credential_id,
      publicKey: new Uint8Array(cred.public_key),
      counter: Number(cred.counter),
      transports: (cred.transports as AuthenticatorTransportFuture[]) ?? undefined,
    },
  });

  if (!verification.verified) {
    throw new Error("Fingerprint verification failed");
  }

  await query("UPDATE webauthn_credentials SET counter = $1 WHERE credential_id = $2", [
    verification.authenticationInfo.newCounter,
    cred.credential_id,
  ]);

  return { verified: true };
}
