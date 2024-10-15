const App = require('../models/app');
const appVisitorModel = require('../models/appVisitors');
const appLeadsModel = require('../models/appLeads');
const appModel=require('../models/app');
const featureListModel=require('../models/featureList');
const { default: mongoose } = require('mongoose');
const Bowser = require("bowser"); 

async function updateCount(req) {
    try {
        await appModel.updateOne({ _id: req.body.app }, { $inc: { visitorCount: 1 } });
        await featureListModel.updateOne({ type: req.body.agent_type }, { $inc: { visitorCount: 1 } });
    } catch (error) {
        console.log(error)
    }
}


module.exports={
    calculatorStats: async(req, res) => {
        try {
            let app=req.body.appId;
            let results=await appVisitorModel.find({
                app,
                createdAt: {
                    $gte: new Date(req.body.startDate), 
                    $lt: new Date(req.body.endDate) 
                }
        
        },{browser:1,createdAt:1,_id:0,device:1}).lean();
        const leadsCount=await appLeadsModel.count({app, createdAt: {
            $gte: new Date(req.body.startDate), 
            $lt: new Date(req.body.endDate) 
        }});
        let conversionPercentage=results.length> 0 ?((leadsCount/results.length)*100):0;
        let conversionRate= Number.isInteger(conversionPercentage)?conversionPercentage  :  conversionPercentage.toFixed(2);
            let response={
                trafficStats:{},
                devices:{},
                browser:{},
                totalVisitors:results.length,
                conversions:leadsCount,
                conversionRate
            }
            results.forEach((el) => {
                let formattedDate=el.createdAt.toLocaleDateString()
                
                // traffic Stats or page Views
                response.trafficStats[formattedDate] = (response.trafficStats[formattedDate] || 0) + 1;

                // browsers
                response.browser[el.browser] = (response.browser[el.browser] || 0) + 1;

                // devices
                response.devices[el.device] = (response.browser[el.device] || 0) + 1;

              });
            return res.status(200).json({
                message: 'calc stats fetched successfully',
                data:response
            })
        } catch (error) {   
        }
    },

    generateVisitor: async (req, res) => {
        try {
            const browser = Bowser.getParser(req.body.userAgent).parsedResult.browser.name;
            const visitorCreated = new appVisitorModel({
                ...req.body,
                browser
                    
            });
            let key=visitorCreated._id;
            await visitorCreated.save();
            updateCount(req)

            return res.status(200).json({
                message: 'Visits updated successfully',
                key
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    fetchVisitors:async (req,res)=>{
        try {
        const allVisitors=await appVisitorModel.aggregate([
            {
              $match: {
                app: new mongoose.Types.ObjectId(req.body.appId),
              }
            },
            {
              $addFields: {
                date:{
                 $dateToString: {
                    format: "%d %b %Y %H:%M:%S",  
                    date: "$createdAt", 
                  }
                }
              }
            },
            {
             $project: {
               date:1,
              createdAt:0,
               updatedAt:0,
               browser:1,updatedAt:1,createdAt:1,device:1,
               utm_source:1,
               utm_medium:1,
               utm_campaign:1,
               utm_term:1,
               utm_content:1,
             }
            }
          ])
           res.status(201).json({
                message: "fetch visitors successfully",
                data: allVisitors,
              });
        } catch (error) {
            // createLog({userId:req.user.userId.toString(),error:error.message,appId:req.body.appId})
            res.status(500).json({ error: error.message });
        }
    },
    get_leads: async (req, res) => {
        try {
          const response = await appVisitorModel.find({
            type: 'Lead',
            app: new mongoose.Types.ObjectId(req.body.appId)
          }).populate("lead").lean();
      
          let finalResponse = { columns: [], data: [] };
          let columnSet = new Set();
      
          const fixedColumns = ["browser", "device", "utm_source", "utm_campaign", "utm_term", "utm_content"];
          fixedColumns.forEach(col => columnSet.add(col));
      
          response.forEach(el => {
            let fieldCount = {}; 
            let dataRow = {};  
      
            dataRow["browser"] = el.browser || 'Not Applicable';
            dataRow["device"] = el.device || 'Not Applicable';
            dataRow["utm_source"] = el.utm_source || 'Not Applicable';
            dataRow["utm_campaign"] = el.utm_campaign || 'Not Applicable';
            dataRow["utm_term"] = el.utm_term || 'Not Applicable';
            dataRow["utm_content"] = el.utm_content || 'Not Applicable';
      
            el.lead.fields.forEach(field => {
                let fieldName = field.field_name;
                fieldName=fieldName.split(' ').join('');
              fieldCount[fieldName] = (fieldCount[fieldName] || 0) + 1;
      
              if (fieldCount[fieldName] > 1) {
                fieldName = `${fieldName}_${fieldCount[fieldName] - 1}`;
              }
      
              columnSet.add(fieldName);
              dataRow[fieldName] = field.value;
            });
      
            finalResponse.data.push(dataRow);
          });
      
          finalResponse.columns = Array.from(columnSet);
      
          finalResponse.data = finalResponse.data.map(row => {
            return finalResponse.columns.map(column => row[column] || 'Not Applicable');
          });
      
          return res.status(200).json({ data: finalResponse });
      
        } catch (error) {
          return res.status(500).json({ message: 'Internal server error' });
        }
      },
    saveLead:async(req,res)=>{
        try {
            const leadCreated = new appLeadsModel({
                ...req.body,
            });
            await leadCreated.save();
           let response= await appVisitorModel.updateOne({ _id:req.body.key},{lead:leadCreated._id,type:'Lead'});
            return res.status(200).json({message:'Lead created successfully',data:response});
        } catch (error) {
            res.status(500).json({ error: error.message });
        }   
    },
}