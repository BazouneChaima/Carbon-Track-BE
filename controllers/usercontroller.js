import bcrypt from "bcryptjs";
import createToken from "../utils/createToken.js";
import user from "../models/userModel.js";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { io } from "../index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const createUser = async (req, res) => {
  const { username, firstname, lastname, phone, email, password } = req.body;
  if (!username || !email || !password) {
    throw new Error("please fill all the inputs ");
  }
  const userexist = await user.findOne({ email });
  if (userexist) res.status(400).send("user already exist");
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  const newuser = new user({
    username,
    email,
    firstname,
    lastname,
    phone,
    password: hashedPassword,
  });
  try {
    await newuser.save();
    createToken(res, newuser._id);
    res.status(201).json({
      _id: newuser._id,
      username: newuser.username,
      firstname: newuser.firstname,
      lastname: newuser.lastname,
      firstname: newuser.firstname,
      lastname: newuser.lastname,
      email: newuser.email,
      isAdmin: newuser.isAdmin,
    });
  } catch (error) {
    res.status(400);
    throw new Error("invalid user data");
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const existingUser = await user.findOne({ email });
    if (existingUser) {
      const passvalid = await bcrypt.compare(password, existingUser.password);
      if (passvalid) {
        createToken(res, existingUser._id);
        res.status(201).json({
          _id: existingUser._id,
          username: existingUser.username,
          email: existingUser.email,
          firstname: existingUser.firstname,
          lastname: existingUser.lastname,
          phone: existingUser.phone,
          isAdmin: existingUser.isAdmin,
          coverImage: existingUser.coverImage,
          profileImage: existingUser.profileImage,
        });
      } else {
        return res.status(401).json({ error: "Invalid email or password" });
      }
    } else {
      return res.status(401).json({ error: "Invalid email or password" });
    }
  } catch (e) {
    return res.status(401).json({ error: "Error Occured" });
  }

  
};

const logoutUser = async (req, res) => {
  res.cookie("jwt", "", {
    httpOnly: true,
    expires: new Date(0),
  });
  res.status(200).json({ message: "logout successfully" });
};

const getalluser = async (req, res) => {
  try {
    
    const users = await user.find({}).populate("role");

    
    res.json(users);
  } catch (error) {
    
    res.status(500).json({ message: error.message });
  }
};

const getprofile = async (req, res) => {
  const myuser = await user.findById(req.user._id);
  if (myuser) {
    res.json({
      _id: myuser._id,
      username: myuser.username,
      email: myuser.email,
    });
  } else {
    res.status(404);
    throw new Error("user not found");
  }
};

const updateUserStatus = async (req, res) => {
  const myuser = req.params.id
    ? await user.findById(req.params.id)
    : await user.findById(req.user._id);
  
  if (myuser) {
    myuser.status =
      myuser.status == "active"
        ? (myuser.status = "desactive")
        : (myuser.status = "active");

    const updated = await myuser.save();
    res.json({
      _id: updated._id,
      username: updated.username,
      email: updated.email,
      firstname: updated.firstname,
      lastname: updated.lastname,
      phone: updated.phone,
      city: updated.city,
      country: updated.country,
      timezone: updated.timezone,
      status: updateUser.status,
    });
  } else {
    res.status(404);
    throw new Error("user not found ");
  }
};

const updateUser = async (req, res) => {
  const myuser = req.body.id
    ? await user.findById(req.body.id)
    : await user.findById(req.body._id);
  
  if (myuser) {
    myuser.username = req.body.username || myuser.username;

    if (req.body.password) {
      const passvalid = await bcrypt.compare(
        req.body.currentpassword,
        myuser.password
      );
      if (passvalid) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);
        myuser.password = hashedPassword;
      } else {
        return res.status(401).json({ error: "Invalid password" });
      }
    }
    const updated = await myuser.save();
    res.json({
      _id: updated._id,
      username: updated.username,
    });
  } else {
    res.status(404);
    throw new Error("user not found ");
  }
};

