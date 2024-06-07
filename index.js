import express from "express";
<<<<<<< Updated upstream

//import errorHandler from '../middlewares/errorHandler';
=======
import cors from 'cors';
>>>>>>> Stashed changes
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import uploadRoutes from "./routes/dataRoutes.js";
import targetRoutes from "./routes/targetRoutes.js";
import companyRoutes from "./routes/companyRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import roleRoutes from "./routes/roleRoutes.js";
import emissionRoutes from "./routes/emissionRoutes.js";
import cors from 'cors'

dotenv.config();
const port = process.env.PORT;
connectDB();
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: 'http://localhost:3000', // Your Next.js frontend URL
  credentials: true,
}))

<<<<<<< Updated upstream
app.use("/api/users", userRoutes);
app.use("/tasks", taskRoutes);
=======
app.use("/api/users",cors(), userRoutes);
app.use("/api/tasks", taskRoutes);
>>>>>>> Stashed changes
app.use("/upload", uploadRoutes);
app.use("/target", targetRoutes);
app.use("/company", companyRoutes);
app.use("/report", reportRoutes);
app.use("/role",roleRoutes);
app.use('/emission',emissionRoutes);


//app.use(errorHandler);
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
