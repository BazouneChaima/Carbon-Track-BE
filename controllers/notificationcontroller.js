import notification from "../models/notificationModel.js";
import { io } from "../index.js";
import user from "../models/userModel.js";

export const createNotification = async (req, res) => {
  try {
    const userid = req.user?._id || req.body.user._id;
    const currentUser = await user.findById(userid);
    const newNotif = new notification({ ...req.body, user: currentUser });
    await newNotif.save();
    io.emit("notification", {
      message: "All users called created!",
      notification: newNotif,
    });
  } catch (error) {
    console.log("message" + error.message);
  }
};

export const getAllNotificaitons = async (req, res) => {
  try {
    const allNotifs = await notification
      .find({})
      .populate("user")
      .sort({ created_at: "asc" });
    res.status(200).json(allNotifs.reverse());
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getNotification = async (req, res) => {
  try {
    const notif = await notification.findById(req.params.id);
    if (!notif) {
      res.status(404).json({ error: "Notification not found" });
      return;
    }
    res.status(200).json(notif);
  } catch (error) {}
};

export const updateNotification = async (req, res) => {
  try {
    const notif = await notification.findById(req.params.id);

    if (notif) {
      notif.status = "SEEN";
      await notif.save();
      res.status(200).json({ message: "Notification Updated" });
      return;
    }
    res.status(404).json({ error: "Notification not found" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const updateBulkNotifications = async (req, res) => {
  try {
    await notification
      .updateMany(
        { _id: { $in: req.body.notificationIds } },
        { $set: { status: "SEEN" } }
      )
      .then((result) => {
        res.status(200).json({ message: "Notification Updated" });
      })
      .catch((err) => {
        res.status(404).json({ error: "Notification not found" });
      });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
