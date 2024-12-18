const appVisitorModel = require('../models/appVisitors');
const appModel=require('../models/app');
const featureListModel=require('../models/featureList');
const Bowser = require("bowser");
const moment = require('moment');
const appVisitorsModel = require('../models/appVisitors');
const catchAsync=require('../utils/catchAsync');
const moongooseHelper=require('../utils/moongooseHelper');
const ApiError=require('../utils/throwError');
const ApiResponse = require('../utils/apiResponse');
const userModel=require('../models/user.model');
updateCount=catchAsync(async (req,isIncrease=false)=>{
    if(!moongooseHelper.isValidMongooseId(req.body.app)){
      throw new ApiError(400,'AppId not valid');
    }
    await appModel.updateOne({ _id: req.body.app,},  { $inc: { visitorCount: isIncrease? 1:-req.body[req.path=='/delete_leads'?'leadsIds':'visitorIds'].length } });
    await featureListModel.updateOne({ type: req.body.agent_type },  { $inc: { visitorCount: isIncrease? 1:-req.body[req.path=='/delete_leads'?'leadsIds':'visitorIds'].length  } });
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
            type:{$nin:['Deleted']},
            createdAt: {
              $gte: new Date(startDate),
              $lte: new Date(endDate)
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
        const formattedDate = moment(createdAt).format("DD/MM/YYYY")

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
      updateCount(req,true);
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
      const allVisitors = await appVisitorModel.find({
        app:moongooseHelper.giveMoongooseObjectId(appId), 
        type: 'Visitor', 
        createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) }
      },{
        createdAt: 1,
            browser: 1, 
            device:1,
            utm_source: 1,
            utm_medium: 1,
            utm_campaign: 1,
            utm_term: 1,
            utm_content: 1
      })
      .sort({ updatedAt: -1 }).lean();      
      const fixedColumns = [
        { key: "createdAt", label: "Date" },
        { key: "browser", label: "Browser" },
        { key: "device", label: "Device Type" },
        { key: "utm_source", label: "Utm Source" },
        { key: "utm_campaign", label: "Utm Campaign" },
        { key: "utm_term", label: "Utm Term" },
        { key: "utm_content", label: "Utm Content" },
      ]; 
      
      let response = {
        columns: fixedColumns.map((entry) => entry.label),
        data: allVisitors.map((visitor) => {
          return fixedColumns.map(entry => {
            const key = entry.key;
            
            if(key=='createdAt'){
              return moment(visitor.createdAt).format('LLL');
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
    if (!moongooseHelper.isValidMongooseId(appId)) {
      throw new ApiError(400, 'AppId not valid');
    }
    const countUserCreatedLeads = await appVisitorModel.countDocuments({
      app: moongooseHelper.giveMoongooseObjectId(appId), type: 'Lead',
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    });
    const {totalLeadsCount} = await userModel
    .findOne({_id:req.user.userId},{totalLeadsCount:1,_id:0})

    const responseQuery = appVisitorModel.find({
      app: moongooseHelper.giveMoongooseObjectId(appId),
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
      type:'Lead',
    });

    if (totalLeadsCount !== -1) {
      responseQuery.limit(totalLeadsCount);
    }

    const response = await responseQuery
      .sort({ updatedAt: -1 })
      .select(
        "createdAt lead_fields browser utm_source device utm_medium utm_campaign utm_term utm_content transaction_completed amount currency"
      );
      
    let finalResponse = { columns: [], data: [], idsArray: [],limitExceed:false };
    const fixedColumns = [
      { key: "browser", label: "Browser" },
      { key: "device", label: "Device Type" },
      { key: "utm_source", label: "Utm Source" },
      { key: "utm_campaign", label: "Utm Campaign" },
      { key: "utm_term", label: "Utm Term" },
      { key: "utm_content", label: "Utm Content" },
      { key: "transaction_completed", label: "Transaction Completed" },
      { key: "transactionAmount", label: "Transaction Amount" }
    ];
    const maxLeadFields = new Set();
    response.forEach(el => {
      fieldCounts = {};
      el.lead_fields.forEach(field => {
        let columnName=field.field_name;
        if(field.subtype){
          columnName=`${field.subtype} (${field.field_name} ${field.subtype})`
        }
        maxLeadFields.add(columnName);
      });
    });
    let maxFieldsArray=Array.from(maxLeadFields);
    finalResponse.columns = ["Date", ...maxFieldsArray, ...fixedColumns.map(col => col.label)];

    response.forEach(el => {
      finalResponse.idsArray.push(el._id);
      const dataRow = [moment(el.updatedAt).format('LLL')];
      maxFieldsArray.forEach(columnName => {
        fieldCounts = {};
        const matchingField = el.lead_fields.find(field => {
          let columnNameGiven=field.field_name;
          if(field.subtype){
            columnNameGiven=`${field.subtype} (${field.field_name} ${field.subtype})`
          }
          return columnNameGiven === columnName;
        });
        dataRow.push(matchingField ? matchingField.value : 'Not Applicable');
      });

      fixedColumns.forEach(entry => {
        if (entry.key === 'transactionAmount') {
          const amount = el['amount'];
          const currency = el['currency'];
          dataRow.push(amount && currency ? `${amount} ${currency}` : 'Not Applicable');
        } 
        else if (entry.key === 'transaction_completed') {
          const transactionCompleted = el['transaction_completed'];
          if (transactionCompleted === true) {
            dataRow.push('True');
          } else if (transactionCompleted === false) {
            dataRow.push('False');
          } else {
            dataRow.push('Not Applicable');
          }
        } else {
          dataRow.push(el[entry.key] || 'Not Applicable');
        }
      });

      finalResponse.data.push(dataRow);
    });
    if(finalResponse.data.length<countUserCreatedLeads){
      const newArray = Array(finalResponse.columns.length).fill({});
      finalResponse.limitExceed=true;
      while(finalResponse.data.length<countUserCreatedLeads){
        finalResponse.data.unshift(newArray);
      }
    }
    return res.status(200).json(new ApiResponse(200, 'Leads fetched successfully', finalResponse));
  }
)
,
  saveLead:catchAsync(
     async(req,res)=>{
    const duplicateLead=[];
    req.body.fields.forEach((field) => {
      if (field.unique == true)
          duplicateLead.push({$elemMatch: { field_name: field.field_name, value:field.value } })
  });
     if(duplicateLead.length>0){
       const findDuplicatesLeadFields = await appVisitorModel.findOne(
        {
          lead_fields: {
            $all: duplicateLead
          }
        }
       );

      if(findDuplicatesLeadFields){
        return res.status(201).json('Lead Saved SucessFully')
      }
    }
     await appVisitorModel.updateOne(
        { _id: moongooseHelper.giveMoongooseObjectId( req.body.visitorId) },             
        { $set: { lead_fields: req.body.fields,type:'Lead'} } 
      );
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
            {type:'Visitor',_id: { $in: visitorIds } },
            { type: 'Deleted' } 
        );
        
        updateCount(req);
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
      { type:'Lead',_id: { $in: leadsIds } }, 
      { $set: { lead_fields: [] ,type:'Deleted'} } 
    );
  updateCount(req);
  res.status(200).json(
    new ApiResponse(200,'Leads deleted successfully')
   );
  })
}