import report from "../models/reportModel.js";
import emission from "../models/EmissionFactorModel.js";

const getEmissionFactor = async (req, res) => {
  console.log("get all getEmissionFactor");
  try {
    const { page, limit, search, column, operator, value } = req.query;

    const searchFilter = search
      ? {
          $or: [
            { Name: search },
            { Name: { $regex: search, $options: "i" } },
            { Category: search },
            { Category: { $regex: search, $options: "i" } },
            { Unit: search },
            { Unit: { $regex: search, $options: "i" } },
            { Source: search },
            { Source: { $regex: search, $options: "i" } },
            { Year: search },
            { Year: { $regex: search, $options: "i" } },
          ],
        }
      : {};
    if (column && operator && value) {
      const validColumns = ["Name", "Category", "Source"];
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
          console.log("equla", column, value);
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
          filterExpression = { [column]: { $gt: value } };
          break;
        case "lessThan":
          filterExpression = { [column]: { $lt: value } };
          break;
        default:
          // Handle unsupported operators (if applicable)
          break;
      }

      searchFilter.$and = searchFilter.$and || [];
      searchFilter.$and.push(filterExpression);
    }
    console.log("get all getEmissionFactor===>", search, searchFilter);
    const total = await emission.countDocuments(searchFilter);
    const totalPages = Math.ceil(total / limit);

    const pageMin = Math.min(Math.max(page, 1), totalPages);

    const skip = (page - 1) * limit;

    const emissions = await emission.find(searchFilter, {
      ID: 1,
      Name: 1,
      Category: 1,
      Unit: 1,
      Source: 1,
      Year: 1,
    });
    console.log("emissions", emissions, pageMin, total, totalPages);
    res.json({
      emissions: emissions,
      total: total,
      pageMin: pageMin,
      totalPages: totalPages,
    });
  } catch (error) {
    console.error("Error fetching emissions:", error);
    let errorMessage = "Internal Server Error";
    if (error.message.includes("validation")) {
      errorMessage = "Invalid search term";
    }
  }
};

export { getEmissionFactor };
