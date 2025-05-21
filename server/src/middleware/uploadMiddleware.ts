import multer from "multer";
import path from "path";
import fs from "fs";

// Убедимся, что директория uploads существует
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const fileFilter = (
  req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Проверка типа файла
  if (
    file.mimetype.startsWith("image/jpeg") ||
    file.mimetype.startsWith("image/png") ||
    file.mimetype.startsWith("image/jpg") ||
    file.mimetype.startsWith("image/webp")
  ) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Unsupported file type: ${file.mimetype}. Only JPEG, PNG, WEBP are allowed.`
      )
    );
  }
};

const upload = multer({
  storage,
  fileFilter: fileFilter,
  limits: { fileSize: 1024 * 1024 * 5 }, // 5MB
});

export default upload;
