import { getUser } from "../controllers/auth.js";

export function restrictToLoggedinUserOnly(req, res, next) {
  const sessionId = req.cookies?.uid;
  if (!sessionId) return res.redirect('/login');
  const user = getUser(sessionId);
  if (!user) return res.redirect('/login');
  req.user = user;
  next();
}