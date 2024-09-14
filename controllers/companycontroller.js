import Company from "../models/companyModel.js";
import { check, validationResult } from "express-validator";
import createError from "http-errors";
import Location from "../models/locationModel.js";
import { handleSendNotif } from "../middlewares/notifHandler.js";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getCompany = async (req, res, next) => {
  try {
    const latestCompany = await Company.findOne().sort({ createdAt: -1 });
    res.json(latestCompany);
  } catch (error) {
    res.status(500).json({ error: "Error fetching the latest company" });
  }
};

const createCompany = async (req, res, next) => {
  try {
    // Validate request body
    await check("name", "Name is required").notEmpty().run(req);
    await check("business", "Business field is required").notEmpty().run(req);
    await check("email", "Email is not valid").isEmail().run(req);
    await check("website", "Website is not valid").isURL().run(req);
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return next(createError(400, { errors: errors.array() }));
    }

    const {
      name,
      email,
      website,
      logo,
      size,
      headOffice,
      business,
      description,
    } = req.body;

    // Check if company already exists
    const existingCompany = await Company.findOne({ name });

    // Create and save new company
    const myCompany = new Company({
      name,
      business,
      email,
      website,
      logo,
      size,
      headOffice,

      description,
    });
    await myCompany.save();
    await handleSendNotif("created new company", req, res);
    res.status(201).json(myCompany);
  } catch (error) {
    next(createError(500, error.message));
  }
};

//this is more update for locations
const addLocation = async (req, res, next) => {
  try {
    // Validate request body
    await check("address", "Address is required").notEmpty().run(req);
    await check("city", "City is required").notEmpty().run(req);
    await check("state", "State is required").notEmpty().run(req);
    await check("postalCode", "Postal Code is required").notEmpty().run(req);
    await check("country", "Country is required").notEmpty().run(req);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(createError(400, { errors: errors.array() }));
    }

    const companyId = req.params.id;
    const { address, city, state, postalCode, country } = req.body;

    // Find the company by ID
    const companyExsit = await Company.findById(companyId);
    if (!companyExsit) {
      res.status(404).json({ error: "Company not found" });
    }

    // Add new location to the company's locations array
    const newLocation = new Location({
      address,
      city,
      state,
      postalCode,
      country,
    });
    await handleSendNotif("created new location", req, res);
    await newLocation.save();
    companyExsit.locations.push(newLocation);

    // Save the updated company
    await companyExsit.save();

    res
      .status(200)
      .json({ message: "Location added successfully", newLocation });
  } catch (error) {
    next(createError(500, error.message));
  }
};

const getLocations = async (req, res, next) => {
  try {
    // Find the company by ID and populate the locations field
    const company = await Company.findById(req.params.id).populate("locations");

    if (!company) {
      res.status(404).json({ error: "Company not found" });
    }

    // Extract the locations array from the company
    const locations = company.locations;

    res.status(200).json({ locations: locations });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

const editLocation = async (req, res, next) => {
  try {
    const companyId = req.params.companyId;
    const locationId = req.params.locationId;

    // Find the company by ID
    const company = await Company.findById(companyId);
    if (!company) {
      res.status(404).json({ error: "Company not found" });
    }

    // Find the location within the company by ID
    const locationIndex = company.locations.findIndex(
      (loc) => loc._id.toString() === locationId
    );
    if (locationIndex === -1) {
      res.status(404).json({ error: "Location not found" });
    }

    // Update the location with new data
    const { address, city, state, postalCode, country } = req.body;
    const updatedLocation = await Location.findOneAndUpdate({
      address,
      city,
      state,
      postalCode,
      country,
    });
    company.locations[locationIndex] = updatedLocation;

    // Save the updated company
    await company.save();
    await handleSendNotif("edited location", req, res);
    res.status(200).json({ message: "Location updated successfully", company });
  } catch (error) {
    next(createError(500, error.message));
  }
};

const deleteLocation = async (req, res, next) => {
  try {
    const companyId = req.params.companyId;
    const locationId = req.params.locationId;

    // Find the company by ID
    const company = await Company.findById(companyId);
    if (!company) {
      return next(createError(404, "Company not found"));
    }

    // Find the location within the company by ID
    const locationIndex = company.locations.findIndex(
      (loc) => loc._id.toString() === locationId
    );
    if (locationIndex === -1) {
      return next(createError(404, "Location not found"));
    }
    // Remove the location from the company's locations array
    company.locations.splice(locationIndex, 1);
    const location = await Location.findById(req.params.id);
    if (location) await location.deleteOne({ _id: location._id });

    // Save the updated company
    await company.save();
    await handleSendNotif("deleted location", req, res);
    res.status(200).json({ message: "Location deleted successfully", company });
  } catch (error) {
    next(createError(500, error.message));
  }
};

const uploadImage = async (req, res, next) => {
  try {
    const companyId = req.params.id; // Check for ID in body or params

    if (!companyId) {
      return res.status(400).json({ message: "Missing company ID in request" });
    }
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    if (req.is("multipart/form-data")) {
      saveImage(req, company, next);
      await handleSendNotif("uploaded new image for the company", req, res);
      res.status(200).json({ message: "Image Uploaded" });
    }
  } catch (error) {
    console.error("Backend error:", error);
    res.status(500).json({ message: "Internal server error" }); // Generic error message for security
  }
};

const saveImage = async (req, company, next) => {
  let imageName = "company" + "-" + Date.now();
  const storage = multer.diskStorage({
    destination: process.env.IMAGES_PATH, // Change this to your desired upload directory
    filename: function (req, file, cb) {
      imageName += path.extname(file.originalname);
      company.profileImage = process.env.IMAGES_PATH + imageName;
      cb(null, imageName);
    },
  });

  const upload = multer({ storage: storage });
  // Handle image upload using Multer
  upload.single("image")(req, next, async () => {});
  await company.save();

  return { success: true, result: { message: "Image Added successfuly " } };
};

const getImage = async (req, res) => {
  console.log(req.params.id);
  const company = await Company.findById(req.params.id);
  if (!company) {
    res.status(404).json({ message: "company not found " });
    return;
  }

  const imgPath = company.profileImage;
  const imagePath = path.join(__dirname, "." + imgPath);
  if (!imagePath.includes("Error")) {
    res.sendFile(imagePath);
    return;
  } else {
    res.status(404).json({ message: "Image not found" });
  }
};

export {
  createCompany,
  addLocation,
  editLocation,
  deleteLocation,
  getLocations,
  getCompany,
  uploadImage,
  getImage,
};
