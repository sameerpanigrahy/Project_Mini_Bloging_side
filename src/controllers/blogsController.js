const blogModel = require("../model/blogsModel")
const authorModel = require("../model/authorsModel")
const mongoose = require('mongoose');

const { isValidRequestBody ,isValid,isValidfild} = require("../validator/validator")

//----------------------------Handler create A blog--------------------------//

const createBlog = async function (req, res) {
  try {
    let data = req.body;

    if (!isValidRequestBody(data)) return res.status(400).send({ status: false, message: "Body can't be empty it must contain some data." })

      if (!isValid(data.title)) return res.status(400).send({ status: false,msg: "title is  requred" })
      if (!isValid(data.body)) return res.status(400).send({ status: false,msg: "body is  requred" })
      if (!isValid(data.category)) return res.status(400).send({ status: false,msg: "category is  requred" })
      if (!isValid(data.authorId)) return res.status(400).send({ status: false,msg: "authorId is  requred" })
     
    if (!mongoose.isValidObjectId(data.authorId)) return res.status(400).send({ status: false, msg: "Type of BlogId is must be ObjectId " })
    let checkAuthor = await authorModel.findById(data.authorId);

    if (!checkAuthor) {
      res.status(400).send({ msg: "author id is not present" });
    }
    

    if (data.isPublished == true) {
      //created new attribute "publishedAt" in data 
      data["publishedAt"] = Date.now()
    }
    if (data.isDeleted == true) {
      
      return res.status(400).send({status:false,msg:"you can't delete a blog while creating"})
      
    }

    let createData = await blogModel.create(data);
    res.status(201).send({ status: true,msg:"Blog successfully created", data: createData });
  } catch (error) {1
    res.status(500).send({ msg: error.message });
  }
};

//----------------------------Handler for fetch a blog--------------------------//
const getblog = async function (req, res) {
  try {
    

    let { _id, title, authorId, category, tags, subcategory } = req.query;
    let query = {};
    if (_id != null) query._id = _id;
    if (title != null) query.title = title;
    if (authorId != null) query.authorId = authorId;
    if (category != null) query.category = category;
    if (tags != null) query.tags = tags;
    if (subcategory != null) query.subcategory = subcategory;
    query.isDeleted = false
    query.isPublished = true
    let finalFilter = await blogModel.find(query);
    if (finalFilter.length == 0) return res.status(404).send({ status: true, msg: "Request is Not found" })
    return res.status(200).send({ status: true, msg: finalFilter });

  } catch (error) {
    res.status(500).send({ status: false, msg: "server error" });
  }
};

//----------------------------Handler for Update blog--------------------------//
const updateBlog = async function (req, res) {
  try {
    let blogId = req.params.blogId;
    

    if (!mongoose.isValidObjectId(blogId)) return res.status(400).send({ status: false, msg: "Type of BlogId must be ObjectId " });
    let foundDoc = await blogModel.findById( blogId);
    if (foundDoc == null)
      return res.status(404).send({ status: false, msg: "Blog is not found" });
    let findByBlogId = foundDoc.authorId
    if(findByBlogId != req.decodedToken.authorId){
      return res.status(401).send({status:false , msg : "Unauthorized Author"})
    }
    
    
    //-----------authorization start-----------//

    // let authorId = req.params.blogId
    // let authorized_id = req.decodedToken["authorId"]
    // if (userid != authorized_id) return res.status(403).send({ status: false, msg: "user is not authorized for this operation" })

    //------------------------authorization end------------//

    let data = req.body;
    if (!isValidRequestBody(data))return res.status(400).send(
      {
        status: false,
        msg: "Body can't be empty it must contain some data.",
      });
      
    let tags = data.tags;
    let category = data.category;
    if (!isValidfild(category)) return res.status(400).send({ status: false,msg: "category can't be empty String " })
    let subcategory = data.subcategory;
    let title = data.title;
    if (!isValidfild(title)) return res.status(400).send({ status: false,msg: "title can't be empty String " })
    let bodyData = data.body;
    if (!isValidfild(bodyData)) return res.status(400).send({ status: false,msg: "Data of body-fild can't be empty String " })
    foundDoc.tags = foundDoc.tags.concat(tags);

    foundDoc.subcategory = foundDoc.tags.concat(subcategory);
    let result1 = foundDoc.tags.filter((b) => b != null);
    let result2 = foundDoc.subcategory.filter((b) => b != null);

    if (foundDoc && foundDoc.isDeleted == false) {
      let updatedDoc = await blogModel.findOneAndUpdate(
        { _id: blogId },
        {
          tags: result1,
          category: category,
          subcategory: result2,
          title: title,
          body: bodyData,
          $set: { isPublished: true, publishedAt: Date.now() },
        },
        { new: true }
      );
      return res
        .status(200)
        .send({ status: true, msg: " Blog is succesfully Upadated",data:updatedDoc });
    }
    return res.status(400).send({status:false , msg : "blog has been deleted"})
  } catch (err) {
  
    res.status(500).send({ status: false, msg: err.message });
  }
};

