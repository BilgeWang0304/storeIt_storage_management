'use server';

import { createAdminClient, createSessionClient } from "@/lib/appwrite";
import { appwriteConfig } from "@/lib/appwrite/config";
import { Query, ID } from "node-appwrite";
import { parseStringify } from "@/lib/utils";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { avatarPlaceholderUrl } from "@/constants";

const handleError = (error: unknown, message: string) => {
    console.log(error, message);
    throw error;
  };

const getUserByEmail = async (email: string) => {
    const { databases } = await createAdminClient();

    const result = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.usersCollectionId,
        [Query.equal("email", [email])],
    );

    return result.total >0 ? result.documents[0] : null;
};

export const sendEmailOTP = async ({ email }: {email: string}) => {
    const { account } = await createAdminClient();
    try {
        const session = await account.createEmailToken(ID.unique(), email);
    
        return session.userId;
      } catch (error) {
        handleError(error, "Failed to send email OTP");
      }
}

export const createAccount = async ({fullName, email}: { fullName: string; email: string; }) => {

    const existingUser = await getUserByEmail(email);

    const accountId = await sendEmailOTP({ email });
    
    if (!accountId) throw new Error("Failed to send an OTP");

    if (!existingUser) {
        const { databases } = await createAdminClient();

        await databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.usersCollectionId,
        ID.unique(),
        {
            fullName,
            email,
            avatar: "data:image/png;base64,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",
            accountId,
        },
        );
    }

    return parseStringify({ accountId });
};

export const verifySecret = async ({ accountId, password}:
    {accountId: string; password: string;}) => {
        try{
            const { account } = await createAdminClient();
            const session = await account.createSession(accountId, password);
             
            (await cookies()).set("appwrite-session", session.secret, {
                path: "/",
                httpOnly: true,
                sameSite: "strict",
                secure: true,
            });

            return parseStringify({ sessionId: session.$id }); 
        }catch(error){
            handleError(error, "Failed to verify OTP")
        }
    };

export const signInUser = async ({ email }: { email: string }) => {
  try {
    const existingUser = await getUserByEmail(email);

    // User exists, send OTP
    if (existingUser) {
      await sendEmailOTP({ email });
      return parseStringify({ accountId: existingUser.accountId });
    }

    return parseStringify({ accountId: null, error: "User not found" });
  } catch (error) {
    handleError(error, "Failed to sign in user");
  }
};

export const getCurrentUser = async() => {
  const { databases, account } = await createSessionClient();

  const result = await account.get();

  const user = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.usersCollectionId,
    [Query.equal("accountId", result.$id)],
  );

  if (user.total <= 0) return null;

  return parseStringify(user.documents[0]);

};

export const signOutUser = async () => {
  const { account } = await createSessionClient();

  try {
    await account.deleteSession("current");
    (await cookies()).delete("appwrite-session");
  } catch (error) {
    handleError(error, "Failed to sign out user");
  } finally {
    redirect("/sign-in");
  }
}
