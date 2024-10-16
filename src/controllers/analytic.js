const App = require('../models/app');
const appVisitorModel = require('../models/appVisitors');
const appModel=require('../models/app');
const featureListModel=require('../models/featureList');
const { default: mongoose } = require('mongoose');
const Bowser = require("bowser");
const appVisitorsModel = require('../models/appVisitors');
const appLeadsModel = require('../models/appLeads');
async function updateCount(req) {
  try {
        await appModel.updateOne({ _id: req.body.app,}, { $inc: { visitorCount: 1 } });
    await featureListModel.updateOne({ type: req.body.agent_type }, { $inc: { visitorCount: 1 } });
  } catch (error) {
    console.log(error)
  }
}


module.exports={
  calculatorStats: async (req, res) => {
    try {
      const { appId, startDate, endDate } = req.body;
     const results=await appVisitorModel.aggregate( [
        {
          $match: {
            app: new mongoose.Types.ObjectId(appId),
            createdAt: {
              $gte: new Date(startDate),
              $lt: new Date(endDate)
            }
          }
        },
        {
          $facet: {
            visitorsData: [
              {
                $project: {
                  browser: 1,
                  createdAt: 1,
                  device: 1,
                  _id: 0
                }
              }
            ],
            leadsCount: [
              {
                $match: {
                  type: 'Lead'
                }
              },
              {
                $count: 'totalLeads'
              }
            ]
          }
        },
        {
          $project: {
            visitorsData: 1,
            leadsCount: { $arrayElemAt: ["$leadsCount.totalLeads", 0] }
          }
        },

      ]);


      const visitors = results[0]?.visitorsData || [];
      const leadsCount = results[0]?.leadsCount || 0;

      let response = {
        trafficStats: {},
        devices: {},
        browser: {},
        totalVisitors: visitors.length,
        conversions: leadsCount,
        conversionRate: 0,
      };

      if (visitors.length > 0 && leadsCount>0) {
        const conversionPercentage = (leadsCount / visitors.length) * 100;
        response.conversionRate = Number.isInteger(conversionPercentage)
          ? conversionPercentage
          : conversionPercentage.toFixed(2);
      }
      visitors.forEach(({ createdAt, browser, device }) => {
        const formattedDate = new Date(createdAt).toLocaleDateString();

        response.trafficStats[formattedDate] = (response.trafficStats[formattedDate] || 0) + 1;

        // Browser count
        response.browser[browser] = (response.browser[browser] || 0) + 1;

        // Device count
        response.devices[device] = (response.devices[device] || 0) + 1;
      });

      return res.status(200).json({
        message: 'Calc stats fetched successfully',
        data: response,
      });

    } catch (error) {
      return res.status(500).json({ message: 'Internal server error' });
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
                type:{$ne:'Deleted'}
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
            date: 1,
            browser: 1, 
            utm_source: 1,
            utm_medium: 1,
            utm_campaign: 1,
            utm_term: 1,
            utm_content: 1,
            transaction_completed: 1,
            amount: 1,
            currency: 1,
          }
        }
      ])

      const fixedColumns = [
        { key: "browser", label: "Browser" },
        { key: "device", label: "Device Type" },
        { key: "utm_source", label: "Utm Source" },
        { key: "utm_campaign", label: "Utm Campaign" },
        { key: "utm_term", label: "Utm Term" },
        { key: "utm_content", label: "Utm Content" },
        { key: "transaction_completed", label: "Transaction Completed" },
        { key: "amount", label: "Amount" },
        { key: "currency", label: "Currency" }
      ];

      let response = {
        columns: fixedColumns.map((entry) => entry.label),
        data: allVisitors.map((visitor) => {
          return fixedColumns.map(entry => {
            const key = entry.key;
            return visitor[key] ? visitor[key] : 'Not Applicable'
          })
        }),
        idsArray:allVisitors.map(el=>el._id)
      }
      res.status(201).json({
        message: "fetch visitors successfully",
        data: response,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  get_leads: async (req, res) => {
    try {
      const response = await appVisitorModel.aggregate([
        {
          $match: {
            app: new mongoose.Types.ObjectId(req.body.appId),
            type: { $ne: 'Deleted' },
          }
        },
        {
          $addFields: {
            date: {
              $dateToString: {
                format: "%d %b %Y %H:%M:%S",
                date: "$createdAt",
              }
            }
          }
        },
        {
          $lookup: {
            from: 'appleads',
            localField: 'lead',
            foreignField: '_id',
            as: 'lead'
          }
        },
        {
          $unwind: {
            path: '$lead',
          }
        },
        {
          $project: {
            date: 1,
            browser: 1,
            device: 1,
            utm_source: 1,
            utm_medium: 1,
            utm_campaign: 1,
            utm_term: 1,
            utm_content: 1,
            transaction_completed: 1,
            amount: 1,
            currency: 1,
            'lead.fields': 1
          }
        }
      ]);

      let finalResponse = { columns: [], data: [], idsArray:[] };
      let columnSet = new Set(); // as coloumns have many fields depending upon lead fields

      const fixedColumns = [
        { key: "browser", label: "Browser" },
        { key: "device", label: "Device Type" },
        { key: "utm_source", label: "Utm Source" },
        { key: "utm_campaign", label: "Utm Campaign" },
        { key: "utm_term", label: "Utm Term" },
        { key: "utm_content", label: "Utm Content" },
        { key: "transaction_completed", label: "Transaction Completed" },
        { key: "amount", label: "Amount" },
        { key: "currency", label: "Currency" }
      ];
      fixedColumns.forEach(entry => columnSet.add(entry.label));

      response.forEach(el => {
        let fieldCount = {};
        finalResponse.idsArray.push(el._id);
        const dataRow = fixedColumns.map(entry => {
          const key =entry.key;
          return el[key] || 'Not Applicable';
        });
        el.lead?.fields.forEach(field => {
          let fieldName = field.field_name;
          fieldName = fieldName.split(' ').join('');
          // Increment the field count, defaulting to 0 if it doesn't exist for example fieldCount={} => as email does not exist -> {email:0} else {email:fieldCount[email]+1}
          fieldCount[fieldName] = (fieldCount[fieldName] || 0) + 1;

          if (fieldCount[fieldName] > 1) {
            fieldName = `${fieldName}_${fieldCount[fieldName] - 1}`;
          }

          columnSet.add(fieldName);
          dataRow.push(field.value);
        });

        finalResponse.data.push(dataRow);
      });

      finalResponse.columns = Array.from(columnSet);


      return res.status(200).json({ data: finalResponse, });

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
  deleteVisitors:async (req, res) => {
    try {
        const { visitorIds } = req.body;
        if (!Array.isArray(visitorIds) || visitorIds.length === 0) {
            return res.status(400).json({ error: 'No visitor IDs provided' });
        }

        const result = await appVisitorsModel.updateMany(
            { _id: { $in: visitorIds } },
            { type: 'Deleted' } 
        );

        res.status(200).json({
            message: 'Visitors deleted successfully',
        });
   } catch (error) {
       // Send error response
       res.status(500).json({ error: error.message });
   }
},
}