const express=require('express');
const { handleStoreEmotions } = require('../controllers/storeEmotions');

const router=express.Router();

router.post('/',handleStoreEmotions);



module.exports=router;