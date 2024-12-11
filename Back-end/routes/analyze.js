const express=require('express');
const { analyzeFolderController } = require('../controllers/analyzeController');

const router=express.Router();

router.post('/',analyzeFolderController);


module.exports=router;