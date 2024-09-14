import report from "../models/reportModel.js";
import user from "../models/userModel.js";

const createReport = async (req, res) => {
  const filePath = req.file.path;
  console.log(filePath);

  try {
    const newReport = new report({
      name: req.body.name,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      createdBy: req.body.createdBy,
      createdAt: new Date(),
      status: req.body.status || "failed",
      downloadURL: filePath,
    });

    const savedReport = await newReport.save();

    // Assuming "pdfData" field in the request body contains the base64 encoded PDF data
    if (req.body.pdfData) {
      const pdfBuffer = Buffer.from(req.body.pdfData, "base64");
      const pdfPath = "/path/to/store/pdfs/" + savedReport._id + ".pdf";

      // Save the PDF to the file system (replace with your storage logic)
      await fs.promises.writeFile(pdfPath, pdfBuffer);

      // Update report with a flag indicating PDF is available, not a download URL
      savedReport.hasPdf = true;
      await savedReport.save();
    }

    res.status(201).json(savedReport); // Report created successfully
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error creating report" }); // More specific error message later
  }
};

const getReports = async (req, res) => {
  try {
    const reportRoles = await report.find({});
    res.json(reportRoles);
  } catch (e) {
    return res.status(400).json({ error: "Internal Server Error" });
  }
};

const uploadImage = async (req, res, next) => {
  try {
    const reportId = req.params.id; // Check for ID in body or params

    if (!reportId) {
      return res
        .status(400)
        .json({ message: "Missing reportId ID in request" });
    }
    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ message: "report not found" });
    }

    if (req.is("multipart/form-data")) {
      saveImage(req, report, next);
      await handleSendNotif("uploaded new image for the report", req, res);
      res.status(200).json({ message: "Image Uploaded" });
    }
  } catch (error) {
    console.error("Backend error:", error);
    res.status(500).json({ message: "Internal server error" }); // Generic error message for security
  }
};

const saveImage = async (req, report, next) => {
  let imageName = "report" + "-" + Date.now();
  const storage = multer.diskStorage({
    destination: process.env.IMAGES_PATH, // Change this to your desired upload directory
    filename: function (req, file, cb) {
      imageName += path.extname(file.originalname);
      report.downloadUrl = process.env.IMAGES_PATH + imageName;
      cb(null, imageName);
    },
  });

  const upload = multer({ storage: storage });
  // Handle image upload using Multer
  upload.single("image")(req, next, async () => {});
  await report.save();

  return { success: true, result: { message: "Image Added successfuly " } };
};

const deleteReport = async (req, res) => {
  const roleId = req.params.id;
  try {
    await report.deleteOne({ _id: roleId });

    res.json({ message: "report deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting role", error: error });
  }
};

export { createReport, uploadImage, getReports, deleteReport };
