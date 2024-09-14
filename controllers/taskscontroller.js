import task from "../models/tasksModel.js";
import user from "../models/userModel.js";
import target from "../models/targetModel.js";
import mongoose from "mongoose";
import { check, validationResult } from "express-validator";
import moment from "moment";

const createTask = async (req, res) => {
  try {
    
    await check("taskName", "Task name is required").notEmpty().run(req);
    await check("targetName", "Target is required").notEmpty().run(req);
    await check("dueDate", "Due Date is required").notEmpty().run(req);
    await check("usersIds", "User IDs are required").notEmpty().run(req);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { taskName, targetName, dueDate, usersIds, createdBy } = req.body;
    const existingTask = await task.findOne({ taskName });
    if (existingTask) {
      return res
        .status(400)
        .json({ error: "Task with this name already exists" });
    }

    const mytask = new task({
      taskName,
      targetName,
      dueDate,
      assignedUser: usersIds,
      createdBy,
    });
    await mytask.save();
    res.status(201).json(mytask);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const assignTask = async (req, res) => {
  try {
    

    const { usersIds, id } = req.body;

    
    const existingTask = await task.findById(id);
    if (!existingTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    
    if (usersIds) {
      const validUsers = await user.find({ _id: { $in: usersIds } });

      if (validUsers.length !== usersIds.length) {
        return res
          .status(400)
          .json({ error: "One or more user IDs are invalid" });
      }
    }

    if (usersIds) {
      existingTask.assignedUser = usersIds;
      await existingTask.save();
    }

    return res.status(200).json({ message: "Task assigned successfully" });
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const taskCompleted = async (req, res) => {
  const taskId = req.params.taskId;

  try {
    const mytask = await task.findById(taskId);
    if (!mytask) {
      return res.status(404).json({ message: "Task not found" });
    }

    task.status = "completed";
    await task.save();

    return res
      .status(200)
      .json({ message: "Task marked as completed successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};


const updateTask = async (req, res) => {
  try {
    

    const { taskName, targetName, dueDate, usersIds, id } = req.body;
    

    
    const existingTask = await task.findById(id);
    if (!existingTask) {
      return res.status(404).json({ error: "Task not found" });
    }

    
    if (taskName && existingTask.taskName !== taskName) {
      const taskNameExists = await task.findOne({ taskName });
      if (taskNameExists) {
        return res
          .status(400)
          .json({ error: "Task with this name already exists" });
      }
    }
    
    if (usersIds) {
      const validUsers = await user.find({ _id: { $in: usersIds } });
      if (validUsers.length !== usersIds.length) {
        return res
          .status(400)
          .json({ error: "One or more user IDs are invalid" });
      }
    }

    
    if (taskName) existingTask.taskName = taskName;
    if (targetName) existingTask.targetName = targetName;
    if (dueDate) existingTask.dueDate = dueDate;
    if (usersIds) existingTask.assignedUser = usersIds;
    existingTask.updatedBy = req.user._id; 

    await existingTask.save();
    res.status(200).json(existingTask);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const deleteTask = async (req, res) => {
  try {
    const taskId = req.params.taskId;

    
    const existingTask = await task.findById(taskId);
    if (!existingTask) {
      return res.status(404).json({ error: "Task not found" });
    }

    
    await task.findByIdAndDelete(taskId);

    res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getAllTasks = async (req, res, next) => {
  try {
    const { dueDate, search, column, operator, value } =
      req.query;
    const targetDate = dueDate ? moment(dueDate).utc() : {};

    const filter = {};
    if (dueDate) {
      filter.dueDate = {
        $gte: moment(dueDate).utc().startOf("day").toDate(),
        $lte: moment(dueDate).utc().endOf("day").toDate(),
      };
    }

    
    if (column != "targetName" && operator && value) {
      
      const validColumns = ["taskName", "dueDate", "progress", "status"];
      if (!validColumns.includes(column)) {
        return res
          .status(400)
          .json({ error: `Invalid column name: ${column}` });
      }

      
      const validOperators = [
        "equals",
        "startsWith",
        "endsWith",
        "contains",
        "greaterThan",
        "lessThan",
      ];
      if (!validOperators.includes(operator)) {
        return res.status(400).json({ error: `Invalid operator: ${operator}` });
      }

      let filterExpression;
      switch (operator) {
        case "equals":
          filterExpression = { [column]: value };
          break;
        case "startsWith":
          filterExpression = {
            [column]: { $regex: new RegExp(`^${value}`, "i") },
          };
          break;
        case "endsWith":
          filterExpression = {
            [column]: { $regex: new RegExp(`${value}$`, "i") },
          };
          break;
        case "contains":
          filterExpression = { [column]: { $regex: new RegExp(value, "i") } };
          break;
        case "greaterThan":
          filterExpression =
            column === "dueDate"
              ? { [column]: { $gte: moment(value).utc().toDate() } }
              : { [column]: { $gt: value } };
          break;
        case "lessThan":
          filterExpression =
            column === "dueDate"
              ? { [column]: { $lte: moment(value).utc().toDate() } }
              : { [column]: { $lt: value } };
          break;
        default:
          
          break;
      }

      filter.$and = filter.$and || []; 
      filter.$and.push(filterExpression);
    }

    let tasks = await task
      .find(filter)
      
      
      .populate({ path: "targetName", select: "name" }) 
      .populate({ path: "assignedUser", select: "username email" }); 

    if (search) {
      tasks = tasks.filter((task) => {
        const match = (val) => new RegExp(val, "i").test(task.taskName);
        const matchTarget = (val) =>
          new RegExp(val, "i").test(task?.targetName.name);

        return (
          match(search) ||
          matchTarget(search) ||
          task.taskName.toLowerCase().includes(search.toLowerCase()) ||
          task?.targetName.name.toLowerCase().includes(search.toLowerCase())
        );
        
      });
    }

    if (column === "targetName" && operator && value) {
      tasks = tasks.filter((task) => {
        const targetName = task.targetName && task.targetName.name;
        const match = (val) => new RegExp(val, "i").test(targetName);

        switch (operator) {
          case "equals":
            return targetName === value;
          case "startsWith":
            return targetName && match(`^${value}`);
          case "endsWith":
            return targetName && match(`${value}$`);
          case "contains":
            return targetName && match(value);
          default:
            return true;
        }
      });
    }

    const flatList = tasks.map((task) => {
      const {
        _id,
        taskName,
        targetName,
        assignedUser,
        status,
        dueDate,
        createdBy,
        createdAt,
        updatedAt,
      } = task;
      const usersIds = assignedUser;
      return {
        _id,
        taskName,
        targetName: targetName ? targetName.name : null,
        usersIds,
        status,
        dueDate,
        createdBy,
        createdAt,
        updatedAt,
      };
    });
    const total = await flatList.length;

    res.json({ tasks: flatList, total });
    next();
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getMyTasks = async (req, res, next) => {
  try {
    const userId = req.params.userId; 
    const validUser = await user.find({ _id: userId });

    if (validUser) {
      
      const tasks = await task.find({ assignedUser: userId });

      res.status(200).json(tasks);
    }
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export {
  createTask,
  assignTask,
  taskCompleted,
  updateTask,
  deleteTask,
  getAllTasks,
  getMyTasks,
};
