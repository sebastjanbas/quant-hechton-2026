"use server"
import db from "@/lib/db";

export const checkUserByEmail = async (email: string) => {
  try {
    const result = await db.query('SELECT "email" FROM "user" WHERE email = $1', [email]);
    return {status: 200, data: result.rows, message: "Success"};

  } catch (error: any) {
    console.log(error);
    return {status: 400, message: error.message, data: []};
  }
}