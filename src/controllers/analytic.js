const appVisitorModel = require('../models/appVisitors');
const appModel=require('../models/app');
const featureListModel=require('../models/featureList');
const Bowser = require("bowser");
const appVisitorsModel = require('../models/appVisitors');
const appLeadsModel = require('../models/appLeads');
const catchAsync=require('../utils/catchAsync');
const moongooseHelper=require('../utils/moongooseHelper');
const ApiError=require('../utils/throwError');
const ApiResponse = require('../utils/apiResponse');
updateCount=catchAsync(async (req)=>{
  if(!moongooseHelper.isValidMongooseId(req.body.app)){
    throw new ApiError(400,'AppId not valid');
  }
  await appModel.updateOne({ _id: req.body.app,}, { $inc: { visitorCount: 1 } });
  await featureListModel.updateOne({ type: req.body.agent_type }, { $inc: { visitorCount: 1 } });
})


module.exports={
  calculatorStats: catchAsync(
     async (req, res) => {
      const { appId, startDate, endDate } = req.body;
      if(!moongooseHelper.isValidMongooseId(appId)){
        throw new ApiError(400,'AppId not valid')
      }
     const results=await appVisitorModel.aggregate( [
        {
          $match: {
            app: moongooseHelper.giveMoongooseObjectId(appId),
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

      return res.status(200).json(
        new ApiResponse(200,'Calc stats fetched successfully',response)
      );
  }),
  generateVisitor: catchAsync(
     async (req, res) => {
      if(!moongooseHelper.isValidMongooseId(req.body.app)){
        throw new ApiError(400,'AppId not valid')
      }
      if(!moongooseHelper.isValidMongooseId(req.body.live_app)){
        throw new ApiError(400,'live AppId not valid')
      }
      const browser = Bowser.getParser(req.body.userAgent).parsedResult.browser.name;
      const visitorCreated = new appVisitorModel({
        ...req.body,
        browser

      });
      let key=visitorCreated._id;
      await visitorCreated.save();
      updateCount(req);
      return res.status(201).json(
        new ApiResponse(201, 'Visits updated successfully',key)
    );
  }),
    fetchVisitors:catchAsync(
       async (req,res)=>{
        const { appId, startDate, endDate } = req.body;
        if(!moongooseHelper.isValidMongooseId(appId)){
          throw new ApiError(400,'AppId not valid')
        }
        const allVisitors=await appVisitorModel.aggregate([
        {
          $match: {
            app: moongooseHelper.giveMoongooseObjectId(appId),
            type:{$ne:'Deleted'},
            createdAt: {
              $gte: new Date(startDate),
              $lt: new Date(endDate)
            }
          }
        },
        {
          $sort: {
            updatedAt: -1,
          },
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
        { key: "transactionAmount",label:"Transaction Amount" }
      ];

      let response = {
        columns: fixedColumns.map((entry) => entry.label),
        data: allVisitors.map((visitor) => {
          return fixedColumns.map(entry => {
            const key = entry.key;
            if (key === 'transactionAmount') {
              const amount = visitor['amount'];
              const currency = visitor['currency'];
              return amount && currency ? `${amount} ${currency}` : 'Not Applicable';
            }
            if (key === 'transaction_completed') {
            const transactionCompleted = visitor['transaction_completed'];
            if (transactionCompleted === true) {
                return 'True';
            } else if (transactionCompleted === false) {
                return 'False';
            } else {
                return 'Not Applicable';
            }
            }
            return visitor[key] ? visitor[key] : 'Not Applicable'
          })
        }),
        idsArray:allVisitors.map(el=>el._id)
      }
      res.status(200).json(
        new ApiResponse(200,"fetch visitors successfully",response) 
    );
  }),
  get_leads: catchAsync(
     async (req, res) => {
      const { appId, startDate, endDate } = req.body;
      if(!moongooseHelper.isValidMongooseId(appId)){
        throw new ApiError(400,'AppId not valid')
      }
      const response = await appVisitorModel.aggregate([
        {
          $match: {
            app: moongooseHelper.giveMoongooseObjectId(appId),
            createdAt: {
              $gte: new Date(startDate),
              $lt: new Date(endDate)
            }
          }
        },
        {
          $sort: {
            updatedAt: -1,
          },
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
            'lead.fields': 1,
            'lead._id':1
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
        { key: "transactionAmount",label:"Transaction Amount" }
      ];
      fixedColumns.forEach(entry => columnSet.add(entry.label));

      response.forEach(el => {
        let fieldCount = {};
        finalResponse.idsArray.push(el.lead._id);
        const dataRow = fixedColumns.map(entry => {
          const key =entry.key;
          if (key === 'transactionAmount') {
            const amount = el['amount'];
            const currency = el['currency'];
            return amount && currency ? `${amount} ${currency}` : 'Not Applicable';
          }
          if (key === 'transaction_completed') {
             const transactionCompleted = el['transaction_completed'];
            if (transactionCompleted === true) {
                return 'True';
            } else if (transactionCompleted === false) {
                return 'False';
            } else {
                return 'Not Applicable';
            }
          }
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


      return res.status(200).json(
        new ApiResponse(200,'leads fetched successfully',finalResponse)
      );
  }),
  saveLead:catchAsync(
     async(req,res)=>{
      let key=req.body.key;
      if(!moongooseHelper.isValidMongooseId(key)){
        throw new ApiError(400,'Key Not Valid')
      }
      const leadCreated = new appLeadsModel({
        ...req.body,
      });
      await leadCreated.save();
       await appVisitorModel.updateOne({ _id:req.body.key},{lead:leadCreated._id,type:'Lead'});
        return res.status(201).json(
              new ApiResponse(201,'Lead created successfully')
            );
  }),
  deleteVisitors: catchAsync(
     async (req, res) => {
        const { visitorIds } = req.body;
        if (!Array.isArray(visitorIds) || visitorIds.length === 0) {
          throw new ApiError(400, 'No visitor IDs provided');
        }
       const invalidId=visitorIds.some(visitorId=>!moongooseHelper.isValidMongooseId(visitorId))
        if(invalidId){
          throw new ApiError(400, 'Visitor Id not valid');
        }
        await appVisitorsModel.updateMany(
            { _id: { $in: visitorIds } },
            { type: 'Deleted' } 
        );

        res.status(200).json(
          new ApiResponse(200,'Visitors deleted successfully')
         );
}),
  deleteLeads:catchAsync(async(req,res)=>{
    const { leadsIds } = req.body;
    if (!Array.isArray(leadsIds) || leadsIds.length === 0) {
      throw new ApiError(400, 'No Lead IDs provided');
    }
    const invalidId=leadsIds.some(leadId=>!moongooseHelper.isValidMongooseId(leadId))
    if(invalidId){
      throw new ApiError(400, 'Lead Id not valid');
    }

   await appVisitorsModel.updateMany(
      { lead: { $in: leadsIds } },
      { lead: null } 
  );
  await appLeadsModel.deleteMany({ _id: { $in: leadsIds } });
  res.status(200).json(
    new ApiResponse(200,'Leads deleted successfully')
   );
  })
}