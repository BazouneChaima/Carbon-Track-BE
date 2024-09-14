import Role from "../models/roleModel.js";
import fs from "fs";
import user from "../models/userModel.js";
import mongoose from "mongoose";

const createRole = async (req, res) => {
  const { name, usersIds, permissions } = req.body;

  try {
    if (!usersIds || !usersIds.length) {
      return res
        .status(400)
        .json({ message: "Please provide user IDs to assign the role" });
    }

    const users = await user.find({ _id: { $in: usersIds } });

    const newRole = await Role.create({
      name,
      permissions: permissions,
      users: users,
    });
    await user.updateMany({ _id: { $in: usersIds } }, { role: newRole._id });

    res.json({
      message: "Role created and assigned to users successfully",
      role: newRole,
    });
  } catch (error) {
    res.status(500).json({ message: "Error creating role" });
  }
};

const getRoles = async (req, res) => {
  try {
    const rolesRes = await Role.find().populate({
      path: "users",
      model: user,
      select: "-password -_role -__v  -updatedAt -createdAt",
    });
    res.json(rolesRes);
  } catch (e) {
    return res.status(400).json({ error: "Internal Server Error" });
  }
};

const updateRole = async (req, res) => {
  const { id, name, usersIds, permissions } = req.body;

  try {
    if (!id) {
      return res.status(400).json({ message: "Role ID is required" });
    }

    if (!name && !usersIds && !permissions) {
      return res.status(400).json({
        message:
          "At least one update field is required (name, usersIds, permissions)",
      });
    }
    const roleToUpdate = await Role.findById(id);
    if (!roleToUpdate) {
      return res.status(404).json({ message: "Role not found" });
    }
    const updates = {};
    if (name) updates.name = name;
    if (permissions) updates.permissions = permissions;
    if (usersIds) {
      const users = await user.find({ _id: { $in: usersIds } });

      updates.users = users;
    }

    const updatedRole = await Role.findOneAndUpdate({ _id: id }, updates, {
      new: true,
    });
    if (!updatedRole) {
      return res.status(500).json({ message: "Error updating role" });
    }

    if (usersIds) {
      const updatePromises = usersIds.map(async (userId) => {
        const userToUpdate = await user.findByIdAndUpdate(
          userId,
          { role: id },
          { new: true }
        );

        if (!userToUpdate) {
        }
      });

      await Promise.all(updatePromises);
    }

    res.json({ message: "Role updated successfully", role: updatedRole });
  } catch (error) {
    res.status(500).json({ message: "Error updating role" });
  }
};

const deleteRole = async (req, res) => {
  const roleId = req.params.id;
  try {
    const userAdmin = await user.findById(req.body.id).select("-password");

    if (!req.params.id) {
      return res.status(400).json({ message: "Role ID is required" });
    }
    if (!userAdmin || !userAdmin.isAdmin) {
      return res.status(401).json({ message: "Unauthorized to delete roles" });
    }
    const myRole = await Role.findById(roleId);
    if (myRole && userAdmin.isAdmin) {
      const deletedRole = await Role.deleteOne({ _id: roleId });

      res.json({ message: "Role deleted successfully" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error deleting role", error: error });
  }
};

const detailsRole = async (req, res) => {};

export { createRole, getRoles, updateRole, deleteRole, detailsRole };
