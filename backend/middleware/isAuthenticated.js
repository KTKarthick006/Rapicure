import { getUser } from "../controllers/auth.js";

export function restrictToLoggedinUserOnly(req, res, next) {
  const userUid = req.cookies?.uid;

  if (!userUid) return res.redirect("/login");
  const user = getUser(userUid);

  if (!user) return res.redirect("/login");

  req.user = user;
  next();
}

// export function restrictToLoggedinUserOnly(req, res, next) {
//   const userUid = req.cookies?.uid;

//   console.log("🔍 Cookie UID:", userUid);  // 👈 Check if cookie is coming

//   if (!userUid) {
//     console.log("❌ No UID in cookies. Redirecting to /login");
//     return res.redirect("/login");
//   }

//   const user = getUser(userUid);

//   console.log("👤 User from getUser:", user);  // 👈 Check if user was found

//   if (!user) {
//     console.log("❌ User not found. Redirecting to /login");
//     return res.redirect("/login");
//   }

//   req.user = user;
//   console.log("✅ User verified:", user.name);
//   next();
// }
