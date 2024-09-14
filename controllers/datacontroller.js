import csvParser from "csv-parser";
import data from "../models/dataModel.js";

const uploadFile = (req, res) => {
  const results = [];

  csvParser()
    .on("data", (data) => results.push(data))
    .on("end", () => {
      data.insertMany(results, (err) => {
        if (err) {
          console.error(err);
          res.status(500).send("Error uploading file");
        } else {
          res.send("File uploaded successfully");
        }
      });
    });

  req.file.pipe(csvParser());
};
const isEmpty = (obj) => {
  return (
    Object.keys(obj).length === 0 || Object.values(obj).every((value) => !value)
  );
};
const uploadBatch = async (req, res) => {
  const dataInput = req.body;
  try {
    
    let filteredData = dataInput.filter((item) => !isEmpty(item));
    filteredData = filteredData.map((item) => {
      item["source"] = "Bulk Upload";
      return item;
    });
    await data.insertMany(filteredData);
    return res.status(200).json({ message: "Data added successfully" });
  } catch (e) {
    return res.status(401).json({ error: "Invalid data" + e });
  }
};

const createData = async (req, res) => {
  try {
    const newData = new data(req.body);
    await newData.save();
    res.json(newData);
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error => " + error });
  }
};
 
 

const getData = async (req, res) => {
  try {
    const { startFullDate, endFullDate, page, limit, search, column, operator, value  } = req.query;
    console.log("startFullDate, endFullDate",startFullDate, endFullDate)
    const searchFilter = {
      ...(search && {
        $or: [
          { location: { $regex: search, $options: 'i' } }, 
          { category: { $regex: search, $options: 'i' } }, 
        ],
      }),
      ...(startFullDate && endFullDate && {
        date: {
          $gte: startFullDate, 
          $lte: endFullDate, 
        },
      }),
    };
    if (column && operator && value) {
      const validColumns = ['location', 'category', 'quantity','emission_tracker','source','name'];
      if (!validColumns.includes(column)) {
        return res.status(400).json({ error: `Invalid column name: ${column}` });
      }

      const validOperators = ['equals', 'startsWith', 'endsWith', 'contains', 'greaterThan', 'lessThan'];
      if (!validOperators.includes(operator)) {
        return res.status(400).json({ error: `Invalid operator: ${operator}` });
      }

      let filterExpression;
      switch (operator) {
        case 'equals':
          filterExpression = { [column]: value };
          break;
        case 'startsWith':
          filterExpression = { [column]: { $regex: new RegExp(`^${value}`, "i") } };
          break;
        case 'endsWith':
          filterExpression = { [column]: { $regex: new RegExp(`${value}$`, "i") } };
          break;
        case 'contains':
          filterExpression = { [column]: { $regex: new RegExp(value, "i") } };
          break;
        case 'greaterThan':
          filterExpression = { [column]: { $gt: value } };
          break;
        case 'lessThan':
          filterExpression = { [column]: { $lt: value } };
          break;
        default:
          
          break;
      }

      searchFilter.$and = searchFilter.$and || [];
      searchFilter.$and.push(filterExpression);
    }

    console.log("datacontroller searchfilter", searchFilter);

    const total = await data.countDocuments(searchFilter);
    const totalPages = Math.ceil(total / limit);
    const pageMin = Math.min(Math.max(page, 1), totalPages);
    const skip = (page - 1) * limit;

    const dataemission = await data.find(searchFilter, {}) 
     
      

    res.json({ dataemission, total, pageMin, totalPages });
  } catch (e) {
    return res.status(400).json({ error: "Internal Server Error" + e });
  }
};

 

 

function convertISODateToEpoch(isoDate) {
  
  try {
    return new Date(isoDate).getTime();
  } catch (error) {
    console.error("Error parsing ISO 8601 date:", error);
    
    return 0; 
  }
}
 

const updateData = async (req, res) => {
  console.log("req.params.id" + req.params.id);
  try {
    
    const updatedData = await data.findOneAndUpdate(
      { _id: req.params.id },
      req.body 
    );

    if (!updatedData) {
      return res.status(404).json({ error: "Data not found" });
    }
    return res.status(200).json({ message: "Data updated successfuly" });
    
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const deleteData = async (req, res) => {
  console.log("here");
  try {
    const myData = await data.findById(req.params.id);
    
    if (myData) {
      
      await data.deleteOne({ _id: myData._id });
      res.json({ message: "Data deleted" });
    } else {
      res.status(404);
      throw new Error("Data not found  ");
    }
  } catch (e) {
    return res.status(404).json({ error: "Data not found" });
  }
};

function convertDateToEpoch(date) {
  
  console.log("ccc",date)
  try {
    if (/^\d{4}$/.test(date)) { 
      console.log("new Date(date, 0, 1).getTime()",new Date(date, 0, 1))
      const dateFomrat = new Date(date, 0, 1); 
      const year = dateFomrat.getFullYear();
  const month = String(dateFomrat.getMonth() + 1).padStart(2, '0'); 
  const day = String(dateFomrat.getDate()).padStart(2, '0'); 
 
  return `${year}-${month}-${day}`;
    }   else {
      throw new Error("Invalid date format. Expected YYYY or YYYY-MM-DD.");
    }
  } catch (error) {
    console.error("Error converting date to epoch:", error);
    
    return 0; 
  }
}

 

 const generateRow = async (req, res) => {
  const rows = req.body;
  let i = 0;
  
  const result = await Promise.all(
    rows.map(async (row) => {
      const { date, category, location } = row;
      
       
       let formattedDate = null;
       if (date !== null) {
         formattedDate =  convertDateToEpoch((date));
       }else{
        formattedDate=NULL
       }
       console.log('formattedDate',formattedDate,new Date(formattedDate))
      try {
        
        i++;
        
        const emission = await data.findOne({
          source: { $ne: "Bulk Upload" },
          date:formattedDate,
          category: category,
          location: location,
        });
        if (emission) {
          return {
            ...row,
            emission_tracker: emission.emission_tracker,
            scope1: emission.scope1,
            scope2: emission.scope2,
            scope3: emission.scope3,
          };
        } else {
          return {
            ...row,
            emission_tracker: 0,
            scope1: 0,
            scope2: 0,
            scope3: 0,
          };
        }
      } catch (error) {
        console.log("errot" + error);
        
      }
    })
  );
  
  res.status(200).json({ message: "success", data: result });
};    

 

const formatYearToISO = (year) => {
  
  const date = new Date(Date.UTC(year, 0, 1, 0, 0, 2, 15)); 

  
  const isoString = date.toISOString();

  return isoString;
};

export {
  uploadFile,
  uploadBatch,
  createData,
  updateData,
  deleteData,
  getData,
  generateRow,
};