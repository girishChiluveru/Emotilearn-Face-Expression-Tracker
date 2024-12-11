const express=require('express');

const { handleReport,handleSpecificSession } = require('../controllers/report1');

const router=express.Router();

router.get('/', handleReport);


router.get('/:childName/:sessionID', handleSpecificSession);

module.exports=router;