const updateCurrentUser = async (req, res) => {
  const myuser = req.params.id
    ? await user.findById(req.params.id)
    : await user.findById(req.user._id);
  if (myuser) {
    myuser.email = req.body.email || myuser.email;
    myuser.firstname = req.body.firstname || myuser.firstname;
    myuser.lastname = req.body.lastname || myuser.lastname;
    myuser.phone = req.body.phone || myuser.phone;
    myuser.city = req.body.city || myuser.city;
    myuser.country = req.body.country || myuser.country;
    myuser.timezone = req.body.timezone || myuser.timezone;
    if (req.body.password) {
      const passvalid = await bcrypt.compare(
        req.body.currentpassword,
        myuser.password
      );
      if (!passvalid) {
        res.status(400).json({ error: "Password incorrect" });
        return;
      }
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(req.body.password, salt);
      myuser.password = hashedPassword;
    }
    const updated = await myuser.save();
    res.json({
      _id: updated._id,
      username: updated.username,
      email: updated.email,
      firstname: updated.firstname,
      lastname: updated.lastname,
      phone: updated.phone,
      city: updated.city,
      country: updated.country,
      timezone: updated.timezone,
    });
  } else {
    res.status(404);
    throw new Error("user not found ");
  }
};

const getImage = async (req, res) => {
  const myuser = await user.findById(req.params.id);
  if (!myuser) {
    res.status(404).json({ message: "user not found " });
    return;
  }

  const type = req.headers["type"];
  const imgPath = type == "COVER" ? myuser.coverImage : myuser.profileImage;
  const imagePath = path.join(__dirname, "." + imgPath);
  if (!imagePath.includes("Error")) {
    res.sendFile(imagePath);
    return;
  } else {
    res.status(404).json({ message: "Image not found" });
  }
};

const deleteUser = async (req, res) => {
  const myuser = await user.findById(req.params.id);
  if (myuser) {
    if (myuser.isAdmin) {
      res.status(400);
      throw new Error("cant delete admin");
    }
    await user.deleteOne({ _id: myuser._id });
    res.json({ message: "user deleted" });
  } else {
    res.status(404);
    throw new Error("user not found  ");
  }
};

const getuserById = async (req, res) => {
  const myuser = await user.findById(req.params.id).select("-password");
  if (myuser) {
    res.json(myuser);
  } else {
    res.status(404);
    throw new Error("user not found  ");
  }
};

const updateUserById = async (req, res) => {
  const myuser = await user.findById(req.params.id);
};


const uploadImage = async (req, res, next) => {
  try {
    const userId = req.params.id; 

    if (req.is("multipart/form-data")) {
      if (!userId) {
        return res
          .status(400)
          .json({ message: "Missing user ID in request body or URL" });
      }

      const userUpdate = await user.findById(userId);
      if (!userUpdate) {
        return res.status(404).json({ message: "User not found" });
      }
      const type = req.headers["type"];
      saveImage(type, req, userUpdate, next);

      res.status(200).json({ message: "Image Uploaded" });
    }
  } catch (error) {
    res.status(500).json({ message: "Internal server error" }); 
  }
};

const saveImage = async (type, req, user, next) => {
  let imageName = type + "-" + Date.now();
  const storage = multer.diskStorage({
    destination: process.env.IMAGES_PATH, 
    filename: function (req, file, cb) {
      imageName += path.extname(file.originalname);
      type == "COVER"
        ? (user.coverImage = process.env.IMAGES_PATH + imageName)
        : (user.profileImage = process.env.IMAGES_PATH + imageName);
      cb(null, imageName);
    },
  });

  const upload = multer({ storage: storage });
  
  upload.single("image")(req, next, async (err, uploadResult) => {});
  await user.save();

  return { success: true, result: { message: "Image Added successfuly " } };
};
export {
  createUser,
  loginUser,
  logoutUser,
  getalluser,
  getprofile,
  updateUser,
  updateCurrentUser,
  deleteUser,
  getuserById,
  updateUserById,
  updateUserStatus,
  uploadImage,
  getImage,
}; 
