const express=require('express');

const { handleResult } = require('../controllers/result');

const router=express.Router();

router.get('/',handleResult);


module.exports=router;