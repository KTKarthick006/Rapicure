import multer from "multer";

const storage = multer.memoryStorage(); //memoryStorage means ki ram me store hoga

const upload = multer({ storage });
export default upload;