//----------------------------Handler for Dlete blog--------------------------//


const deleteBlog = async function (req, res) {
try{
  let blogId = req.params.blogId;

  if (!mongoose.isValidObjectId(blogId)) return res.status(400).send({ status: false, msg: "Type of BlogId is must be ObjectId " })
  
  let findByblogId = await blogModel.findById(blogId);
  if (!findByblogId) return res.status(404).send({ status: false, msg: "Blog is not found" });

  //-----------authorization start-----------//

  let userid = findByblogId["authorId"]
  let authorized_id = req.decodedToken["authorId"]
  if (userid != authorized_id) return res.status(403).send({ status: false, msg: "Unauthorized Author" })

  //------------------------authorization end------------//

  if (findByblogId.isDeleted == true) {
    return res.status(400).send({ status: false, msg: 'this blog  is already deleted.' })

  } else {
    let updatebloge = await blogModel.findOneAndUpdate({ _id: blogId }, { isDeleted: true,deletedAt:Date.now()}, { new: true });
    return res.status(200).send({ status: true, msg: "blog deleted successfully" });
  }
}
catch(err){
  return res.status(500).send({ status: true, msg:err.message });
}
};


const deleteBlogByQuery = async function (req, res) {
  try {

    let data = req.query;
    if (Object.keys(data).length === 0) return res.status.send({ status: true, msg: "query params can't be empty==>>>choose what you want to delete" })

    let { _id, title, authorId, category, tags, subcategory } = req.query;

    let query = {};


    if (authorId != null){
      query.authorId = authorId;
     if(authorId!=req.decodedToken["authorId"]) return res.status(403).send({ status: false, msg: "user is not authorized for this operation" })

    }
    
    if (_id != null){ 
      if (!mongoose.isValidObjectId(_id)) return res.status(400).send({ status: false, msg: "Type of BlogId must be ObjectId " })
      query._id = _id;
    }
    if (title != null) query.title = title;
    if (category != null) query.category = category;
    if (tags != null) query.tags = tags;
    if (subcategory != null) query.subcategory = subcategory;
    query.isDeleted=false
    let findData = await blogModel.find(query)
    if (findData.length==0) return res.status(404).send({ status: false, msg: "Blog is not found" })
 
    query.authorId= req.decodedToken["authorId"]


    let deleteData = await blogModel.updateMany(
      query,
      { $set: { isDeleted: true,deletedAt:Date.now() } },
      { new: true }
    );
    if(deleteData. modifiedCount==0) return res.status(404).send({status:false,msg:"Blog is not found"})
    return res.status(200).send({ status: true, msg: "blog is deleted successfully" });
  } catch (error) {
    return res.status(500).send({ status: false, msg: error.message });
  }
};

// const undeleteall=async function(req,res){
//   let undelete=await blogModel.updateMany({},{isDeleted:false,deletedAt:null},{new:true})
//   res.status(200).send({status:true,msg:"done he....:)>>:)>>:)"})
// }




module.exports.createBlog = createBlog
module.exports.getblog = getblog
module.exports.updateBlog = updateBlog
module.exports.deleteBlog = deleteBlog;
module.exports.deleteBlogByQuery = deleteBlogByQuery
//module.exports. undeleteall= undeleteall
