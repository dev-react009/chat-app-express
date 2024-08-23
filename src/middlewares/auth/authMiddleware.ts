import { Request, Response,NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_KEY = process.env.JWT_SECRET!;


interface DecodedToken {
  userId?: string;
  iat: number;
  exp: number;
}

const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ status: false, statusCode: 403, error: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_KEY) as DecodedToken;
    (req as Request).userId = decoded.userId;
    next();
  } catch (error) {
    return res
      .status(401)
      .json({ status: false, statusCode: 403,message:"token forbidden", error: "Invalid token" });
  }
};

export default authMiddleware;
